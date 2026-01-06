import { Request, Response, NextFunction } from 'express';

//@ts-ignore: This is a workaround to allow the error to be extended
interface ErrorWithStatus extends Error {
    statusCode?: number;
    code?: number;
    name?: string;
    errors?: any;
    stack?: string;
}


const errorHandler = (
    err: ErrorWithStatus,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 400;
        const errors = Object.values(err.errors).map((e: any) => ({
            field: e.path,
            message: e.message
        }));
        return res.status(statusCode).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = 'Resource already exists';
    }

    if (err.message === 'Product not found' || err.message === 'Customer not found' || err.message === 'Order not found' || err.message.includes('not found')) {
        statusCode = 404;
    }

    if (err.message === 'Insufficient stock' || err.message.includes('Insufficient stock')) {
        statusCode = 400;
    }

    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        statusCode
    });

    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorHandler;

