import { Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';

export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!.userId);

  const [totals, totalPeople, totalFunctions] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Person.countDocuments({ userId, isDeleted: false }),
    FunctionEvent.countDocuments({ userId }),
  ]);

  const totalReceived = totals.find((t) => t._id === 'RECEIVED')?.total || 0;
  const totalGiven = totals.find((t) => t._id === 'GIVEN')?.total || 0;

  res.json({
    success: true,
    data: {
      totalReceived,
      totalGiven,
      netDifference: totalReceived - totalGiven,
      totalPeople,
      totalFunctions,
    },
  });
};

export const getFunctionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!.userId);

  const report = await Transaction.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { functionId: '$functionId', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        people: { $addToSet: '$personId' },
      },
    },
    {
      $group: {
        _id: '$_id.functionId',
        received: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'RECEIVED'] }, '$total', 0] },
        },
        given: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'GIVEN'] }, '$total', 0] },
        },
        transactionCount: { $sum: '$count' },
        allPeople: { $push: '$people' },
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
    {
      $project: {
        name: '$function.name',
        type: '$function.type',
        date: '$function.date',
        received: 1,
        given: 1,
        transactionCount: 1,
        allPeople: 1,
      },
    },
    { $sort: { date: -1 } },
  ]);

  // Compute unique people count per function
  const result = report.map((r) => ({
    ...r,
    peopleCount: new Set(r.allPeople.flat().map((id: mongoose.Types.ObjectId) => id.toString())).size,
    allPeople: undefined,
  }));

  res.json({ success: true, data: result });
};

export const getAreaReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!.userId);

  const report = await Transaction.aggregate([
    { $match: { userId } },
    {
      $lookup: {
        from: 'people',
        localField: 'personId',
        foreignField: '_id',
        as: 'person',
      },
    },
    { $unwind: '$person' },
    {
      $group: {
        _id: '$person.area',
        received: { $sum: { $cond: [{ $eq: ['$type', 'RECEIVED'] }, '$amount', 0] } },
        given: { $sum: { $cond: [{ $eq: ['$type', 'GIVEN'] }, '$amount', 0] } },
        people: { $addToSet: '$personId' },
      },
    },
    {
      $project: {
        area: '$_id',
        received: 1,
        given: 1,
        peopleCount: { $size: '$people' },
      },
    },
    { $sort: { received: -1 } },
  ]);

  res.json({ success: true, data: report });
};

export const getYearlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!.userId);
  const { year } = req.query as Record<string, string>;

  const matchStage: mongoose.PipelineStage.Match['$match'] = { userId };
  if (year && year !== 'all') {
    const y = parseInt(year, 10);
    matchStage.transactionDate = {
      $gte: new Date(`${y}-01-01`),
      $lte: new Date(`${y}-12-31T23:59:59`),
    };
  }

  const report = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { year: { $year: '$transactionDate' }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.year',
        received: { $sum: { $cond: [{ $eq: ['$_id.type', 'RECEIVED'] }, '$total', 0] } },
        given: { $sum: { $cond: [{ $eq: ['$_id.type', 'GIVEN'] }, '$total', 0] } },
        transactionCount: { $sum: '$count' },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  res.json({ success: true, data: report.map((r) => ({ year: r._id, ...r, _id: undefined })) });
};
