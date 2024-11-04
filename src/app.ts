import 'dotenv/config';
import express, { Application } from 'express';
import authRouter from './routes/authRoutes';
import associationRouter from './routes/associationRoutes';
import mappingRouter from './routes/mappingRoutes';
import { PORT } from './utils/utils';
import shutdown from './utils/shutdown';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/install', authRouter);
app.use('/api/associations', associationRouter);
app.use('/api/associations/mapping', mappingRouter);

const server = app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}!`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  shutdown();
});

export default server;
