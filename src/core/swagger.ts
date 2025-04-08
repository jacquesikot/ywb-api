import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your Work Buddy API Documentation',
      version,
      description: 'API documentation for Your Work Buddy server',
      license: {
        name: 'ISC',
      },
      contact: {
        name: 'Your Work Buddy Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
      {
        url: 'https://ywb-api.onrender.com',
        description: 'Release server',
      },
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key required for all endpoints',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization token',
        },
      },
      parameters: {
        ApiKeyHeader: {
          in: 'header',
          name: 'x-api-key',
          schema: {
            type: 'string',
            default: 'your-default-api-key-value',
          },
          required: true,
          description: 'API key for authentication',
        },
      },
    },
    // Comment out or remove the global security requirement
    security: [
      {
        apiKey: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/database/model/*.ts',
  ],
};

export const specs = swaggerJsdoc(options);
