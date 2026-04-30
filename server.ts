import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import quoteRoutes from './routes/quotes.routes';
import userRoutes from './routes/user.routes';

const app = express();

// MIDDLEWARE
app.use(cors({
	credentials: true,
	origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://uprophet.com', 'https://www.uprophet.com', 'http://localhost:3000'],
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());
app.use(cookieParser());

// Test route
app.get('/api/test', (req, res) => {
	res.json({ test: 'its working!' });
});

// ROUTES
app.use('/api', authRoutes);
app.use('/api', quoteRoutes);
app.use('/api', userRoutes);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
	console.log(`app is running on port ${PORT}`);
});
