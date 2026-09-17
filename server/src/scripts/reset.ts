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

async function resetAllData() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Person.deleteMany({}),
    FunctionEvent.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  console.log('✅ Cleared all database collections (Users, People, Functions, Transactions)');

  // Re-create a clean, fresh demo user with 0 people, 0 functions, 0 transactions
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const demoUser = await User.create({ name: 'Demo User', email: DEMO_EMAIL, passwordHash });
  console.log(`✅ Created fresh empty demo account: ${demoUser.email} / ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
  console.log('🎉 Reset completed! You can now log in with demo@moi.app / demo1234 and start completely from scratch.');
  process.exit(0);
}

resetAllData().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
