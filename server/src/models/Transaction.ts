import mongoose, { Document, Schema } from 'mongoose';

export const TRANSACTION_TYPES = ['RECEIVED', 'GIVEN'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  personId: mongoose.Types.ObjectId;
  functionId: mongoose.Types.ObjectId;
  type: TransactionType;
  /** Always positive. Direction is carried by `type`, never by sign. */
  amount: number;
  transactionDate: Date;
  /**
   * Per person, per function. Drives the strike-through checklist on the
   * Our Function people list. Scoped to this single transaction only.
   */
  attended: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
    functionId: { type: Schema.Types.ObjectId, ref: 'FunctionEvent', required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isFinite(v) && v > 0,
        message: 'Amount must be a positive number greater than 0',
      },
    },
    transactionDate: { type: Date, required: true },
    attended: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound indexes
transactionSchema.index({ userId: 1, personId: 1 });
transactionSchema.index({ userId: 1, functionId: 1 });
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, type: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
