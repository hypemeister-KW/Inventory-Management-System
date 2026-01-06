import * as discountService from '../../src/services/discountService';
import Product from '../../src/models/Product';

// Mock Product model
jest.mock('../../src/models/Product');

describe('Discount Service', () => {
    describe('calculateVolumeDiscount', () => {
        it('should return 0% discount for less than 5 units', () => {
            expect(discountService.calculateVolumeDiscount(3)).toBe(0);
            expect(discountService.calculateVolumeDiscount(4)).toBe(0);
        });

        it('should return 10% discount for 5-9 units', () => {
            expect(discountService.calculateVolumeDiscount(5)).toBe(0.10);
            expect(discountService.calculateVolumeDiscount(7)).toBe(0.10);
            expect(discountService.calculateVolumeDiscount(9)).toBe(0.10);
        });

        it('should return 20% discount for 10-49 units', () => {
            expect(discountService.calculateVolumeDiscount(10)).toBe(0.20);
            expect(discountService.calculateVolumeDiscount(25)).toBe(0.20);
            expect(discountService.calculateVolumeDiscount(49)).toBe(0.20);
        });

        it('should return 30% discount for 50+ units', () => {
            expect(discountService.calculateVolumeDiscount(50)).toBe(0.30);
            expect(discountService.calculateVolumeDiscount(100)).toBe(0.30);
        });
    });

    describe('getLocationMultiplier', () => {
        it('should return 1.0 for US', () => {
            expect(discountService.getLocationMultiplier('US')).toBe(1.0);
        });

        it('should return 1.15 for Europe', () => {
            expect(discountService.getLocationMultiplier('Europe')).toBe(1.15);
        });

        it('should return 0.95 for Asia', () => {
            expect(discountService.getLocationMultiplier('Asia')).toBe(0.95);
        });

        it('should default to US multiplier for invalid location', () => {
            expect(discountService.getLocationMultiplier('Invalid' as any)).toBe(1.0);
        });
    });

    describe('calculateDiscounts', () => {
        beforeEach(() => {
            (Product.find as jest.Mock) = jest.fn();
        });

        it('should apply volume discount when higher than seasonal', async () => {
            (Product.find as jest.Mock).mockResolvedValue([]);

            const result = await discountService.calculateDiscounts(
                1000, // subtotal
                50,   // totalQuantity (30% volume discount)
                [{ productId: '123' }],
                'US'
            );

            expect(result.discountType).toBe('volume');
            expect(result.discount).toBe(300); // 30% of 1000
            expect(result.total).toBe(700);
        });

        it('should apply seasonal discount when higher than volume', async () => {
            const originalDate = Date;
            const mockDate = new originalDate('2024-11-29');
            global.Date = jest.fn(() => mockDate) as any;
            Object.setPrototypeOf(global.Date, originalDate);

            (Product.find as jest.Mock).mockResolvedValue([]);

            const result = await discountService.calculateDiscounts(
                1000, // subtotal
                3,    // totalQuantity (no volume discount)
                [{ productId: '123' }],
                'US'
            );

            expect(result.discountType).toBe('seasonal');
            expect(result.discount).toBe(250); // 25% of 1000
            expect(result.total).toBe(750);

            global.Date = originalDate;
        });

        it('should apply location multiplier correctly', async () => {
            (Product.find as jest.Mock).mockResolvedValue([]);

            const result = await discountService.calculateDiscounts(
                1000, // subtotal
                3,    // totalQuantity
                [{ productId: '123' }],
                'Europe'
            );

            expect(result.locationMultiplier).toBe(1.15);
            expect(result.total).toBe(1150); // 1000 * 1.15
        });

        it('should not allow negative total', async () => {
            (Product.find as jest.Mock).mockResolvedValue([]);

            const result = await discountService.calculateDiscounts(
                100,  // subtotal
                50,   // totalQuantity
                [{ productId: '123' }],
                'US'
            );

            expect(result.total).toBeGreaterThanOrEqual(0);
        });
    });
});

