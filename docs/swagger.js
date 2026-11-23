import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesGlob = path.join(__dirname, '../routes/*.js').replace(/\\/g, '/');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Uttar Siri API',
      version: '2.1.0',
      description:
        'Uttar Siri grocery platform API — auth/RBAC/CMS plus catalogue, variants, inventory and multilingual support (en / kn / hi).',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error_code: { type: 'string' },
          },
        },
      },
    },
    servers: [
      { url: 'http://localhost:5004', description: 'Local server' },
    ],
  },
  apis: [routesGlob],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
