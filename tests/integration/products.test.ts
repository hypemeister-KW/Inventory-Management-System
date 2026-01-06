import request from 'supertest';
import app from '../../src/app';
import Product from '../../src/models/Product';
import mongoose from 'mongoose';

describe('Products API Integration Tests', () => {
    beforeAll(async () => {
        // Connect to test database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-management-test';
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        // Clean up and close connection
        await Product.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear products before each test
        await Product.deleteMany({});
    });

    describe('POST /products', () => {
        it('should create a new product', async () => {
            const productData = {
                name: 'Test Product',
                description: 'Test Description',
                price: 29.99,
                stock: 100
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(productData.name);
            expect(response.body.data.price).toBe(productData.price);
        });

        it('should return validation error for missing fields', async () => {
            const response = await request(app)
                .post('/products')
                .send({ name: 'Test' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should return validation error for price <= 0', async () => {
            const productData = {
                name: 'Test Product',
                description: 'Test Description',
                price: -10,
                stock: 100
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /products', () => {
        it('should retrieve all products', async () => {
            // Create test products
            await Product.create([
                { name: 'Product 1', description: 'Desc 1', price: 10, stock: 50 },
                { name: 'Product 2', description: 'Desc 2', price: 20, stock: 30 }
            ]);

            const response = await request(app)
                .get('/products')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.data).toHaveLength(2);
        });
    });

    describe('POST /products/:id/restock', () => {
        it('should increase product stock', async () => {
            const product = await Product.create({
                name: 'Test Product',
                description: 'Test Description',
                price: 10,
                stock: 50
            });

            const response = await request(app)
                .post(`/products/${product._id}/restock`)
                .send({ quantity: 25 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.stock).toBe(75);
        });

        it('should return error for invalid product ID', async () => {
            const response = await request(app)
                .post('/products/invalid-id/restock')
                .send({ quantity: 25 })
                .expect(400);
        });
    });

    describe('POST /products/:id/sell', () => {
        it('should decrease product stock', async () => {
            const product = await Product.create({
                name: 'Test Product',
                description: 'Test Description',
                price: 10,
                stock: 50
            });

            const response = await request(app)
                .post(`/products/${product._id}/sell`)
                .send({ quantity: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.stock).toBe(30);
        });

        it('should prevent stock from going below zero', async () => {
            const product = await Product.create({
                name: 'Test Product',
                description: 'Test Description',
                price: 10,
                stock: 10
            });

            const response = await request(app)
                .post(`/products/${product._id}/sell`)
                .send({ quantity: 15 })
                .expect(500); // Will be caught by error handler

            // Verify stock was not decreased
            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct?.stock).toBe(10);
        });
    });
});

