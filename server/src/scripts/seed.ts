import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Person } from '../models/Person';
import { FunctionEvent } from '../models/FunctionEvent';
import { Transaction } from '../models/Transaction';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moi-management';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clean existing data
  await Promise.all([
    User.deleteMany({}),
    Person.deleteMany({}),
    FunctionEvent.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@moi.app',
    passwordHash,
  });
  console.log(`👤 Created user: ${user.email}`);

  const userId = user._id;

  // Create people
  const [suresh, ravi, karthik] = await Person.create([
    { userId, area: 'Palladam', husbandName: 'Suresh', wifeName: 'Kavitha', phone: '9876543210' },
    { userId, area: 'Tiruppur', husbandName: 'Ravi', wifeName: 'Meena', phone: '9876543211' },
    { userId, area: 'Coimbatore', husbandName: 'Karthik', wifeName: 'Priya', phone: '9876543212' },
  ]);
  console.log('👨‍👩‍👧 Created 3 people');

  // Create functions
  const [krishWedding, raviWedding, housewarming] = await FunctionEvent.create([
    { userId, name: 'Krish Wedding', type: 'Wedding', date: new Date('2024-03-15'), location: 'Palladam Town Hall' },
    { userId, name: 'Ravi Wedding', type: 'Wedding', date: new Date('2024-06-20'), location: 'Tiruppur Kalyana Mahal' },
    { userId, name: 'Housewarming', type: 'Housewarming', date: new Date('2024-09-10'), location: 'Coimbatore' },
  ]);
  console.log('🎉 Created 3 functions');

  // Create transactions
  await Transaction.create([
    {
      userId,
      personId: suresh._id,
      functionId: krishWedding._id,
      type: 'RECEIVED',
      amount: 5000,
      transactionDate: new Date('2024-03-15'),
      notes: 'Wedding gift from Suresh & Kavitha',
    },
    {
      userId,
      personId: ravi._id,
      functionId: raviWedding._id,
      type: 'RECEIVED',
      amount: 2000,
      transactionDate: new Date('2024-06-20'),
      notes: 'Received at Ravi wedding',
    },
    {
      userId,
      personId: karthik._id,
      functionId: housewarming._id,
      type: 'GIVEN',
      amount: 3000,
      transactionDate: new Date('2024-09-10'),
      notes: 'Given for Karthik housewarming',
    },
  ]);
  console.log('💰 Created 3 transactions');

  console.log('\n✅ Seed complete!');
  console.log('📧 Login: demo@moi.app');
  console.log('🔑 Password: demo1234');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
