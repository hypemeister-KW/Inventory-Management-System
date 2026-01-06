import Product from '../models/Product';
import { IProduct } from '../types';
import * as stockService from '../services/stockService';
import { CreateProductDto } from '../types';

export const createProduct = async (productData: CreateProductDto): Promise<IProduct> => {
    const product = new Product(productData);
    await product.save();
    return product;
};

export const restockProduct = async (productId: string, quantity: number): Promise<IProduct> => {
    if (quantity <= 0) {
        throw new Error('Restock quantity must be positive');
    }

    const product = await stockService.increaseStock(productId, quantity);
    return product;
};

export const sellProduct = async (productId: string, quantity: number): Promise<IProduct> => {
    if (quantity <= 0) {
        throw new Error('Sell quantity must be positive');
    }

    const product = await stockService.decreaseStock(productId, quantity);
    return product;
};

