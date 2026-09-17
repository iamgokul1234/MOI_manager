import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const now = new Date();

  const [totals, totalPeople, totalFunctions, recentTransactions, upcomingFunctions, recentPeople] =
    await Promise.all([
      Transaction.aggregate([
        { $match: { userId: { $in: [userId] } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]).exec(),
      Person.countDocuments({ userId, isDeleted: false }),
      FunctionEvent.countDocuments({ userId }),
      Transaction.find({ userId })
        .populate('personId', 'husbandName wifeName area')
        .populate('functionId', 'name type date')
        .sort({ transactionDate: -1 })
        .limit(10)
        .lean(),
      FunctionEvent.find({ userId, date: { $gte: now } })
        .sort({ date: 1 })
        .limit(5)
        .lean(),
      Person.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  const totalReceived = totals.find((t: { _id: string }) => t._id === 'RECEIVED')?.total || 0;
  const totalGiven = totals.find((t: { _id: string }) => t._id === 'GIVEN')?.total || 0;

  res.json({
    success: true,
    data: {
      totalReceived,
      totalGiven,
      netDifference: totalReceived - totalGiven,
      totalPeople,
      totalFunctions,
      recentTransactions,
      upcomingFunctions,
      recentPeople,
    },
  });
};
