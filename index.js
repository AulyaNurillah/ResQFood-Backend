const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');

// ========== SWAGGER ==========
// Baca file swagger.json yang sudah digenerate (oleh generate-swagger.js)
let swaggerSpec = null;
try {
    const swaggerPath = path.join(__dirname, 'swagger.json');
    if (fs.existsSync(swaggerPath)) {
        swaggerSpec = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
        console.log('Swagger spec loaded from file');
    } else {
        console.warn('Swagger.json not found, Swagger UI will be empty');
    }
} catch (err) {
    console.error('Error loading swagger.json:', err.message);
}

// Sajikan Swagger UI dengan spec langsung (bukan via url)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Endpoint alternatif untuk mengakses raw swagger.json (jika diperlukan)
app.get('/api-docs/swagger.json', (req, res) => {
    if (swaggerSpec) {
        res.json(swaggerSpec);
    } else {
        res.status(404).json({ error: 'swagger.json not found' });
    }
});

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

module.exports = app;

// Run locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
    });
}