import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import connectDB from './db-config/database';
import errorHandler from './middleware/errorHandler';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';

dotenv.config();

const app = express();

if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});


app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;

