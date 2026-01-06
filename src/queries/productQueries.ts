import Product from '../models/Product';
import { IProduct } from '../types';

export const getAllProducts = async (): Promise<IProduct[]> => {
    return await Product.find({});
};

export const getProductById = async (productId: string): Promise<IProduct> => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }
    return product;
};

