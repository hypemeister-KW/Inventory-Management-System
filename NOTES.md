
## Assumptions & Simplifications

### What I assumed during implementation

Customer model - I went with the simplest approach: Customer only has name and location. Location is stored in the Customer entity, not fetched dynamically. This simplifies things - no need to integrate with geolocation APIs or validate addresses. In production I'd probably expand this, but for this task it's enough.

Product categories - I added a category field to Product, even though it wasn't explicitly required. Needed it for Holiday Sales discounts on specific categories. I chose 5 categories: electronics, clothing, food, books, other. In production this would probably be a separate table you could manage, but for now an enum works.

Holiday dates - I hardcoded Polish holidays for 2024. In production there'd probably be a separate service with a holiday calendar that updates yearly. But for simplicity - just an array of dates in constants.ts. Black Friday is also hardcoded to 2024-11-29.

Order status - I added a status field to Order, even though it wasn't required. I default it to 'completed' because in this system orders are finalized immediately (stock is reduced right away). In production there'd be a workflow: pending -> processing -> completed/cancelled.

CQRS simplified version - I implemented basic separation of commands/queries. No event sourcing, read models, or event bus. It's just folder separation - commands modify data, queries read it. In production I'd probably expand this, but for the task it's sufficient.

No Customer management endpoints - I didn't add CRUD for Customer because it wasn't required. In tests I create customers directly in the database. In production there'd obviously be full CRUD.

### What I intentionally omitted

Authentication and authorization - No login, tokens, roles. The API is open. In production there'd obviously be JWT/OAuth2.

Pagination and filtering - GET /products returns all products. In production there'd be pagination, sorting, filtering by category etc.

Soft delete - Product deletion is hard delete. In production there'd probably be soft delete with a deletedAt flag.

Audit log - No logging of who and when modified data. In production there'd be createdBy, updatedBy, full audit trail.

Rate limiting - No limits on endpoints. In production there'd be rate limiting to prevent abuse.

## Technical Decisions

### Database choice: MongoDB

Why MongoDB instead of lowdb? Lowdb would be simpler (JSON file), but MongoDB gives more options:
- Transactions (though they require replica set)
- Scalability
- Better query capabilities
- More schema flexibility

MongoDB also fits better with CQRS - easier to do read models, aggregates etc. In production I'd probably consider PostgreSQL for ACID transactions, but MongoDB is fine for this case.

### Project structure

```
src/
  commands/     - modifying operations (CQRS Command)
  queries/      - reading operations (CQRS Query)
  services/     - business logic (discounts, stock)
  models/       - Mongoose schemas
  routes/       - Express endpoints
  middleware/   - validators, error handler
  utils/        - constants, helpers
```

This is a standard structure for Node.js + Express. The commands/queries separation is basic CQRS implementation. In production I'd probably add:
- events/ - event handlers
- repositories/ - database abstraction layer
- dto/ - data transfer objects

### CQRS - how it works

Commands (src/commands/) - modify state:
- createProduct - creates a product
- restockProduct - increases stock
- createOrder - creates order and modifies stock

Queries (src/queries/) - only read:
- getAllProducts - returns product list
- getOrderById - returns an order

It's simple separation - commands change data, queries read it. Full CQRS would have event bus, read models, eventual consistency, but for this task it's enough.

### MongoDB transactions

The biggest challenge was with transactions. MongoDB requires replica set for transactions, and in test/development environments we often have standalone. Solution:
1. Try to use transactions
2. If it doesn't work (standalone) - fallback to atomic operations
3. findOneAndUpdate with stock >= quantity condition ensures atomicity even without transactions

It's a compromise - in production with replica set transactions work, in tests standalone the fallback works. Not ideal, but practical.

## Business Logic

### Discount system - how it works

