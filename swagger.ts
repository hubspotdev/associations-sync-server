import swaggerJsdoc from 'swagger-jsdoc';
import { associationSchemas, associationPaths } from './src/swagger/associationDocs';
import { definitionSchemas, definitionPaths } from './src/swagger/definitionDocs';
import { mappingSchemas, mappingPaths } from './src/swagger/mappingDocs';
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Associations API',
      version: '1.0.0',
      description: 'API documentation for Associations service',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        ...associationSchemas,
        ...definitionSchemas,
        ...mappingSchemas,
      },
    },
    paths: {
      ...associationPaths,
      ...definitionPaths,
      ...mappingPaths,
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const specs = swaggerJsdoc(options);
