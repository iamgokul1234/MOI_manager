import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'RECEIVED' | 'GIVEN';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  personId: mongoose.Types.ObjectId;
  functionId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
    functionId: { type: Schema.Types.ObjectId, ref: 'FunctionEvent', required: true, index: true },
    type: { type: String, enum: ['RECEIVED', 'GIVEN'], required: true },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => v > 0,
        message: 'Amount must be a positive number greater than 0',
      },
    },
    transactionDate: { type: Date, required: true },
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
