import express, { Request, Response, NextFunction } from 'express';
import * as orderCommands from '../commands/orderCommands';
import * as orderQueries from '../queries/orderQueries';
import { validateCreateOrder, validateObjectId } from '../middleware/validators';

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await orderQueries.getAllOrders();
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', validateObjectId, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const order = await orderQueries.getOrderById(id);
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', validateCreateOrder, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await orderCommands.createOrder(req.body);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
});

export default router;

