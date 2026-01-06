import * as stockService from '../../src/services/stockService';
import Product from '../../src/models/Product';

// Mock Product model
jest.mock('../../src/models/Product');

describe('Stock Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkStockAvailability', () => {
        it('should return true when stock is sufficient', async () => {
            const mockProduct = { _id: '123', name: 'Test Product', stock: 10 } as any;
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            const result = await stockService.checkStockAvailability('123', 5);

            expect(result.available).toBe(true);
            expect(result.product).toEqual(mockProduct);
        });

        it('should return false when stock is insufficient', async () => {
            const mockProduct = { _id: '123', name: 'Test Product', stock: 3 } as any;
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            const result = await stockService.checkStockAvailability('123', 5);

            expect(result.available).toBe(false);
        });

        it('should throw error when product not found', async () => {
            (Product.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                stockService.checkStockAvailability('123', 5)
            ).rejects.toThrow('Product not found');
        });
    });

    describe('decreaseStock', () => {
        it('should decrease stock successfully', async () => {
            const mockProduct = {
                _id: '123',
                stock: 10,
                save: jest.fn().mockResolvedValue(true)
            } as any;
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            await stockService.decreaseStock('123', 5);

            expect(mockProduct.stock).toBe(5);
            expect(mockProduct.save).toHaveBeenCalled();
        });

        it('should throw error when stock is insufficient', async () => {
            const mockProduct = { _id: '123', stock: 3 } as any;
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            await expect(
                stockService.decreaseStock('123', 5)
            ).rejects.toThrow('Insufficient stock');
        });

        it('should throw error when product not found', async () => {
            (Product.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                stockService.decreaseStock('123', 5)
            ).rejects.toThrow('Product not found');
        });
    });

    describe('increaseStock', () => {
        it('should increase stock successfully', async () => {
            const mockProduct = {
                _id: '123',
                stock: 10,
                save: jest.fn().mockResolvedValue(true)
            } as any;
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            await stockService.increaseStock('123', 5);

            expect(mockProduct.stock).toBe(15);
            expect(mockProduct.save).toHaveBeenCalled();
        });

        it('should throw error when product not found', async () => {
            (Product.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                stockService.increaseStock('123', 5)
            ).rejects.toThrow('Product not found');
        });
    });
});

