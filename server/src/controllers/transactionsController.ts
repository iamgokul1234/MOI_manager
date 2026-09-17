import { Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Person } from '../models/Person';
import { AuthRequest } from '../types';
import {
  attendanceSchema,
  createTransactionSchema,
  updateTransactionSchema,
} from '../validators/transaction.validator';
import {
  buildPaginationMeta,
  escapeRegex,
  getPaginationParams,
  isObjectId,
  parseDate,
  parseNumber,
  sendValidationError,
  toObjectId,
} from '../utils';
import {
  findOwnedFunction,
  findOwnedPerson,
  findOwnedTransaction,
} from '../services/ownership.service';
import { getDeletedPersonIds } from '../services/totals.service';

const PERSON_FIELDS = 'husbandName wifeName area phone isDeleted';
const FUNCTION_FIELDS = 'name type category date time location';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const populateTx = <Q extends mongoose.Query<any, any>>(query: Q): Q =>
  query.populate('personId', PERSON_FIELDS).populate('functionId', FUNCTION_FIELDS) as Q;

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const q = req.query as Record<string, string | undefined>;
  const { skip, limit, page } = getPaginationParams(q.page, q.limit);

  const filter: mongoose.FilterQuery<typeof Transaction> = { userId: toObjectId(userId) };

  if (q.personId) {
    if (!isObjectId(q.personId)) {
      res.status(400).json({ success: false, message: 'Invalid person id' });
      return;
    }
    filter.personId = toObjectId(q.personId);
  }
  if (q.functionId) {
    if (!isObjectId(q.functionId)) {
      res.status(400).json({ success: false, message: 'Invalid function id' });
      return;
    }
    filter.functionId = toObjectId(q.functionId);
  }
  if (q.type === 'RECEIVED' || q.type === 'GIVEN') filter.type = q.type;
  if (q.attended === 'true') filter.attended = true;
  if (q.attended === 'false') filter.attended = false;

  const dateFrom = parseDate(q.dateFrom);
  const dateTo = parseDate(q.dateTo, true);
  if (dateFrom || dateTo) {
    filter.transactionDate = {};
    if (dateFrom) filter.transactionDate.$gte = dateFrom;
    if (dateTo) filter.transactionDate.$lte = dateTo;
  }

  const minAmount = parseNumber(q.minAmount);
  const maxAmount = parseNumber(q.maxAmount);
  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = {};
    if (minAmount !== undefined) filter.amount.$gte = minAmount;
    if (maxAmount !== undefined) filter.amount.$lte = maxAmount;
  }

  // Exclude soft-deleted people unless a specific person was requested.
  if (!q.personId) {
    const personFilter: mongoose.FilterQuery<typeof Person> = { userId, isDeleted: false };
    if (q.area && q.area.trim()) {
      personFilter.area = { $regex: `^${escapeRegex(q.area.trim())}$`, $options: 'i' };
      const persons = await Person.find(personFilter).select('_id').lean();
      filter.personId = { $in: persons.map((p) => p._id) };
    } else {
      const deleted = await getDeletedPersonIds(userId);
      if (deleted.length > 0) filter.personId = { $nin: deleted };
    }
  }

  const [transactions, total] = await Promise.all([
    populateTx(Transaction.find(filter))
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({ success: true, data: transactions, pagination: buildPaginationMeta(total, page, limit) });
};

export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  if (!isObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }
  const transaction = await populateTx(Transaction.findOne({ _id: req.params.id, userId })).lean();

  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  res.json({ success: true, data: transaction });
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = createTransactionSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const { personId, functionId, type, amount, transactionDate, attended, notes } = result.data;

  // Ownership validation: both references must belong to the current user.
  const [person, fn] = await Promise.all([
    findOwnedPerson(userId, personId),
    findOwnedFunction(userId, functionId),
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
    personId: person._id,
    functionId: fn._id,
    type,
    amount,
    transactionDate: new Date(transactionDate),
    // Default to false so rows are not automatically struck out until manually checked.
    attended: attended ?? false,
    notes,
  });

  const populated = await populateTx(Transaction.findById(transaction._id)).lean();
  res.status(201).json({ success: true, data: populated, message: 'Moi entry added' });
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = updateTransactionSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const transaction = await findOwnedTransaction(userId, req.params.id);
  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  const data = result.data;
  if (data.type !== undefined) transaction.type = data.type;
  if (data.amount !== undefined) transaction.amount = data.amount;
  if (data.transactionDate !== undefined) transaction.transactionDate = new Date(data.transactionDate);
  if (data.attended !== undefined) transaction.attended = data.attended;
  if (data.notes !== undefined) transaction.notes = data.notes || undefined;

  await transaction.save();
  const populated = await populateTx(Transaction.findById(transaction._id)).lean();
  res.json({ success: true, data: populated, message: 'Moi entry updated' });
};

/** Single-tap strike-through toggle. Only touches this one transaction. */
export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = attendanceSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const transaction = await findOwnedTransaction(userId, req.params.id);
  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  if (transaction.attended && !result.data.attended) {
    res.status(400).json({ success: false, message: 'Once checked, status cannot be undone' });
    return;
  }

  transaction.attended = result.data.attended;
  await transaction.save();

  res.json({
    success: true,
    data: { _id: transaction._id, attended: transaction.attended },
    message: result.data.attended ? 'Marked as checked' : 'Marked as unchecked',
  });
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const transaction = await findOwnedTransaction(userId, req.params.id);

  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transaction not found' });
    return;
  }

  await transaction.deleteOne();
  res.json({ success: true, message: 'Moi entry deleted' });
};
