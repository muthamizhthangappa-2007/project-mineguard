import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mineRoutes from './routes/mineRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import observationRoutes from './routes/observationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import regulationRoutes from './routes/regulationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { startSlaBackgroundWorker } from './services/slaService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mines', mineRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/regulations', regulationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'MineGuard AI Backend',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MineGuard AI Server running on port ${PORT}`);
  console.log(`📡 API endpoints ready at http://localhost:${PORT}/api`);
  console.log(`📁 Static uploads served from ${uploadsPath}`);
  startSlaBackgroundWorker();
});
