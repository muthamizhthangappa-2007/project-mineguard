"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
const mineRoutes_js_1 = __importDefault(require("./routes/mineRoutes.js"));
const sectionRoutes_js_1 = __importDefault(require("./routes/sectionRoutes.js"));
const equipmentRoutes_js_1 = __importDefault(require("./routes/equipmentRoutes.js"));
const observationRoutes_js_1 = __importDefault(require("./routes/observationRoutes.js"));
const taskRoutes_js_1 = __importDefault(require("./routes/taskRoutes.js"));
const complianceRoutes_js_1 = __importDefault(require("./routes/complianceRoutes.js"));
const riskRoutes_js_1 = __importDefault(require("./routes/riskRoutes.js"));
const dashboardRoutes_js_1 = __importDefault(require("./routes/dashboardRoutes.js"));
const notificationRoutes_js_1 = __importDefault(require("./routes/notificationRoutes.js"));
const auditRoutes_js_1 = __importDefault(require("./routes/auditRoutes.js"));
const regulationRoutes_js_1 = __importDefault(require("./routes/regulationRoutes.js"));
const reportRoutes_js_1 = __importDefault(require("./routes/reportRoutes.js"));
const uploadRoutes_js_1 = __importDefault(require("./routes/uploadRoutes.js"));
const slaService_js_1 = require("./services/slaService.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
// Serve static uploads
const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
app.use('/uploads', express_1.default.static(uploadsPath));
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/users', userRoutes_js_1.default);
app.use('/api/mines', mineRoutes_js_1.default);
app.use('/api/sections', sectionRoutes_js_1.default);
app.use('/api/equipment', equipmentRoutes_js_1.default);
app.use('/api/observations', observationRoutes_js_1.default);
app.use('/api/tasks', taskRoutes_js_1.default);
app.use('/api/compliance', complianceRoutes_js_1.default);
app.use('/api/risk', riskRoutes_js_1.default);
app.use('/api/dashboard', dashboardRoutes_js_1.default);
app.use('/api/notifications', notificationRoutes_js_1.default);
app.use('/api/audit', auditRoutes_js_1.default);
app.use('/api/regulations', regulationRoutes_js_1.default);
app.use('/api/reports', reportRoutes_js_1.default);
app.use('/api/upload', uploadRoutes_js_1.default);
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
    (0, slaService_js_1.startSlaBackgroundWorker)();
});
