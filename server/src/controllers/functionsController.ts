import { Response } from 'express';
import mongoose from 'mongoose';
import { FunctionEvent } from '../models/FunctionEvent';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import {
  createFunctionSchema,
  functionPeopleQuerySchema,
  listFunctionsQuerySchema,
  updateFunctionSchema,
} from '../validators/function.validator';
import {
  buildPaginationMeta,
  escapeRegex,
  getPaginationParams,
  sendValidationError,
} from '../utils';
import { getTotalsByFunction } from '../services/totals.service';
import { listFunctionPeople } from '../services/functionPeople.service';
import { findOwnedFunction } from '../services/ownership.service';

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getFunctions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = listFunctionsQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { category, search, type, upcoming, page, limit } = parsed.data;
  const { skip, limit: lim, page: pg } = getPaginationParams(page, limit);

  const filter: mongoose.FilterQuery<typeof FunctionEvent> = { userId };
  if (category) filter.category = category;
  if (type && type.trim()) filter.type = type.trim();
  if (search && search.trim()) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
    filter.$or = [{ name: rx }, { location: rx }, { type: rx }];
  }
  if (upcoming === 'true') filter.date = { $gte: startOfToday() };
  if (upcoming === 'false') filter.date = { $lt: startOfToday() };

  // Relative functions are a reminder list: soonest first. Our functions: newest first.
  const sortOrder: 1 | -1 = category === 'RELATIVE' && upcoming !== 'false' ? 1 : -1;

  const [functions, total] = await Promise.all([
    FunctionEvent.find(filter).sort({ date: sortOrder, createdAt: -1 }).skip(skip).limit(lim).lean(),
    FunctionEvent.countDocuments(filter),
  ]);

  const summaries = await getTotalsByFunction(
    userId,
    functions.map((f) => f._id)
  );

  const data = functions.map((f) => ({
    ...f,
    ...(summaries[f._id.toString()] || {
      received: 0,
      given: 0,
      transactionCount: 0,
      peopleCount: 0,
    }),
  }));

  res.json({ success: true, data, pagination: buildPaginationMeta(total, pg, lim) });
};

export const getFunctionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const fn = await findOwnedFunction(userId, req.params.id);

  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  const summaries = await getTotalsByFunction(userId, [fn._id]);
  const summary = summaries[fn._id.toString()] || {
    received: 0,
    given: 0,
    transactionCount: 0,
    peopleCount: 0,
  };

  res.json({
    success: true,
    data: {
      ...fn.toObject(),
      totalReceived: summary.received,
      totalGiven: summary.given,
      totalPeople: summary.peopleCount,
      transactionCount: summary.transactionCount,
    },
  });
};

/** PRIMARY VIEW for Our Functions: people + amount + type + attended, scoped to this function. */
export const getFunctionPeople = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const fn = await findOwnedFunction(userId, req.params.id);
  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  const parsed = functionPeopleQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const rows = await listFunctionPeople(userId, fn._id.toString(), parsed.data);
  res.json({ success: true, data: rows });
};

export const createFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = createFunctionSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const fn = await FunctionEvent.create({
    ...result.data,
    date: new Date(result.data.date),
    userId,
  });
  res.status(201).json({ success: true, data: fn, message: 'Function created successfully' });
};

export const updateFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = updateFunctionSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const fn = await findOwnedFunction(userId, req.params.id);
  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  const data = result.data;
  (Object.keys(data) as (keyof typeof data)[]).forEach((key) => {
    const value = data[key];
    if (value === undefined) return;
    if (key === 'date') {
      fn.date = new Date(value as string);
    } else if (value === null || value === '') {
      fn.set(key, undefined);
    } else {
      fn.set(key, value);
    }
  });

  await fn.save();
  res.json({ success: true, data: fn, message: 'Function updated successfully' });
};

export const deleteFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const confirm = req.query.confirm === 'true';

  const fn = await findOwnedFunction(userId, req.params.id);
  if (!fn) {
    res.status(404).json({ success: false, message: 'Function not found' });
    return;
  }

  const transactionCount = await Transaction.countDocuments({ userId, functionId: fn._id });
  if (transactionCount > 0 && !confirm) {
    res.status(409).json({
      success: false,
      message: `This function has ${transactionCount} Moi ${
        transactionCount === 1 ? 'entry' : 'entries'
      }. Deleting it will also delete those entries.`,
      data: { requiresConfirmation: true, transactionCount },
    });
    return;
  }

  await Transaction.deleteMany({ userId, functionId: fn._id });
  await fn.deleteOne();

  res.json({
    success: true,
    message:
      transactionCount > 0
        ? `Function and ${transactionCount} ${transactionCount === 1 ? 'entry' : 'entries'} deleted`
        : 'Function deleted successfully',
  });
};
