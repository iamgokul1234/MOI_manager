import { Person, IPerson } from '../models/Person';
import { FunctionEvent, IFunctionEvent } from '../models/FunctionEvent';
import { Transaction, ITransaction } from '../models/Transaction';
import { isObjectId } from '../utils';

/**
 * Every lookup in this file is scoped to the authenticated user. Controllers
 * must never trust ids coming from the client without going through here.
 */

export const findOwnedPerson = async (
  userId: string,
  personId: unknown
): Promise<IPerson | null> => {
  if (!isObjectId(personId)) return null;
  return Person.findOne({ _id: personId, userId, isDeleted: false });
};

export const findOwnedFunction = async (
  userId: string,
  functionId: unknown
): Promise<IFunctionEvent | null> => {
  if (!isObjectId(functionId)) return null;
  return FunctionEvent.findOne({ _id: functionId, userId });
};

export const findOwnedTransaction = async (
  userId: string,
  transactionId: unknown
): Promise<ITransaction | null> => {
  if (!isObjectId(transactionId)) return null;
  return Transaction.findOne({ _id: transactionId, userId });
};
