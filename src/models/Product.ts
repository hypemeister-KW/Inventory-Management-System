import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, ProductCategory } from '../types';

const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        maxlength: [50, 'Product name cannot exceed 50 characters'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [50, 'Description cannot exceed 50 characters'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0.01, 'Price must be positive'],
        validate: {
            validator: function (v: number) {
                return v > 0;
            },
            message: 'Price must be positive'
        }
    },
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    category: {
        type: String,
        enum: ['electronics', 'clothing', 'food', 'books', 'other'] as ProductCategory[],
        default: 'other'
    }
}, {
    timestamps: true
});

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;

