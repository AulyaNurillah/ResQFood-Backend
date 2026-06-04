const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/swagger');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// =====================
// SWAGGER (ONLY ONE)
// =====================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha'
    }
}));

// =====================
// ROUTES
// =====================
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const passwordController = require('./src/controllers/passwordController');
const uploadController = require('./src/controllers/uploadController');
const statsController = require('./src/controllers/statsController');
const authMiddleware = require('./src/middleware/auth');


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.post('/api/auth/forgotpassword', passwordController.forgotPassword);
app.post('/api/auth/resetpassword', passwordController.resetPassword);
app.post('/api/upload/productimage', uploadController.upload, uploadController.uploadProductImage);
app.get('/api/admin/stats', authMiddleware, statsController.getPeriodicStats);





// Home
app.get('/', (req, res) => {
    res.send('ResQFood API is running');
});

module.exports = app;


// Local run
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });
}

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get periodic platform statistics (admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [daily, weekly, monthly] }
 *         description: daily, weekly, or monthly
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Statistics summary and period breakdown
 *       403:
 *         description: Admin access required
 */
app.get('/api/admin/stats', authMiddleware, statsController.getPeriodicStats);