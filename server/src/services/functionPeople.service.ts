import mongoose, { PipelineStage } from 'mongoose';
import { Transaction } from '../models/Transaction';
import { escapeRegex, toObjectId } from '../utils';

export interface FunctionPeopleFilters {
  search?: string;
  area?: string;
  type?: 'RECEIVED' | 'GIVEN';
  attended?: 'true' | 'false';
}

export interface FunctionPersonRow {
  transactionId: string;
  person: {
    _id: mongoose.Types.ObjectId;
    husbandName?: string;
    wifeName?: string;
    area: string;
    phone?: string;
  };
  type: 'RECEIVED' | 'GIVEN';
  amount: number;
  attended: boolean;
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
}

/**
 * The primary view for an "Our Function": one row per transaction under the
 * function, joined with the (non-deleted) person. Search and filters are
 * scoped to this function only, and the attended flag always travels with the
 * row so the UI can keep the strike-through state visible while searching.
 */
export const listFunctionPeople = async (
  userId: string,
  functionId: string,
  filters: FunctionPeopleFilters
): Promise<FunctionPersonRow[]> => {
  const txMatch: Record<string, unknown> = {
    userId: toObjectId(userId),
    functionId: toObjectId(functionId),
  };
  if (filters.type) txMatch.type = filters.type;
  if (filters.attended === 'true') txMatch.attended = true;
  if (filters.attended === 'false') txMatch.attended = false;

  const personMatch: Record<string, unknown> = { 'person.isDeleted': { $ne: true } };
  if (filters.area) {
    personMatch['person.area'] = { $regex: escapeRegex(filters.area), $options: 'i' };
  }
  if (filters.search && filters.search.trim()) {
    const rx = { $regex: escapeRegex(filters.search.trim()), $options: 'i' };
    personMatch.$or = [
      { 'person.husbandName': rx },
      { 'person.wifeName': rx },
      { 'person.area': rx },
      { 'person.phone': rx },
    ];
  }

  const pipeline: PipelineStage[] = [
    { $match: txMatch },
    {
      $lookup: {
        from: 'people',
        localField: 'personId',
        foreignField: '_id',
        as: 'person',
      },
    },
    { $unwind: '$person' },
    { $match: personMatch },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: 0,
        transactionId: '$_id',
        type: 1,
        amount: 1,
        attended: 1,
        transactionDate: 1,
        notes: 1,
        createdAt: 1,
        person: {
          _id: '$person._id',
          husbandName: '$person.husbandName',
          wifeName: '$person.wifeName',
          area: '$person.area',
          phone: '$person.phone',
        },
      },
    },
  ];

  return Transaction.aggregate<FunctionPersonRow>(pipeline);
};
