const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
//const swaggerSpecs = require('./src/swagger');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Swagger UI
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
// Swagger UI dengan file statis swagger.json
//const swaggerUi = require('swagger-ui-express');

// Endpoint untuk menyajikan swagger.json
app.get('/api-docs/swagger.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'swagger.json'));
});

// Swagger UI mengarah ke endpoint swagger.json
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
    swaggerUrl: '/api-docs/swagger.json',
    explorer: true
}));

// Home
app.get('/', (req, res) => {
    res.send('ResQFood API is running');
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Export for Vercel
module.exports = app;

// Run locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });
}