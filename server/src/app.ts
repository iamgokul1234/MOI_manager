import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import peopleRoutes from './routes/people.routes';
import functionsRoutes from './routes/functions.routes';
import transactionsRoutes from './routes/transactions.routes';
import reportsRoutes from './routes/reports.routes';
import exportRoutes from './routes/export.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Moi Management API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/functions', functionsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler
app.use(errorHandler);

export default app;
