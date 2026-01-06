import { ProductCategory } from '../types';


export const POLISH_HOLIDAYS_2024: string[] = [
    '2024-01-01',
    '2024-01-06',
    '2024-03-31',
    '2024-04-01',
    '2024-05-01',
    '2024-05-03',
    '2024-05-19',
    '2024-05-30',
    '2024-08-15',
    '2024-11-01',
    '2024-11-11',
    '2024-12-25',
    '2024-12-26'
];

export const BLACK_FRIDAY_2024 = '2024-11-29';

export const VOLUME_DISCOUNTS = {
    LEVEL_1: { min: 5, max: 9, discount: 0.10 },
    LEVEL_2: { min: 10, max: 49, discount: 0.20 },
    LEVEL_3: { min: 50, discount: 0.30 }
};

export const SEASONAL_DISCOUNTS = {
    BLACK_FRIDAY: 0.25,
    HOLIDAY_SALE: 0.15
};

export const HOLIDAY_SALE_CATEGORIES: ProductCategory[] = ['electronics', 'clothing'];

export const LOCATION_MULTIPLIERS = {
    US: 1.0,
    Europe: 1.15,
    Asia: 0.95
} as const;

