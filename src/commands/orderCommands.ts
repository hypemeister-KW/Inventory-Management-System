import Order from '../models/Order';
import Product from '../models/Product';
import Customer from '../models/Customer';
import * as stockService from '../services/stockService';
import * as discountService from '../services/discountService';
import { CreateOrderDto, IOrderItem, IOrder } from '../types';

export const createOrder = async (orderData: CreateOrderDto): Promise<IOrder> => {
    const { customerId, products } = orderData;

    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new Error('Customer not found');
    }

    let subtotal = 0;
    const orderItems: IOrderItem[] = [];
    const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

    for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
        }

        const stockCheck = await stockService.checkStockAvailability(item.productId, item.quantity);
        if (!stockCheck.available) {
            throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
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
        orderItems,
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

    await order.save();

    await stockService.updateStockForOrder(
        orderItems.map(item => ({ productId: item.productId, quantity: item.quantity }))
    );

    await order.populate('customerId', 'name location');
    await order.populate('products.productId', 'name description price');

    return order;
};

