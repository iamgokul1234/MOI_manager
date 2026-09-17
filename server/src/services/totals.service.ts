import mongoose, { PipelineStage } from 'mongoose';
import { Person } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { toObjectId } from '../utils';
import { Totals } from '../types';

/**
 * Totals are always computed from Transaction rows. Nothing is ever stored as
 * an aggregate on Person or FunctionEvent.
 *
 * Soft-deleted people are excluded from every normal total, so their
 * transactions are filtered out of each aggregation below.
 */

export const getDeletedPersonIds = async (userId: string): Promise<mongoose.Types.ObjectId[]> => {
  const rows = await Person.find({ userId, isDeleted: true }).select('_id').lean();
  return rows.map((r) => r._id);
};

/** $match stage for a user's "live" transactions (excluding soft-deleted people). */
export const activeTransactionMatch = async (
  userId: string,
  extra: Record<string, unknown> = {}
): Promise<PipelineStage.Match> => {
  const deleted = await getDeletedPersonIds(userId);
  const match: Record<string, unknown> = { userId: toObjectId(userId), ...extra };
  if (deleted.length > 0) match.personId = { ...(extra.personId as object | undefined), $nin: deleted };
  return { $match: match };
};

const emptyTotals = (): Totals => ({ received: 0, given: 0, transactionCount: 0 });

/** Overall received / given for a user. */
export const getOverallTotals = async (userId: string): Promise<Totals> => {
  const match = await activeTransactionMatch(userId);
  const rows = await Transaction.aggregate<{ _id: string; total: number; count: number }>([
    match,
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const totals = emptyTotals();
  for (const r of rows) {
    if (r._id === 'RECEIVED') totals.received = r.total;
    if (r._id === 'GIVEN') totals.given = r.total;
    totals.transactionCount += r.count;
  }
  return totals;
};

export interface PersonTotals extends Totals {
  lastTransaction: Date | null;
}

/** Received / given / last date per person, keyed by personId string. */
export const getTotalsByPerson = async (
  userId: string,
  personIds?: mongoose.Types.ObjectId[]
): Promise<Record<string, PersonTotals>> => {
  const extra: Record<string, unknown> = {};
  if (personIds) extra.personId = { $in: personIds };
  const rows = await Transaction.aggregate<{
    _id: { personId: mongoose.Types.ObjectId; type: string };
    total: number;
    count: number;
    lastDate: Date;
  }>([
    { $match: { userId: toObjectId(userId), ...extra } },
    {
      $group: {
        _id: { personId: '$personId', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        lastDate: { $max: '$transactionDate' },
      },
    },
  ]);

  const map: Record<string, PersonTotals> = {};
  for (const r of rows) {
    const id = r._id.personId.toString();
    if (!map[id]) map[id] = { ...emptyTotals(), lastTransaction: null };
    if (r._id.type === 'RECEIVED') map[id].received = r.total;
    else map[id].given = r.total;
    map[id].transactionCount += r.count;
    if (!map[id].lastTransaction || r.lastDate > map[id].lastTransaction!) {
      map[id].lastTransaction = r.lastDate;
    }
  }
  return map;
};

export interface FunctionTotals extends Totals {
  peopleCount: number;
}

/** Received / given / people count per function, keyed by functionId string. */
export const getTotalsByFunction = async (
  userId: string,
  functionIds?: mongoose.Types.ObjectId[]
): Promise<Record<string, FunctionTotals>> => {
  const extra: Record<string, unknown> = {};
  if (functionIds) extra.functionId = { $in: functionIds };
  const match = await activeTransactionMatch(userId, extra);

  const rows = await Transaction.aggregate<{
    _id: mongoose.Types.ObjectId;
    received: number;
    given: number;
    transactionCount: number;
    people: mongoose.Types.ObjectId[];
  }>([
    match,
    {
      $group: {
        _id: '$functionId',
        received: { $sum: { $cond: [{ $eq: ['$type', 'RECEIVED'] }, '$amount', 0] } },
        given: { $sum: { $cond: [{ $eq: ['$type', 'GIVEN'] }, '$amount', 0] } },
        transactionCount: { $sum: 1 },
        people: { $addToSet: '$personId' },
      },
    },
  ]);

  const map: Record<string, FunctionTotals> = {};
  for (const r of rows) {
    map[r._id.toString()] = {
      received: r.received,
      given: r.given,
      transactionCount: r.transactionCount,
      peopleCount: r.people.length,
    };
  }
  return map;
};
