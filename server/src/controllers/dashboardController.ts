import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';
import { getDeletedPersonIds, getOverallTotals } from '../services/totals.service';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const deleted = await getDeletedPersonIds(userId);
  const txFilter: Record<string, unknown> = { userId };
  if (deleted.length > 0) txFilter.personId = { $nin: deleted };

  const [totals, totalPeople, totalFunctions, recentTransactions, upcomingFunctions, recentPeople] =
    await Promise.all([
      getOverallTotals(userId),
      Person.countDocuments({ userId, isDeleted: false }),
      FunctionEvent.countDocuments({ userId }),
      Transaction.find(txFilter)
        .populate('personId', 'husbandName wifeName area')
        .populate('functionId', 'name type category date')
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      // Upcoming = Relative Functions (other people's events) that are today or later.
      FunctionEvent.find({ userId, category: 'RELATIVE', date: { $gte: startOfToday } })
        .sort({ date: 1 })
        .limit(5)
        .lean(),
      Person.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(5).lean(),
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
      recentTransactions,
      upcomingFunctions,
      recentPeople,
    },
  });
};
