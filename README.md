# Moi Management

A production-quality full-stack app for digitally tracking Moi — gift money exchanged at Indian family functions like weddings, housewarmings, birthdays, ear-piercings, and more.

## Tech Stack

- **Frontend**: React + TypeScript + Vite, React Router, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts, lucide-react
- **Backend**: Node.js + Express + TypeScript, Mongoose (MongoDB), JWT auth (HTTP-only cookies), bcrypt, Zod, Helmet, CORS, express-rate-limit
- **Database**: MongoDB (local or Atlas)

## Project Structure

```
moi-management/
  server/    - Express API server
  client/    - React Vite frontend
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local instance or Atlas connection string)

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

**Server** (`server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/moi-management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

**Client** (no `.env` needed in development — Vite proxies API calls to the server).

### 3. Start MongoDB

Make sure MongoDB is running locally:
```bash
mongod
```
Or use a MongoDB Atlas connection string in `MONGODB_URI`.

### 4. Seed sample data (optional)

```bash
cd server
npm run seed
```

This creates:
- Demo user: `demo@moi.app` / `demo1234`
- 3 people: Suresh & Kavitha (Palladam), Ravi & Meena (Tiruppur), Karthik & Priya (Coimbatore)
- 3 functions: Krish Wedding, Ravi Wedding, Housewarming
- 3 transactions

### 5. Run the development servers

**Server** (terminal 1):
```bash
cd server
npm run dev
```
Server starts at http://localhost:5000

**Client** (terminal 2):
```bash
cd client
npm run dev
```
App opens at http://localhost:5173

## Features

- **Auth**: JWT stored in HTTP-only cookies, bcrypt password hashing
- **People**: Add families, search, duplicate detection, soft delete, detail view
- **Functions**: Track events (Wedding, Housewarming, Birthday, etc.)
- **Transactions**: Record Received/Given amounts with full history
- **Function Mode**: Fast real-time entry during events — optimized for one-hand mobile use
- **Dashboard**: Real-time stat cards, recent transactions, upcoming functions
- **Reports**: Summary, per-function, per-area, year-wise breakdowns with Recharts chart
- **Export**: CSV download for people, functions, and transactions

## Deployment

### Backend (Render/Railway)
1. Set environment variables (use MongoDB Atlas URI)
2. Build: `npm run build`
3. Start: `node dist/server.js`

### Frontend (Vercel)
1. Set `VITE_API_URL` to your backend URL
2. Update the Vite proxy config or use the env variable in axios base URL
3. Deploy `client/` directory

## Security
- JWT in HTTP-only, SameSite=Lax cookies
- Rate limiting on auth routes (20 req/15min)
- Helmet security headers
- All queries scoped by authenticated userId
- Server-side Zod validation on all mutating endpoints
- Ownership validation for transaction personId/functionId
