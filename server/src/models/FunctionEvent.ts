import mongoose, { Document, Schema } from 'mongoose';

export const FUNCTION_TYPES = [
  'Wedding',
  'Housewarming',
  'Birthday',
  'EarPiercing',
  'Engagement',
  'BabyShower',
  'Funeral',
  'Other',
] as const;

export type FunctionType = (typeof FUNCTION_TYPES)[number];

export interface IFunctionEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: string;
  date: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const functionEventSchema = new Schema<IFunctionEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

functionEventSchema.index({ userId: 1, date: -1 });
functionEventSchema.index({ userId: 1, type: 1 });

export const FunctionEvent = mongoose.model<IFunctionEvent>('FunctionEvent', functionEventSchema);
