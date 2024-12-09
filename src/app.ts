import 'dotenv/config';
import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/authRoutes';
import associationRouter from './routes/associationRoutes';
import mappingRouter from './routes/mappingRoutes';
import definitionsRouter from './routes/definitionRoutes';
import { PORT } from './utils/utils';
// import shutdown from './utils/error';
import { specs } from '../swagger';

// const readline = require('readline');
// const { exec } = require('child_process');

// const industries = [
//   'REAL_ESTATE',
//   'HEALTHCARE',
//   'EDUCATION',
//   'RETAIL',
//   // Add all your industry options here
// ];
// const prisma = new PrismaClient({
//   log: ['info', 'warn', 'error'],
// });

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// console.log('Available industries:');
// industries.forEach((industry, index) => {
//   console.log(`${index + 1}. ${industry}`);
// });

// rl.question('\nSelect an industry number: ', (answer:any) => {
//   const selection = parseInt(answer) - 1;

//   if (selection >= 0 && selection < industries.length) {
//     const selectedIndustry = industries[selection];
//     process.env.INDUSTRY = selectedIndustry;
//     console.log(`\nSetting INDUSTRY=${selectedIndustry}`);

//     rl.close();

//     // Write to .env file or set environment variable
//     require('fs').writeFileSync('.env', `INDUSTRY=${selectedIndustry}\n`, { flag: 'w' });
//   } else {
//     console.error('Invalid selection');
//     process.exit(1);
//   }
// });

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/install', authRouter);
app.use('/api/associations', associationRouter);
app.use('/api/associations/mappings', mappingRouter);
app.use('/api/associations/definitions', definitionsRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const server = app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}!`);
});
// process.on('SIGTERM', () => {
//   console.info('SIGTERM signal received.');
//   shutdown();
// });

export default server;
