import { Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator';
import { getPaginationParams, buildPaginationMeta } from '../utils';

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { personId, functionId, type, area, dateFrom, dateTo, minAmount, maxAmount, page, limit } =
    req.query as Record<string, string>;

  const { skip, limit: lim, page: pg } = getPaginationParams(page, limit);

  const filter: mongoose.FilterQuery<typeof Transaction> = { userId };

  if (personId) filter.personId = new mongoose.Types.ObjectId(personId);
  if (functionId) filter.functionId = new mongoose.Types.ObjectId(functionId);
  if (type) filter.type = type;
  if (dateFrom || dateTo) {
    filter.transactionDate = {};
    if (dateFrom) filter.transactionDate.$gte = new Date(dateFrom);
    if (dateTo) filter.transactionDate.$lte = new Date(dateTo);
  }
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = parseFloat(minAmount);
    if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
  }

  // Area filter needs person lookup
  let personIdsForArea: mongoose.Types.ObjectId[] | undefined;
  if (area) {
    const persons = await Person.find({
      userId,
      area: { $regex: area, $options: 'i' },
      isDeleted: false,
    }).select('_id');
    personIdsForArea = persons.map((p) => p._id);
    filter.personId = { $in: personIdsForArea };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('personId', 'husbandName wifeName area phone')
      .populate('functionId', 'name type date')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(lim)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({ success: true, data: transactions, pagination: buildPaginationMeta(total, pg, lim) });
};

export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const transaction = await Transaction.findOne({ _id: req.params.id, userId })
    .populate('personId', 'husbandName wifeName area phone')
    .populate('functionId', 'name type date')
    .lean();

  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  res.json({ success: true, data: transaction });
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = createTransactionSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const { personId, functionId, type, amount, transactionDate, notes } = result.data;

  // Ownership validation
  const [person, fn] = await Promise.all([
    Person.findOne({ _id: personId, userId, isDeleted: false }),
    FunctionEvent.findOne({ _id: functionId, userId }),
  ]);

  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found or does not belong to you' });
    return;
  }
  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found or does not belong to you' });
    return;
  }

  const transaction = await Transaction.create({
    userId,
    personId,
    functionId,
    type,
    amount,
    transactionDate: new Date(transactionDate),
    notes,
  });

  const populated = await Transaction.findById(transaction._id)
    .populate('personId', 'husbandName wifeName area phone')
    .populate('functionId', 'name type date')
    .lean();

  res.status(201).json({ success: true, data: populated, message: 'Transaction added successfully' });
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = updateTransactionSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const updateData: Record<string, unknown> = { ...result.data };
  if (updateData.transactionDate) updateData.transactionDate = new Date(updateData.transactionDate as string);

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId },
    updateData,
    { new: true }
  )
    .populate('personId', 'husbandName wifeName area phone')
    .populate('functionId', 'name type date');

  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  res.json({ success: true, data: transaction, message: 'Transaction updated successfully' });
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId });

  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  res.json({ success: true, message: 'Transaction deleted successfully' });
};
