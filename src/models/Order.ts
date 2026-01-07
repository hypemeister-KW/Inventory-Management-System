import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, IOrderItem, DiscountType, OrderStatus } from '../types';

const orderItemSchema = new Schema<IOrderItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    }
});

const orderSchema = new Schema<IOrder>({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    products: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ['volume', 'seasonal', 'none'] as DiscountType[],
        default: 'none'
    },
    locationMultiplier: {
        type: Number,
        default: 1
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'] as OrderStatus[],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default Order;

