import { Response } from 'express';
import mongoose from 'mongoose';
import { Person } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import { createPersonSchema, updatePersonSchema } from '../validators/person.validator';
import {
  buildPaginationMeta,
  escapeRegex,
  getPaginationParams,
  isObjectId,
  parseNumber,
  sendValidationError,
} from '../utils';
import { getTotalsByPerson } from '../services/totals.service';
import { findOwnedPerson } from '../services/ownership.service';

type SortKey = 'recent' | 'active' | 'name' | 'area' | 'received' | 'given';

export const getPeople = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const q = req.query as Record<string, string | undefined>;
  const { skip, limit, page } = getPaginationParams(q.page, q.limit);

  const filter: mongoose.FilterQuery<typeof Person> = { userId, isDeleted: false };

  if (q.search && q.search.trim()) {
    const rx = { $regex: escapeRegex(q.search.trim()), $options: 'i' };
    filter.$or = [{ husbandName: rx }, { wifeName: rx }, { area: rx }, { phone: rx }];
  }
  if (q.area && q.area.trim()) {
    filter.area = { $regex: `^${escapeRegex(q.area.trim())}$`, $options: 'i' };
  }

  // People lists are family-sized (hundreds, not millions), so we compute
  // totals for the filtered set and paginate in memory. This keeps the totals
  // derived from Transactions rather than denormalised on the Person.
  const people = await Person.find(filter).lean();
  const totalsMap = await getTotalsByPerson(
    userId,
    people.map((p) => p._id)
  );

  let rows = people.map((p) => {
    const t = totalsMap[p._id.toString()];
    return {
      ...p,
      totalReceived: t?.received || 0,
      totalGiven: t?.given || 0,
      transactionCount: t?.transactionCount || 0,
      lastTransaction: t?.lastTransaction || null,
    };
  });

  if (q.hasTransactions === 'true') rows = rows.filter((p) => p.transactionCount > 0);
  if (q.hasTransactions === 'false') rows = rows.filter((p) => p.transactionCount === 0);

  const minReceived = parseNumber(q.minReceived);
  const maxReceived = parseNumber(q.maxReceived);
  const minGiven = parseNumber(q.minGiven);
  const maxGiven = parseNumber(q.maxGiven);
  if (minReceived !== undefined) rows = rows.filter((p) => p.totalReceived >= minReceived);
  if (maxReceived !== undefined) rows = rows.filter((p) => p.totalReceived <= maxReceived);
  if (minGiven !== undefined) rows = rows.filter((p) => p.totalGiven >= minGiven);
  if (maxGiven !== undefined) rows = rows.filter((p) => p.totalGiven <= maxGiven);

  const sort = (q.sort as SortKey) || 'recent';
  const byName = (p: (typeof rows)[number]) =>
    (p.husbandName || p.wifeName || '').toLocaleLowerCase();
  const time = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : 0);

  rows.sort((a, b) => {
    switch (sort) {
      case 'name':
        return byName(a).localeCompare(byName(b));
      case 'area':
        return a.area.localeCompare(b.area) || byName(a).localeCompare(byName(b));
      case 'active':
        return time(b.lastTransaction) - time(a.lastTransaction);
      case 'received':
        return b.totalReceived - a.totalReceived;
      case 'given':
        return b.totalGiven - a.totalGiven;
      case 'recent':
      default:
        return time(b.createdAt) - time(a.createdAt);
    }
  });

  const total = rows.length;
  res.json({
    success: true,
    data: rows.slice(skip, skip + limit),
    pagination: buildPaginationMeta(total, page, limit),
  });
};

