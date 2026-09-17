import { Response } from 'express';
import { Person } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { FunctionEvent } from '../models/FunctionEvent';
import { AuthRequest } from '../types';
import { getDeletedPersonIds, getTotalsByFunction, getTotalsByPerson } from '../services/totals.service';

const escapeCSV = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Guard against spreadsheet formula injection as well as delimiter collisions.
  const needsQuote = /[",\n\r]/.test(str) || /^[=+\-@]/.test(str);
  return needsQuote ? `"${str.replace(/"/g, '""')}"` : str;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const sendCSV = (res: Response, filename: string, headers: string[], rows: unknown[][]): void => {
  const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // BOM so Excel opens the ₹ / Unicode names correctly.
  res.send('﻿' + csv);
};

export const exportPeople = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const people = await Person.find({ userId, isDeleted: false }).sort({ area: 1 }).lean();
  const totals = await getTotalsByPerson(
    userId,
    people.map((p) => p._id)
  );

  const headers = [
    'Husband Name',
    'Wife Name',
    'Area',
    'Phone',
    'Alternate Phone',
    'Address',
    'Total Received',
    'Total Given',
    'Entries',
    'Last Transaction',
    'Notes',
  ];
  const rows = people.map((p) => {
    const t = totals[p._id.toString()];
    return [
      p.husbandName,
      p.wifeName,
      p.area,
      p.phone,
      p.alternatePhone,
      p.address,
      t?.received || 0,
      t?.given || 0,
      t?.transactionCount || 0,
      formatDate(t?.lastTransaction),
      p.notes,
    ];
  });

  sendCSV(res, 'people.csv', headers, rows);
};

export const exportTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const deleted = await getDeletedPersonIds(userId);
  const filter: Record<string, unknown> = { userId };
  if (deleted.length > 0) filter.personId = { $nin: deleted };

  const transactions = await Transaction.find(filter)
    .populate('personId', 'husbandName wifeName area')
    .populate('functionId', 'name type category date')
    .sort({ transactionDate: -1 })
    .lean();

  const headers = ['Date', 'Person', 'Area', 'Function', 'Function Category', 'Type', 'Amount', 'Attended', 'Notes'];
  const rows = transactions.map((t) => {
    const person = t.personId as unknown as Record<string, string | undefined> | null;
    const fn = t.functionId as unknown as Record<string, string | undefined> | null;
    const personName = [person?.husbandName, person?.wifeName].filter(Boolean).join(' & ');
    return [
      formatDate(t.transactionDate),
      personName,
      person?.area,
      fn?.name,
      fn?.category === 'RELATIVE' ? 'Relative Function' : 'Our Function',
      t.type === 'RECEIVED' ? 'Received' : 'Given',
      t.amount,
      t.attended ? 'Yes' : 'No',
      t.notes,
    ];
  });

  sendCSV(res, 'transactions.csv', headers, rows);
};

export const exportFunctions = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const functions = await FunctionEvent.find({ userId }).sort({ date: -1 }).lean();
  const totals = await getTotalsByFunction(
    userId,
    functions.map((f) => f._id)
  );

  const headers = ['Name', 'Category', 'Type', 'Date', 'Time', 'Location', 'People', 'Received', 'Given', 'Notes'];
  const rows = functions.map((f) => {
    const t = totals[f._id.toString()];
    return [
      f.name,
      f.category === 'RELATIVE' ? 'Relative Function' : 'Our Function',
      f.type,
      formatDate(f.date),
      f.time,
      f.location,
      t?.peopleCount || 0,
      t?.received || 0,
      t?.given || 0,
      f.notes,
    ];
  });

  sendCSV(res, 'functions.csv', headers, rows);
};
