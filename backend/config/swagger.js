const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FizzTask API',
      version: '1.0.0',
      description: 'API documentation for FizzTask - AI-powered productivity platform',
      contact: {
        name: 'FizzTask Support',
        email: 'support@fizztask.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.fizztask.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './models/*.js'], // Path to the API routes and models
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;