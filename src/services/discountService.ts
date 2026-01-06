import {
    VOLUME_DISCOUNTS,
    SEASONAL_DISCOUNTS,
    HOLIDAY_SALE_CATEGORIES,
    LOCATION_MULTIPLIERS,
    BLACK_FRIDAY_2024,
    POLISH_HOLIDAYS_2024
} from '../utils/constants';
import Product from '../models/Product';
import { DiscountInfo, CustomerLocation } from '../types';

export const calculateVolumeDiscount = (totalQuantity: number): number => {
    if (totalQuantity >= VOLUME_DISCOUNTS.LEVEL_3.min) {
        return VOLUME_DISCOUNTS.LEVEL_3.discount;
    } else if (totalQuantity >= VOLUME_DISCOUNTS.LEVEL_2.min && totalQuantity <= VOLUME_DISCOUNTS.LEVEL_2.max) {
        return VOLUME_DISCOUNTS.LEVEL_2.discount;
    } else if (totalQuantity >= VOLUME_DISCOUNTS.LEVEL_1.min && totalQuantity <= VOLUME_DISCOUNTS.LEVEL_1.max) {
        return VOLUME_DISCOUNTS.LEVEL_1.discount;
    }
    return 0;
};

export const isBlackFriday = (): boolean => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return todayStr === BLACK_FRIDAY_2024;
};

export const isHoliday = (): boolean => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return POLISH_HOLIDAYS_2024.includes(todayStr);
};

const hasHolidaySaleCategory = async (orderItems: Array<{ productId: string }>): Promise<boolean> => {
    const productIds = orderItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    return products.some(product => HOLIDAY_SALE_CATEGORIES.includes(product.category));
};

export const calculateSeasonalDiscount = async (orderItems: Array<{ productId: string }>): Promise<{ discount: number; type: string }> => {
    if (isBlackFriday()) {
        return { discount: SEASONAL_DISCOUNTS.BLACK_FRIDAY, type: 'seasonal' };
    }

    if (isHoliday() && await hasHolidaySaleCategory(orderItems)) {
        return { discount: SEASONAL_DISCOUNTS.HOLIDAY_SALE, type: 'seasonal' };
    }

    return { discount: 0, type: 'none' };
};

export const getLocationMultiplier = (location: CustomerLocation): number => {
    return LOCATION_MULTIPLIERS[location] || LOCATION_MULTIPLIERS.US;
};

export const calculateDiscounts = async (
    subtotal: number,
    totalQuantity: number,
    orderItems: Array<{ productId: string }>,
    location: CustomerLocation
): Promise<DiscountInfo> => {
    const volumeDiscountRate = calculateVolumeDiscount(totalQuantity);
    const volumeDiscount = subtotal * volumeDiscountRate;

    const seasonalDiscountInfo = await calculateSeasonalDiscount(orderItems);
    const seasonalDiscount = subtotal * seasonalDiscountInfo.discount;

    const locationMultiplier = getLocationMultiplier(location);
    const locationAdjustedSubtotal = subtotal * locationMultiplier;

    let finalDiscount = 0;
    let discountType: 'volume' | 'seasonal' | 'none' = 'none';

    if (seasonalDiscount > volumeDiscount) {
        finalDiscount = seasonalDiscount * locationMultiplier;
        discountType = 'seasonal';
    } else if (volumeDiscount > 0) {
        finalDiscount = volumeDiscount * locationMultiplier;
        discountType = 'volume';
    }

    const total = locationAdjustedSubtotal - finalDiscount;

    return {
        discount: finalDiscount,
        discountType,
        locationMultiplier,
        total: Math.max(0, total)
    };
};

