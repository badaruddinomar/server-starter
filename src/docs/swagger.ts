import swaggerAutogen from 'swagger-autogen';
import path from 'path';
const doc = {
  info: {
    title: 'Server Starter API',
    description: 'API documentation',
  },
  host: 'localhost:4000',
  schemes: ['http'],
};

const outputFile = path.resolve(__dirname, '../docs/swagger-output.json');
const endpointsFiles = ['../app.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
