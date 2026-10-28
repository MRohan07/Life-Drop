import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env.js';
import { prisma } from './config/database.js';
import { errorHandler } from './common/middleware/error.middleware.js';
import { generalLimiter } from './common/middleware/rateLimiter.js';
import { swaggerDocument } from './docs/swagger.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { donorsRoutes } from './modules/donors/donors.routes.js';
import { hospitalsRoutes } from './modules/hospitals/hospitals.routes.js';
import { bloodBanksRoutes } from './modules/blood-banks/blood-banks.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { requestsRoutes } from './modules/blood-requests/requests.routes.js';
import { donationsRoutes } from './modules/donations/donations.routes.js';
import { campaignsRoutes } from './modules/campaigns/campaigns.routes.js';
import { appointmentsRoutes } from './modules/appointments/appointments.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { feedbackRoutes } from './modules/feedback/feedback.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { facilityApplicationsRoutes } from './modules/facility-applications/facility-applications.routes.js';

export const app = express();

// Trust reverse proxy (Render, Cloudflare, etc.) for correct client IP & HTTPS detection
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI inline styles
  })
);

// Allowed Origins for CORS
const allowedOrigins = new Set([
  ...ENV.CORS_ORIGINS,
  ...(ENV.FRONTEND_URL ? [ENV.FRONTEND_URL] : []),
]);

const isOriginAllowed = (origin: string | undefined): boolean => {
  // Allow requests without Origin header (curl, server-to-server, health probes)
  if (!origin) return true;

  // Exact match from allowed origins
  if (allowedOrigins.has(origin)) return true;

  // Allow Vercel, Render, and Netlify production & preview deployments
  try {
    const parsed = new URL(origin);
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.vercel.app') ||
        parsed.hostname.endsWith('.onrender.com') ||
        parsed.hostname.endsWith('.netlify.app'))
    ) {
      return true;
    }
  } catch {
    return false;
  }

  // In non-production environments, allow local development ports
  if (ENV.NODE_ENV !== 'production') {
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true;
    }
  }

  return false;
};

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
      }
    },
    credentials: true,
  })
);

// Body Parsing & Cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
app.use(generalLimiter);

// Liveness & Database Readiness Health Endpoints
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
};

const readinessHandler = async (req: express.Request, res: express.Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: ENV.NODE_ENV === 'production' ? 'Database connection failure' : err.message,
    });
  }
};

app.get('/health', healthHandler);
app.get('/health/ready', readinessHandler);
app.get('/api/v1/health', healthHandler);
app.get('/api/v1/health/ready', readinessHandler);

// Swagger Documentation UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Versioned REST API v1
const apiV1 = express.Router();

apiV1.use('/auth', authRoutes);
apiV1.use('/users', usersRoutes);
apiV1.use('/donors', donorsRoutes);
apiV1.use('/hospitals', hospitalsRoutes);
apiV1.use('/blood-banks', bloodBanksRoutes);
apiV1.use('/blood-banks/me/inventory', inventoryRoutes);
apiV1.use('/inventory', inventoryRoutes);
apiV1.use('/blood-requests', requestsRoutes);
apiV1.use('/donations', donationsRoutes);
apiV1.use('/campaigns', campaignsRoutes);
apiV1.use('/appointments', appointmentsRoutes);
apiV1.use('/notifications', notificationsRoutes);
apiV1.use('/feedback', feedbackRoutes);
apiV1.use('/reports', reportsRoutes);
apiV1.use('/admin', adminRoutes);
apiV1.use('/facility-applications', facilityApplicationsRoutes);

app.use('/api/v1', apiV1);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
