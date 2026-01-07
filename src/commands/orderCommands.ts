import Order from '../models/Order';
import Product from '../models/Product';
import Customer from '../models/Customer';
import * as stockService from '../services/stockService';
import * as discountService from '../services/discountService';
import { CreateOrderDto, IOrderItem, IOrder } from '../types';
import mongoose from 'mongoose';

export const createOrder = async (orderData: CreateOrderDto): Promise<IOrder> => {
    const { customerId, products } = orderData;

    let session: mongoose.ClientSession | undefined;
    let useTransaction = false;

    const isTransactionError = (error: any): boolean => {
        return error?.message?.includes('Transaction numbers are only allowed') ||
            error?.message?.includes('replica set') ||
            error?.code === 251;
    };

    try {
        if (mongoose.connection.readyState === 1) {
            session = await mongoose.startSession();
            try {
                session.startTransaction();
                useTransaction = true;
            } catch (error: any) {
                if (session) {
                    try {
                        session.endSession();
                    } catch (e) {
                    }
                }
                session = undefined;
                useTransaction = false;
            }
        }
    } catch (error) {
        session = undefined;
        useTransaction = false;
    }

    try {
        let customer;
        try {
            const customerQuery = Customer.findById(customerId);
            if (session) {
                customerQuery.session(session);
            }
            customer = await customerQuery;
        } catch (error: any) {
            if (isTransactionError(error) && session) {
                session = undefined;
                useTransaction = false;
                customer = await Customer.findById(customerId);
            } else {
                throw error;
            }
        }

        if (!customer) {
            throw new Error('Customer not found');
        }

        let subtotal = 0;
        const orderItems: IOrderItem[] = [];
        const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

        for (const item of products) {
            let product;
            try {
                const productQuery = Product.findById(item.productId);
                if (session) {
                    productQuery.session(session);
                }
                product = await productQuery;
            } catch (error: any) {
                if (isTransactionError(error) && session) {
                    session = undefined;
                    useTransaction = false;
                    product = await Product.findById(item.productId);
                } else {
                    throw error;
                }
            }

            if (!product) {
                throw new Error('Product not found');
            }

            const stockCheck = await stockService.checkStockAvailability(
                item.productId,
                item.quantity,
                session
            );
            if (!stockCheck.available) {
                throw new Error('Insufficient stock');
            }

            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price
            });

            subtotal += product.price * item.quantity;
        }

        const discountInfo = await discountService.calculateDiscounts(
            subtotal,
            totalQuantity,
            orderItems.map(item => ({ productId: item.productId.toString() })),
            customer.location
        );

        const order = new Order({
            customerId,
            products: orderItems,
            subtotal,
            discount: discountInfo.discount,
            discountType: discountInfo.discountType,
            locationMultiplier: discountInfo.locationMultiplier,
            total: discountInfo.total,
            status: 'completed'
        });

        try {
            if (session) {
                await order.save({ session });
            } else {
                await order.save();
            }
        } catch (error: any) {
            if (isTransactionError(error) && session) {
                session = undefined;
                useTransaction = false;
                await order.save();
            } else {
                throw error;
            }
        }

        try {
            await stockService.updateStockForOrder(
                orderItems.map(item => ({ productId: item.productId.toString(), quantity: item.quantity })),
                session
            );
        } catch (error: any) {
            if (isTransactionError(error) && session) {
                session = undefined;
                useTransaction = false;
                await stockService.updateStockForOrder(
                    orderItems.map(item => ({ productId: item.productId.toString(), quantity: item.quantity })),
                    undefined
                );
            } else {
                throw error;
            }
        }

        if (useTransaction && session) {
            await session.commitTransaction();
        }

        await order.populate('customerId', 'name location');
        await order.populate('products.productId', 'name description price');

        return order;
    } catch (error) {
        if (useTransaction && session) {
            try {
                await session.abortTransaction();
            } catch (txError) {

            }
        }
        throw error;
    } finally {
        if (session) {
            try {
                session.endSession();
            } catch (e) {
            }
        }
    }
};

