import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { Transaction } from '../models/Transaction';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moi-management';

const DEMO_EMAIL = 'demo@moi.app';
const DEMO_PASSWORD = 'demo1234';

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Reset only the demo user's data so other accounts are untouched.
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Promise.all([
      Person.deleteMany({ userId: existing._id }),
      FunctionEvent.deleteMany({ userId: existing._id }),
      Transaction.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
    console.log('Cleared previous demo data');
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, passwordHash });
  const userId = user._id;
  console.log(`Created user: ${user.email}`);

  // People
  const [suresh, ravi, karthik] = await Person.create([
    {
      userId,
      area: 'Palladam',
      husbandName: 'Suresh',
      wifeName: 'Kavitha',
      phone: '9876543210',
      address: '12, Main Road, Palladam',
    },
    {
      userId,
      area: 'Tiruppur',
      husbandName: 'Ravi',
      wifeName: 'Meena',
      phone: '9876543211',
      address: '5, Kumaran Street, Tiruppur',
    },
    {
      userId,
      area: 'Coimbatore',
      husbandName: 'Karthik',
      wifeName: 'Priya',
      phone: '9876543212',
      address: '48, RS Puram, Coimbatore',
    },
  ]);
  console.log('Created 3 people');

  // Functions: two we host (OUR), one we attend (RELATIVE, a few weeks out).
  const [krishWedding, housewarming, raviWedding] = await FunctionEvent.create([
    {
      userId,
      name: 'Krish Wedding',
      category: 'OUR',
      type: 'Wedding',
      date: daysFromNow(-120),
      location: 'Palladam Town Hall',
      notes: 'Reception in the evening',
    },
    {
      userId,
      name: 'Housewarming',
      category: 'OUR',
      type: 'Housewarming',
      date: daysFromNow(-30),
      location: 'New house, Coimbatore',
    },
    {
      userId,
      name: 'Ravi Wedding',
      category: 'RELATIVE',
      type: 'Wedding',
      date: daysFromNow(21),
      time: '18:30',
      location: 'Tiruppur Kalyana Mahal',
      notes: 'Take the gift box along',
    },
  ]);
  console.log('Created 3 functions');
  void raviWedding;

  // Transactions
  await Transaction.create([
    {
      userId,
      personId: suresh._id,
      functionId: krishWedding._id,
      type: 'RECEIVED',
      amount: 5000,
      transactionDate: krishWedding.date,
      attended: true,
      notes: 'Wedding gift from Suresh & Kavitha',
    },
    {
      userId,
      personId: ravi._id,
      functionId: krishWedding._id,
      type: 'RECEIVED',
      amount: 2000,
      transactionDate: krishWedding.date,
      attended: false,
      notes: 'Sent through a relative',
    },
    {
      userId,
      personId: karthik._id,
      functionId: housewarming._id,
      type: 'GIVEN',
      amount: 3000,
      transactionDate: housewarming.date,
      attended: true,
      notes: 'Given for Karthik housewarming',
    },
  ]);
  console.log('Created 3 transactions');

  console.log('\nSeed complete!');
  console.log(`Login:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
