import mongoose, { Schema, Model } from 'mongoose';
import { ICustomer, CustomerLocation } from '../types';

const customerSchema = new Schema<ICustomer>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        enum: ['US', 'Europe', 'Asia'] as CustomerLocation[],
        required: true,
        default: 'US'
    }
}, {
    timestamps: true
});

const Customer: Model<ICustomer> = mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;

