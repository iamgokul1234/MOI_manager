import mongoose, { Document, Schema } from 'mongoose';

export interface IPerson extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  area: string;
  husbandName?: string;
  wifeName?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const personSchema = new Schema<IPerson>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    area: { type: String, required: true, trim: true },
    husbandName: { type: String, trim: true },
    wifeName: { type: String, trim: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
personSchema.index({ userId: 1, area: 1 });
personSchema.index({ userId: 1, husbandName: 1 });
personSchema.index({ userId: 1, wifeName: 1 });
personSchema.index({ userId: 1, phone: 1 });
personSchema.index(
  { husbandName: 'text', wifeName: 'text', area: 'text', phone: 'text' },
  { name: 'person_text_search' }
);

// Validation: at least one of husbandName or wifeName must be present
personSchema.pre('save', function (next) {
  if (!this.husbandName && !this.wifeName) {
    next(new Error('At least one of husbandName or wifeName must be provided'));
  } else {
    next();
  }
});

export const Person = mongoose.model<IPerson>('Person', personSchema);
