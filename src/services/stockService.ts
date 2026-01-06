import Product from '../models/Product';
import { IProduct } from '../types';
import mongoose from 'mongoose';

interface StockAvailabilityResult {
    available: boolean;
    product: IProduct;
}

export const checkStockAvailability = async (
    productId: string,
    quantity: number,
    session?: mongoose.ClientSession
): Promise<StockAvailabilityResult> => {
    const query = Product.findById(productId);
    if (session) {
        query.session(session);
    }
    const product = await query;

    if (!product) {
        throw new Error('Product not found');
    }

    return {
        available: product.stock >= quantity,
        product
    };
};

export const decreaseStock = async (
    productId: string,
    quantity: number,
    session?: mongoose.ClientSession
): Promise<IProduct> => {
    const options: any = { new: true };
    if (session) {
        options.session = session;
    }

    const product = await Product.findOneAndUpdate(
        {
            _id: productId,
            stock: { $gte: quantity }
        },
        {
            $inc: { stock: -quantity }
        },
        options
    );

    if (!product) {
        const existsQuery = Product.findById(productId);
        if (session) {
            existsQuery.session(session);
        }
        const exists = await existsQuery;
        if (!exists) {
            throw new Error('Product not found');
        }
        throw new Error('Insufficient stock');
    }

    return product as unknown as IProduct;
};

export const increaseStock = async (
    productId: string,
    quantity: number,
    session?: mongoose.ClientSession
): Promise<IProduct> => {
    const options: any = { new: true };
    if (session) {
        options.session = session;
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        {
            $inc: { stock: quantity }
        },
        options
    );

    if (!product) {
        throw new Error('Product not found');
    }

    return product as unknown as IProduct;
};

interface OrderItem {
    productId: string;
    quantity: number;
}

export const updateStockForOrder = async (
    items: OrderItem[],
    session?: mongoose.ClientSession
): Promise<IProduct[]> => {
    const updates = items.map(async (item) => {
        return await decreaseStock(item.productId, item.quantity, session);
    });

    return Promise.all(updates);
};

