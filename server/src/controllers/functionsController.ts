import { Response } from 'express';
import mongoose from 'mongoose';
import { FunctionEvent } from '../models/FunctionEvent';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import { createFunctionSchema, updateFunctionSchema } from '../validators/function.validator';
import { getPaginationParams, buildPaginationMeta } from '../utils';

export const getFunctions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { search, type, page, limit } = req.query as Record<string, string>;
  const { skip, limit: lim, page: pg } = getPaginationParams(page, limit);

  const filter: mongoose.FilterQuery<typeof FunctionEvent> = { userId };

  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { location: { $regex: search, $options: 'i' } }];
  if (type) filter.type = type;

  const [functions, total] = await Promise.all([
    FunctionEvent.find(filter).sort({ date: -1 }).skip(skip).limit(lim).lean(),
    FunctionEvent.countDocuments(filter),
  ]);

  // Get summary for each function
  const functionIds = functions.map((f) => f._id);
  const summaries = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), functionId: { $in: functionIds } } },
    {
      $group: {
        _id: { functionId: '$functionId', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summaryMap: Record<string, { received: number; given: number; transactionCount: number; peopleCount: number }> = {};
  const peopleCounts = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), functionId: { $in: functionIds } } },
    { $group: { _id: '$functionId', people: { $addToSet: '$personId' } } },
    { $project: { _id: 1, peopleCount: { $size: '$people' } } },
  ]);

  for (const pc of peopleCounts) {
    const id = pc._id.toString();
    if (!summaryMap[id]) summaryMap[id] = { received: 0, given: 0, transactionCount: 0, peopleCount: 0 };
    summaryMap[id].peopleCount = pc.peopleCount;
  }

  for (const s of summaries) {
    const id = s._id.functionId.toString();
    if (!summaryMap[id]) summaryMap[id] = { received: 0, given: 0, transactionCount: 0, peopleCount: 0 };
    summaryMap[id].transactionCount += s.count;
    if (s._id.type === 'RECEIVED') summaryMap[id].received = s.total;
    else summaryMap[id].given = s.total;
  }

  const result = functions.map((f) => ({
    ...f,
    ...(summaryMap[f._id.toString()] || { received: 0, given: 0, transactionCount: 0, peopleCount: 0 }),
  }));

  res.json({ success: true, data: result, pagination: buildPaginationMeta(total, pg, lim) });
};

export const getFunctionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const fn = await FunctionEvent.findOne({ _id: req.params.id, userId }).lean();

  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  const transactions = await Transaction.find({ userId, functionId: fn._id })
    .populate('personId', 'husbandName wifeName area phone')
    .sort({ transactionDate: -1 })
    .lean();

  const totalReceived = transactions.filter((t) => t.type === 'RECEIVED').reduce((s, t) => s + t.amount, 0);
  const totalGiven = transactions.filter((t) => t.type === 'GIVEN').reduce((s, t) => s + t.amount, 0);
  const peopleIds = [...new Set(transactions.map((t) => t.personId.toString()))];

  res.json({
    success: true,
    data: {
      ...fn,
      totalReceived,
      totalGiven,
      totalPeople: peopleIds.length,
      transactionCount: transactions.length,
      transactions,
    },
  });
};

export const createFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = createFunctionSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const fn = await FunctionEvent.create({ ...result.data, date: new Date(result.data.date), userId });
  res.status(201).json({ success: true, data: fn, message: 'Function created successfully' });
};

export const updateFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = updateFunctionSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const updateData = { ...result.data };
  if (updateData.date) (updateData as Record<string, unknown>).date = new Date(updateData.date);

  const fn = await FunctionEvent.findOneAndUpdate({ _id: req.params.id, userId }, updateData, { new: true });

  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  res.json({ success: true, data: fn, message: 'Function updated successfully' });
};

export const deleteFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const fn = await FunctionEvent.findOneAndDelete({ _id: req.params.id, userId });

  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  res.json({ success: true, message: 'Function deleted successfully' });
};
