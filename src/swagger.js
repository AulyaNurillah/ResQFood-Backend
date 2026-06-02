const swaggerJsdoc = require('swagger-jsdoc');

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
            { url: 'http://localhost:3000', description: 'Local development' },
            { url: 'https://your-vercel-url.vercel.app', description: 'Production' }
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
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);