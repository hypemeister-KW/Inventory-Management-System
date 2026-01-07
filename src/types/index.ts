import { Document, Types } from 'mongoose';

export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'books' | 'other';
export type CustomerLocation = 'US' | 'Europe' | 'Asia';
export type DiscountType = 'volume' | 'seasonal' | 'none';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: ProductCategory;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICustomer extends Document {
    name: string;
    location: CustomerLocation;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IOrderItem {
    productId: Types.ObjectId | string;
    quantity: number;
    unitPrice: number;
}

export interface IOrder extends Document {
    customerId: Types.ObjectId | string;
    products: IOrderItem[];
    subtotal: number;
    discount: number;
    discountType: DiscountType;
    locationMultiplier: number;
    total: number;
    status: OrderStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateProductDto {
    name: string;
    description: string;
    price: number;
    stock: number;
    category?: ProductCategory;
}

export interface RestockProductDto {
    quantity: number;
}

export interface SellProductDto {
    quantity: number;
}

export interface OrderProductDto {
    productId: string;
    quantity: number;
}

export interface CreateOrderDto {
    customerId: string;
    products: OrderProductDto[];
}

export interface DiscountInfo {
    discount: number;
    discountType: DiscountType;
    locationMultiplier: number;
    total: number;
}

