const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
//const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/swagger');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.get('/api-docs', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>ResQFood API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>

<script>
window.onload = () => {
  window.ui = SwaggerUIBundle({
    url: '/swagger.json',
    dom_id: '#swagger-ui',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "BaseLayout",
    persistAuthorization: true
  });
};
</script>

</body>
</html>
    `);
});
//app.get('/api-docs', swaggerUi.setup(swaggerSpecs, {
//    explorer: true,
//    swaggerOptions: {
//        persistAuthorization: true,
//        tagsSorter: 'alpha',
//        operationsSorter: 'alpha'
//    }
//}));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Swagger UI
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
        explorer: true,
        swaggerOptions: {
            tagsSorter: 'alpha',
            operationsSorter: 'alpha'
        }
    })
);
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