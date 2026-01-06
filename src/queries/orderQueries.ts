import Order from '../models/Order';
import { IOrder } from '../types';

export const getOrderById = async (orderId: string): Promise<IOrder> => {
    const order = await Order.findById(orderId)
        .populate('customerId', 'name location')
        .populate('products.productId', 'name description price category');

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
};

export const getAllOrders = async (): Promise<IOrder[]> => {
    return await Order.find({})
        .populate('customerId', 'name location')
        .populate('products.productId', 'name description price category');
};