Calculation order:
1. Calculate volume discount (based on total quantity)
2. Calculate seasonal discount (Black Friday or Holiday Sale)
3. Compare which is higher
4. Choose the higher one (discounts don't stack)
5. Apply location multiplier to subtotal
6. Subtract chosen discount (already with location multiplier)

Example:
- Subtotal: 1000 PLN
- Quantity: 50 units (30% volume discount = 300 PLN)
- Black Friday: 25% = 250 PLN
- Volume is higher, so I choose volume
- Location: Europe (multiplier 1.15)
- Location-adjusted subtotal: 1150 PLN
- Final discount: 300 * 1.15 = 345 PLN
- Total: 1150 - 345 = 805 PLN

Why location multiplier on discount? Because VAT/logistics costs also apply to the discount. If everything in Europe is 15% more expensive, the discount should also be 15% more expensive (meaning larger in absolute value).

### Stock consistency - how I prevent negative stock

Problem: Two orders simultaneously for the same product - race condition.

Solution:
1. findOneAndUpdate with stock >= quantity condition - MongoDB executes this atomically
2. If condition isn't met, findOneAndUpdate returns null
3. Then I check if product exists - if yes, it means no stock

This works even without transactions, because findOneAndUpdate is atomic at MongoDB level.

With transaction: All operations are in one transaction - if something fails, rollback.

Without transaction: Each stock operation is atomic thanks to findOneAndUpdate. There might be an edge case where two orders simultaneously pass the check, but only one executes (because of stock >= quantity condition).

### Edge cases I considered

1. Insufficient stock - check before creating order, throw error
2. Product doesn't exist - check if product exists, throw 404
3. Customer doesn't exist - check if customer exists, throw 404
4. Negative price - validation in Joi and Mongoose, doesn't allow negative price
5. Negative stock on sell - findOneAndUpdate with condition won't allow it
6. Total < 0 after discounts - Math.max(0, total) - can't be negative
7. No products in order - Joi validation requires min 1 product
8. Transactions not available - automatic fallback to atomic operations

## Testing

### What is tested and why

Unit tests:
- discountService.test.ts - I test discount logic because it's complicated math. I want to be sure volume discounts, seasonal discounts and location multipliers work correctly.
- stockService.test.ts - I test stock operations because it's critical for business logic. I need to be sure stock can't be negative.

Integration tests:
- products.test.ts - I test the full flow of product endpoints - creating, listing, restock, sell. I check that validation works, that stock updates correctly.
- orders.test.ts - I test order creation, check that stock updates, that discounts work, that it blocks on insufficient stock.

Why not more tests?
- I don't test every line of code - I focused on business logic
- I don't test error handler separately - it's tested through integration tests
- I don't test transaction edge cases - that would be complicated, and the fallback works

### What isn't tested (but should be in production)

1. Concurrent orders - I don't test if two orders simultaneously for the same product work correctly. In production there'd be load testing.
2. Transaction rollback - I don't test if rollback works correctly on errors in the middle of transaction.
3. Discount edge cases - I don't test all combinations (e.g. Black Friday + volume discount + different locations).
4. Performance - I don't test if endpoints are fast under heavy load.
5. Security - I don't test SQL injection, XSS etc. (though MongoDB is resistant to SQL injection).

In production there'd be full test coverage, load testing, security testing.

## Trade-offs & Alternatives

### 1. MongoDB transactions vs atomic operations

What I did: Hybrid approach - try transactions, fallback to atomic operations.

Alternative I considered: Only atomic operations, no transactions. Simpler, works everywhere.

Why I chose hybrid:
- In production with replica set transactions give full ACID guarantee
- In tests standalone the fallback works
- findOneAndUpdate with condition is safe enough for most cases

Downsides:
- Code is more complicated (transaction error handling)
- In edge case of two simultaneous orders there might be race condition (though very unlikely)

If I had more time: I'd use PostgreSQL instead of MongoDB - better transactions, ACID out of the box, no need for replica set.

### 2. CQRS - simple implementation vs full CQRS

What I did: Basic commands/queries separation, no event sourcing.

Alternative I considered: Full CQRS with event bus, read models, eventual consistency.

Why I chose simple version:
- Task didn't require full CQRS
- Simpler code = easier to maintain
- For this use case it's enough

Downsides:
- No event sourcing = harder to debug, no change history
- No read models = queries might be slower at scale
- No ability to replay events

If I had more time: I'd add event bus (e.g. RabbitMQ), read models for fast queries, event store for audit trail.

### 3. Validation - Joi vs express-validator

What I did: Joi - because I know it, like the syntax, easy to read.

Alternative: express-validator - more Express way, fewer dependencies.

Why Joi:
- More declarative syntax
- Easier to test (can test schemas separately)
- Better error messages out of the box

Downsides:
- Additional dependency (though light)
- Not native for Express

If I had more time: I'd probably stick with Joi, but could add custom validators for more complicated cases (e.g. validating that customer exists).

---

Summary: The project meets all requirements. Technical choices are practical - not over-engineered, but not too simple either. In production I'd probably expand some things (transactions, CQRS, tests), but for the task it's sufficient.