export const getPersonById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const person = await findOwnedPerson(userId, req.params.id);

  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found' });
    return;
  }

  const transactions = await Transaction.find({ userId, personId: person._id })
    .populate('functionId', 'name type category date time location')
    .sort({ transactionDate: -1, createdAt: -1 })
    .lean();

  const totalReceived = transactions
    .filter((t) => t.type === 'RECEIVED')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalGiven = transactions
    .filter((t) => t.type === 'GIVEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const functionIds = new Set(
    transactions
      .map((t) => (t.functionId as unknown as { _id?: mongoose.Types.ObjectId })?._id?.toString())
      .filter(Boolean)
  );

  res.json({
    success: true,
    data: {
      ...person.toObject(),
      totalReceived,
      totalGiven,
      transactionCount: transactions.length,
      totalFunctions: functionIds.size,
      lastTransaction: transactions[0]?.transactionDate || null,
      transactions,
    },
  });
};

export const createPerson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = createPersonSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const person = await Person.create({ ...result.data, userId });
  res.status(201).json({ success: true, data: person, message: 'Person added successfully' });
};

export const updatePerson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = updatePersonSchema.safeParse(req.body);
  if (!result.success) return sendValidationError(res, result.error);

  const person = await findOwnedPerson(userId, req.params.id);
  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found' });
    return;
  }

  const data = result.data;
  const next = {
    husbandName: data.husbandName === undefined ? person.husbandName : data.husbandName || undefined,
    wifeName: data.wifeName === undefined ? person.wifeName : data.wifeName || undefined,
  };
  if (!next.husbandName && !next.wifeName) {
    res.status(400).json({
      success: false,
      message: 'At least one of husband name or wife name must be provided',
    });
    return;
  }

  (Object.keys(data) as (keyof typeof data)[]).forEach((key) => {
    const value = data[key];
    if (value === undefined) return;
    if (value === null || value === '') {
      person.set(key, undefined);
    } else {
      person.set(key, value);
    }
  });

  await person.save();
  res.json({ success: true, data: person, message: 'Person updated successfully' });
};

export const deletePerson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const confirm = req.query.confirm === 'true';

  const person = await findOwnedPerson(userId, req.params.id);
  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found' });
    return;
  }

  const transactionCount = await Transaction.countDocuments({ userId, personId: person._id });

  if (transactionCount > 0 && !confirm) {
    res.status(409).json({
      success: false,
      message: `This person has ${transactionCount} Moi ${
        transactionCount === 1 ? 'entry' : 'entries'
      }. Confirm to hide them from your records anyway.`,
      data: { requiresConfirmation: true, transactionCount },
    });
    return;
  }

  person.isDeleted = true;
  await person.save();

  res.json({
    success: true,
    message:
      transactionCount > 0
        ? `Person removed. ${transactionCount} past ${
            transactionCount === 1 ? 'entry is' : 'entries are'
          } no longer counted in totals.`
        : 'Person removed successfully',
  });
};

export const checkDuplicate = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { husbandName, wifeName, area, excludeId } = req.query as Record<string, string | undefined>;

  const orConditions: Record<string, unknown>[] = [];
  if (husbandName && husbandName.trim()) {
    orConditions.push({
      husbandName: { $regex: `^${escapeRegex(husbandName.trim())}$`, $options: 'i' },
    });
  }
  if (wifeName && wifeName.trim()) {
    orConditions.push({ wifeName: { $regex: `^${escapeRegex(wifeName.trim())}$`, $options: 'i' } });
  }

  if (orConditions.length === 0) {
    res.json({ success: true, data: { duplicates: [] } });
    return;
  }

  const filter: mongoose.FilterQuery<typeof Person> = { userId, isDeleted: false, $or: orConditions };
  if (area && area.trim()) {
    filter.area = { $regex: `^${escapeRegex(area.trim())}$`, $options: 'i' };
  }
  if (isObjectId(excludeId)) {
    filter._id = { $ne: excludeId };
  }

  const duplicates = await Person.find(filter).limit(5).lean();
  res.json({ success: true, data: { duplicates } });
};

export const getAreas = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const areas = await Person.distinct('area', { userId, isDeleted: false });
  res.json({ success: true, data: areas.filter(Boolean).sort((a, b) => a.localeCompare(b)) });
};
