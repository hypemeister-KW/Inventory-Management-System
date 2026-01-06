import express, { Request, Response, NextFunction } from 'express';
import * as productCommands from '../commands/productCommands';
import * as productQueries from '../queries/productQueries';
import {
    validateCreateProduct,
    validateRestockProduct,
    validateSellProduct,
    validateObjectId
} from '../middleware/validators';

const router = express.Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await productQueries.getAllProducts();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', validateCreateProduct, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await productCommands.createProduct(req.body);
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/restock', validateObjectId, validateRestockProduct, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const product = await productCommands.restockProduct(id, quantity);
        res.status(200).json({
            success: true,
            message: `Stock increased by ${quantity}`,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/sell', validateObjectId, validateSellProduct, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const product = await productCommands.sellProduct(id, quantity);
        res.status(200).json({
            success: true,
            message: `Stock decreased by ${quantity}`,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

export default router;

