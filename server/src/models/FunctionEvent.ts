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

export const FUNCTION_CATEGORIES = ['OUR', 'RELATIVE'] as const;

export type FunctionType = (typeof FUNCTION_TYPES)[number];
export type FunctionCategory = (typeof FUNCTION_CATEGORIES)[number];

export interface IFunctionEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  /** OUR = we host it (full Moi ledger). RELATIVE = someone else's event we plan to attend. */
  category: FunctionCategory;
  /** One of FUNCTION_TYPES or a custom label typed by the user. */
  type: string;
  date: Date;
  /** Free-form time such as "18:30" or "6:30 PM"; mostly used for RELATIVE functions. */
  time?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const functionEventSchema = new Schema<IFunctionEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: FUNCTION_CATEGORIES, required: true, default: 'OUR' },
    type: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

functionEventSchema.index({ userId: 1, category: 1, date: -1 });
functionEventSchema.index({ userId: 1, date: -1 });
functionEventSchema.index({ userId: 1, type: 1 });

export const FunctionEvent = mongoose.model<IFunctionEvent>('FunctionEvent', functionEventSchema);
