import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import notFound from '@/middlewares/notFound';
import { globalErrorHandler } from '@/middlewares/errorHandler';
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/user/user.routes';
import fileUpload from 'express-fileupload';
import { rateLimiter } from '@/middlewares/rateLimiter';
import config from '@/config';
import { schedulars } from '@/schedulers';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from '@/docs/swagger-output.json';
import httpStatus from 'http-status';

const app: Application = express();
const corsOptions = {
  origin: config.client_url,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
// middleware--
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.set('trust proxy', 1);
app.use(rateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
schedulars();

// routes--
app.get('/', (_req, res) => {
  res.send('Hello World!');
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});
// Swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// not found middleware
app.use(notFound);
app.use(globalErrorHandler);

export default app;
