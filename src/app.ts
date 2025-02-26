import 'dotenv/config';
import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRouter from './routes/authRoutes';
import associationRouter from './routes/associationRoutes';
import mappingRouter from './routes/mappingRoutes';
import definitionsRouter from './routes/definitionRoutes';
import { PORT } from './utils/utils';
// import shutdown from './utils/error';
import { specs } from '../swagger';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/install', authRouter);
app.use('/api/associations', associationRouter);
app.use('/api/associations/mappings', mappingRouter);
app.use('/api/associations/definitions', definitionsRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Move this to only run in non-test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}!`);
  });
}
export default app;
