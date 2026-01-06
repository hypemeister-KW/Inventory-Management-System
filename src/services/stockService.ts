import Product from '../models/Product';
import { IProduct } from '../types';

interface StockAvailabilityResult {
    available: boolean;
    product: IProduct;
}

export const checkStockAvailability = async (
    productId: string,
    quantity: number
): Promise<StockAvailabilityResult> => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    return {
        available: product.stock >= quantity,
        product
    };
};

export const decreaseStock = async (productId: string, quantity: number): Promise<IProduct> => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    if (product.stock < quantity) {
        throw new Error('Insufficient stock');
    }

    product.stock -= quantity;
    await product.save();

    return product;
};

export const increaseStock = async (productId: string, quantity: number): Promise<IProduct> => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    product.stock += quantity;
    await product.save();

    return product;
};

interface OrderItem {
    productId: string;
    quantity: number;
}

export const updateStockForOrder = async (items: OrderItem[]): Promise<IProduct[]> => {
    const updates = items.map(async (item) => {
        return await decreaseStock(item.productId, item.quantity);
    });

    return Promise.all(updates);
};

