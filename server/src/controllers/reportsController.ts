import { Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';
import { activeTransactionMatch, getOverallTotals } from '../services/totals.service';
import { toObjectId } from '../utils';

export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const [totals, totalPeople, totalFunctions] = await Promise.all([
    getOverallTotals(userId),
    Person.countDocuments({ userId, isDeleted: false }),
    FunctionEvent.countDocuments({ userId }),
  ]);

  res.json({
    success: true,
    data: {
      totalReceived: totals.received,
      totalGiven: totals.given,
      netDifference: totals.received - totals.given,
      totalTransactions: totals.transactionCount,
      totalPeople,
      totalFunctions,
    },
  });
};

export const getFunctionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const match = await activeTransactionMatch(userId);

  const report = await Transaction.aggregate<{
    _id: mongoose.Types.ObjectId;
    received: number;
    given: number;
    transactionCount: number;
    people: mongoose.Types.ObjectId[];
    function: { name: string; type: string; category: string; date: Date };
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
    {
      $lookup: {
        from: 'functionevents',
        localField: '_id',
        foreignField: '_id',
        as: 'function',
      },
    },
    { $unwind: '$function' },
    { $sort: { 'function.date': -1 } },
  ]);

  res.json({
    success: true,
    data: report.map((r) => ({
      _id: r._id,
      name: r.function.name,
      type: r.function.type,
      category: r.function.category,
      date: r.function.date,
      received: r.received,
      given: r.given,
      transactionCount: r.transactionCount,
      peopleCount: r.people.length,
    })),
  });
};

export const getAreaReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const report = await Transaction.aggregate<{
    _id: string;
    received: number;
    given: number;
    transactionCount: number;
    people: mongoose.Types.ObjectId[];
  }>([
    { $match: { userId: toObjectId(userId) } },
    {
      $lookup: {
        from: 'people',
        localField: 'personId',
        foreignField: '_id',
        as: 'person',
      },
    },
    { $unwind: '$person' },
    { $match: { 'person.isDeleted': { $ne: true } } },
    {
      $group: {
        _id: '$person.area',
        received: { $sum: { $cond: [{ $eq: ['$type', 'RECEIVED'] }, '$amount', 0] } },
        given: { $sum: { $cond: [{ $eq: ['$type', 'GIVEN'] }, '$amount', 0] } },
        transactionCount: { $sum: 1 },
        people: { $addToSet: '$personId' },
      },
    },
    { $sort: { received: -1, given: -1 } },
  ]);

  res.json({
    success: true,
    data: report.map((r) => ({
      area: r._id,
      received: r.received,
      given: r.given,
      transactionCount: r.transactionCount,
      peopleCount: r.people.length,
    })),
  });
};

export const getYearlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { year } = req.query as Record<string, string | undefined>;

  const extra: Record<string, unknown> = {};
  if (year && year !== 'all') {
    const y = parseInt(year, 10);
    if (Number.isNaN(y)) {
      res.status(400).json({ success: false, message: 'Year must be a number or "all"' });
      return;
    }
    extra.transactionDate = {
      $gte: new Date(Date.UTC(y, 0, 1)),
      $lt: new Date(Date.UTC(y + 1, 0, 1)),
    };
  }
  const match = await activeTransactionMatch(userId, extra);

  const report = await Transaction.aggregate<{
    _id: number;
    received: number;
    given: number;
    transactionCount: number;
  }>([
    match,
    {
      $group: {
        _id: { $year: '$transactionDate' },
        received: { $sum: { $cond: [{ $eq: ['$type', 'RECEIVED'] }, '$amount', 0] } },
        given: { $sum: { $cond: [{ $eq: ['$type', 'GIVEN'] }, '$amount', 0] } },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  res.json({
    success: true,
    data: report.map((r) => ({
      year: r._id,
      received: r.received,
      given: r.given,
      netDifference: r.received - r.given,
      transactionCount: r.transactionCount,
    })),
  });
};

/** Distinct years that have at least one transaction, for the year selector. */
export const getReportYears = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await Transaction.aggregate<{ _id: number }>([
    { $match: { userId: toObjectId(userId) } },
    { $group: { _id: { $year: '$transactionDate' } } },
    { $sort: { _id: -1 } },
  ]);
  res.json({ success: true, data: rows.map((r) => r._id) });
};
