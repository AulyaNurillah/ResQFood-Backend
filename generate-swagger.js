const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ResQFood API',
            version: '1.0.0',
            description: 'API for food surplus redistribution platform',
            contact: { name: 'ResQFood Team' }
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Chat', description: 'Chat endpoints' },
            { name: 'Notifications', description: 'Notification endpoints' },
            { name: 'Orders', description: 'Order management' },
            { name: 'Products', description: 'Product management' },
            { name: 'User', description: 'User profile and role management' }
        ],
        servers: [
            { url: 'https://res-q-food-backend.vercel.app', description: 'Production' },
            { url: 'http://localhost:3000', description: 'Local development' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js'], // membaca anotasi dari file route
};

const specs = swaggerJsdoc(options);
fs.writeFileSync(path.join(__dirname, 'swagger.json'), JSON.stringify(specs, null, 2));
console.log('Swagger spec generated successfully');