import { Response } from 'express';
import { Person } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';

const escapeCSV = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const exportPeople = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const people = await Person.find({ userId, isDeleted: false }).lean();
  const peopleIds = people.map((p) => p._id);

  const txAgg = await Transaction.aggregate([
    { $match: { userId: { $in: [userId] }, personId: { $in: peopleIds } } },
    {
      $group: {
        _id: { personId: '$personId', type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totalsMap: Record<string, { received: number; given: number }> = {};
  for (const t of txAgg) {
    const id = t._id.personId.toString();
    if (!totalsMap[id]) totalsMap[id] = { received: 0, given: 0 };
    if (t._id.type === 'RECEIVED') totalsMap[id].received = t.total;
    else totalsMap[id].given = t.total;
  }

  const headers = ['Husband Name', 'Wife Name', 'Area', 'Phone', 'Alternate Phone', 'Address', 'Total Received', 'Total Given', 'Notes'];
  const rows = people.map((p) => [
    escapeCSV(p.husbandName),
    escapeCSV(p.wifeName),
    escapeCSV(p.area),
    escapeCSV(p.phone),
    escapeCSV(p.alternatePhone),
    escapeCSV(p.address),
    totalsMap[p._id.toString()]?.received || 0,
    totalsMap[p._id.toString()]?.given || 0,
    escapeCSV(p.notes),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="people.csv"');
  res.send(csv);
};

export const exportTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const transactions = await Transaction.find({ userId })
    .populate('personId', 'husbandName wifeName area')
    .populate('functionId', 'name type')
    .sort({ transactionDate: -1 })
    .lean();

  const headers = ['Date', 'Person', 'Area', 'Function', 'Type', 'Amount', 'Notes'];
  const rows = transactions.map((t) => {
    const person = t.personId as unknown as Record<string, unknown>;
    const fn = t.functionId as unknown as Record<string, unknown>;
    const personName = [person?.husbandName, person?.wifeName].filter(Boolean).join(' & ');
    return [
      formatDate(t.transactionDate),
      escapeCSV(personName),
      escapeCSV(person?.area),
      escapeCSV(fn?.name),
      t.type,
      t.amount,
      escapeCSV(t.notes),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.send(csv);
};

export const exportFunctions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const functions = await FunctionEvent.find({ userId }).sort({ date: -1 }).lean();

  const headers = ['Name', 'Type', 'Date', 'Location', 'Notes'];
  const rows = functions.map((f) => [
    escapeCSV(f.name),
    escapeCSV(f.type),
    formatDate(f.date),
    escapeCSV(f.location),
    escapeCSV(f.notes),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="functions.csv"');
  res.send(csv);
};
