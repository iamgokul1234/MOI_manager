import { Response } from 'express';
import mongoose from 'mongoose';
import { Person } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import { createPersonSchema, updatePersonSchema } from '../validators/person.validator';
import { getPaginationParams, buildPaginationMeta } from '../utils';

export const getPeople = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const {
    search,
    area,
    hasTransactions,
    minReceived,
    maxReceived,
    minGiven,
    maxGiven,
    sort,
    page,
    limit,
  } = req.query as Record<string, string>;

  const { skip, limit: lim, page: pg } = getPaginationParams(page, limit);

  const filter: mongoose.FilterQuery<typeof Person> = { userId, isDeleted: false };

  if (search) {
    filter.$or = [
      { husbandName: { $regex: search, $options: 'i' } },
      { wifeName: { $regex: search, $options: 'i' } },
      { area: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (area) filter.area = { $regex: area, $options: 'i' };

  let people = await Person.find(filter)
    .sort(sort === 'name' ? { husbandName: 1 } : sort === 'area' ? { area: 1 } : { createdAt: -1 })
    .lean();

  // Compute totals from transactions
  const peopleIds = people.map((p) => p._id);
  const totals = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), personId: { $in: peopleIds } } },
    {
      $group: {
        _id: { personId: '$personId', type: '$type' },
        total: { $sum: '$amount' },
        lastDate: { $max: '$transactionDate' },
      },
    },
  ]);

  const totalsMap: Record<
    string,
    { received: number; given: number; lastTransaction: Date | null }
  > = {};
  for (const t of totals) {
    const id = t._id.personId.toString();
    if (!totalsMap[id]) totalsMap[id] = { received: 0, given: 0, lastTransaction: null };
    if (t._id.type === 'RECEIVED') {
      totalsMap[id].received = t.total;
      if (!totalsMap[id].lastTransaction || t.lastDate > totalsMap[id].lastTransaction!) {
        totalsMap[id].lastTransaction = t.lastDate;
      }
    } else {
      totalsMap[id].given = t.total;
      if (!totalsMap[id].lastTransaction || t.lastDate > totalsMap[id].lastTransaction!) {
        totalsMap[id].lastTransaction = t.lastDate;
      }
    }
  }

  // Apply transaction-based filters
  let filtered = people.map((p) => ({
    ...p,
    totalReceived: totalsMap[p._id.toString()]?.received || 0,
    totalGiven: totalsMap[p._id.toString()]?.given || 0,
    lastTransaction: totalsMap[p._id.toString()]?.lastTransaction || null,
  }));

  if (hasTransactions === 'true') {
    filtered = filtered.filter((p) => p.totalReceived > 0 || p.totalGiven > 0);
  } else if (hasTransactions === 'false') {
    filtered = filtered.filter((p) => p.totalReceived === 0 && p.totalGiven === 0);
  }

  if (minReceived) filtered = filtered.filter((p) => p.totalReceived >= parseFloat(minReceived));
  if (maxReceived) filtered = filtered.filter((p) => p.totalReceived <= parseFloat(maxReceived));
  if (minGiven) filtered = filtered.filter((p) => p.totalGiven >= parseFloat(minGiven));
  if (maxGiven) filtered = filtered.filter((p) => p.totalGiven <= parseFloat(maxGiven));

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + lim);

  res.json({
    success: true,
    data: paginated,
    pagination: buildPaginationMeta(total, pg, lim),
  });
};

export const getPersonById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const person = await Person.findOne({
    _id: req.params.id,
    userId,
    isDeleted: false,
  }).lean();

  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found' });
    return;
  }

  const transactions = await Transaction.find({ userId, personId: person._id })
    .populate('functionId', 'name type date')
    .sort({ transactionDate: -1 })
    .lean();

  const totalReceived = transactions
    .filter((t) => t.type === 'RECEIVED')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalGiven = transactions
    .filter((t) => t.type === 'GIVEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const functionIds = [...new Set(transactions.map((t) => t.functionId.toString()))];

  res.json({
    success: true,
    data: {
      ...person,
      totalReceived,
      totalGiven,
      totalFunctions: functionIds.length,
      lastTransaction: transactions[0]?.transactionDate || null,
      transactions,
    },
  });
};

export const createPerson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = createPersonSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const person = await Person.create({ ...result.data, userId });
  res.status(201).json({ success: true, data: person, message: 'Person added successfully' });
};

export const updatePerson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const result = updatePersonSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  }

  const person = await Person.findOneAndUpdate(
    { _id: req.params.id, userId, isDeleted: false },
    result.data,
    { new: true }
  );

  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found' });
    return;
  }

  res.json({ success: true, data: person, message: 'Person updated successfully' });
};

export const deletePerson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { confirm } = req.query;

  const person = await Person.findOne({ _id: req.params.id, userId, isDeleted: false });
  if (!person) {
    res.status(404).json({ success: false, message: 'Person not found' });
    return;
  }

  const transactionCount = await Transaction.countDocuments({ userId, personId: person._id });

  if (transactionCount > 0 && confirm !== 'true') {
    res.status(200).json({
      success: false,
      message: `This person has ${transactionCount} transaction(s). Set confirm=true to proceed with deletion.`,
      data: { requiresConfirmation: true, transactionCount },
    });
    return;
  }

  person.isDeleted = true;
  await person.save();

  res.json({ success: true, message: 'Person deleted successfully' });
};

export const checkDuplicate = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { husbandName, wifeName, area } = req.query as Record<string, string>;

  const filter: mongoose.FilterQuery<typeof Person> = { userId, isDeleted: false };
  const orConditions = [];

  if (husbandName)
    orConditions.push({ husbandName: { $regex: `^${husbandName}$`, $options: 'i' } });
  if (wifeName) orConditions.push({ wifeName: { $regex: `^${wifeName}$`, $options: 'i' } });

  if (orConditions.length === 0) {
    res.json({ success: true, data: { duplicates: [] } });
    return;
  }

  if (area) filter.area = { $regex: `^${area}$`, $options: 'i' };
  filter.$or = orConditions;

  const duplicates = await Person.find(filter).lean();
  res.json({ success: true, data: { duplicates } });
};

export const getAreas = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const areas = await Person.distinct('area', { userId, isDeleted: false });
  res.json({ success: true, data: areas.sort() });
};
