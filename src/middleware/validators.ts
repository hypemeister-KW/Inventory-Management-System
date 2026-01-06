import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const createProductSchema = Joi.object({
    name: Joi.string()
        .required()
        .max(50)
        .messages({
            'string.empty': 'Product name is required',
            'string.max': 'Product name cannot exceed 50 characters',
            'any.required': 'Product name is required'
        }),
    description: Joi.string()
        .required()
        .max(50)
        .messages({
            'string.empty': 'Product description is required',
            'string.max': 'Description cannot exceed 50 characters',
            'any.required': 'Product description is required'
        }),
    price: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Price must be positive',
            'any.required': 'Product price is required'
        }),
    stock: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            'number.min': 'Stock cannot be negative',
            'any.required': 'Stock is required'
        }),
    category: Joi.string()
        .valid('electronics', 'clothing', 'food', 'books', 'other')
        .optional()
        .default('other')
});

const restockProductSchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.positive': 'Restock quantity must be positive',
            'any.required': 'Quantity is required'
        })
});

const sellProductSchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.positive': 'Sell quantity must be positive',
            'any.required': 'Quantity is required'
        })
});

const createOrderSchema = Joi.object({
    customerId: Joi.string()
        .required()
        .messages({
            'string.empty': 'Customer ID is required',
            'any.required': 'Customer ID is required'
        }),
    products: Joi.array()
        .min(1)
        .items(
            Joi.object({
                productId: Joi.string().required(),
                quantity: Joi.number().integer().positive().required()
            })
        )
        .required()
        .messages({
            'array.min': 'Order must contain at least one product',
            'any.required': 'Products are required'
        })
});

const validate = (schema: Joi.ObjectSchema) => {
    return (_req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(_req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
            return;
        }

        next();
    };
};

export const validateObjectId = (_req: Request, res: Response, next: NextFunction): void => {
    const { id } = _req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({
            success: false,
            message: 'Invalid product ID format'
        });
        return;
    }

    next();
};

export const validateCreateProduct = validate(createProductSchema);
export const validateRestockProduct = validate(restockProductSchema);
export const validateSellProduct = validate(sellProductSchema);
export const validateCreateOrder = validate(createOrderSchema);

