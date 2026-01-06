import request from 'supertest';
import app from '../../src/app';
import Product from '../../src/models/Product';
import Customer from '../../src/models/Customer';
import Order from '../../src/models/Order';
import mongoose from 'mongoose';

describe('Orders API Integration Tests', () => {
    let testCustomer: any;
    let testProducts: any;

    beforeAll(async () => {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-management-test';
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await Product.deleteMany({});
        await Customer.deleteMany({});
        await Order.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear all collections
        await Product.deleteMany({});
        await Customer.deleteMany({});
        await Order.deleteMany({});

        // Create test customer
        testCustomer = await Customer.create({
            name: 'Test Customer',
            location: 'US'
        });

        // Create test products
        testProducts = await Product.create([
            {
                name: 'Product 1',
                description: 'Description 1',
                price: 10,
                stock: 100,
                category: 'electronics'
            },
            {
                name: 'Product 2',
                description: 'Description 2',
                price: 20,
                stock: 50,
                category: 'clothing'
            }
        ]);

        // Refresh references to ensure they're valid
        testCustomer = await Customer.findById(testCustomer._id);
        testProducts = await Product.find({ _id: { $in: testProducts.map((p: any) => p._id) } });
    });

    describe('POST /orders', () => {
        it('should create a new order successfully', async () => {
            const orderData = {
                customerId: testCustomer._id.toString(),
                products: [
                    { productId: testProducts[0]._id.toString(), quantity: 2 },
                    { productId: testProducts[1]._id.toString(), quantity: 1 }
                ]
            };

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total).toBeGreaterThan(0);
            expect(response.body.data.status).toBe('completed');

            // Verify stock was updated
            const updatedProduct1 = await Product.findById(testProducts[0]._id);
            const updatedProduct2 = await Product.findById(testProducts[1]._id);
            expect(updatedProduct1?.stock).toBe(98);
            expect(updatedProduct2?.stock).toBe(49);
        });

        it('should apply volume discount for 5+ units', async () => {
            const orderData = {
                customerId: testCustomer._id.toString(),
                products: [
                    { productId: testProducts[0]._id.toString(), quantity: 5 }
                ]
            };

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(201);

            expect(response.body.data.discountType).toBe('volume');
            expect(response.body.data.discount).toBeGreaterThan(0);
        });

        it('should prevent order when stock is insufficient', async () => {
            const orderData = {
                customerId: testCustomer._id.toString(),
                products: [
                    { productId: testProducts[0]._id.toString(), quantity: 200 }
                ]
            };

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Insufficient stock');
        });

        it('should return error for invalid customer ID', async () => {
            const orderData = {
                customerId: new mongoose.Types.ObjectId().toString(),
                products: [
                    { productId: testProducts[0]._id.toString(), quantity: 2 }
                ]
            };

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Customer not found');
        });

        it('should return validation error for missing fields', async () => {
            const response = await request(app)
                .post('/orders')
                .send({ customerId: testCustomer._id.toString() })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /orders/:id', () => {
        it('should retrieve order by ID', async () => {
            const orderData = {
                customerId: testCustomer._id.toString(),
                products: [
                    { productId: testProducts[0]._id.toString(), quantity: 2 }
                ]
            };

            const createResponse = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(201);

            const orderId = createResponse.body.data._id;

            const response = await request(app)
                .get(`/orders/${orderId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(orderId);
        });
    });
});

