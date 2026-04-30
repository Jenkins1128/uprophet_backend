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
const allowedOrigins = process.env.ALLOWED_ORIGINS 
	? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
	: ['https://uprophet.com', 'https://www.uprophet.com', 'http://localhost:3000'];

app.use(cors({
	credentials: true,
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);
		
		// Match uprophet.com and any of its subdomains, including optional ports
		const isUProphet = /^https?:\/\/([a-z0-9-]+\.)?uprophet\.com(:[0-9]+)?$/.test(origin);
		const isLocal = /^http:\/\/localhost(:[0-9]+)?$/.test(origin);
		
		if (isUProphet || isLocal || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(null, false);
		}
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	optionsSuccessStatus: 200
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`app is running on port ${PORT}`);
});
