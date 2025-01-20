import Logger from './logger';
import { LogObject } from '../../types/common';
import disconnectPrisma from '../../prisma/disconnect';
import server from '../app';

async function shutdown(): Promise<void> {
  try {
    console.log('Initiating graceful shutdown...');
    const closeServerPromise = new Promise<void>((resolve, reject) => {
      if (!server.listen) {
        resolve();
        return;
      }

      const httpServer = server.listen();
      httpServer.close((err: unknown) => {
        console.log('Server close callback called.');
        if (err) {
          console.error('Error closing the server:', err);
          reject(err);
        } else {
          resolve();
        }
      });

      // Set a timeout in case the server does not close within a reasonable time
      setTimeout(() => {
        console.warn('Forcing server shutdown after timeout.');
        resolve();
      }, 5000);
    });

    await Promise.all([
      closeServerPromise.then(() => {
        console.log('HTTP server closed successfully.');
      }).catch((err) => {
        console.error('Error during server close:', err);
      }),
      disconnectPrisma().catch((err) => console.error('Error during Prisma disconnection:', err)),
    ]);

    console.log('Graceful shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

function isHubSpotApiError(error: any) {
  return Boolean(error?.message?.includes('hubapi'));
}
function isGeneralPrismaError(error: any): boolean {
  return error?.stack?.includes('@prisma/client') || error?.message?.includes('prisma');
}

function formatError(logMessage: any, context: string = ''): any {
  const error: LogObject = { logMessage, context };
  if (context) error.context = context;
  if (isGeneralPrismaError(error)) {
    error.type = 'Prisma';
  } else if (isHubSpotApiError(error)) {
    error.type = 'Hubspot API';
  } else if (logMessage instanceof Error) {
    error.type = 'General';
  } else {
    error.type = 'Non-error object was thrown';
  }
  return error;
}

function handleError(error: unknown, context: string = '', critical: boolean = false): void {
  const formattedError = formatError(error, context);
  Logger.error(formattedError);

  if (critical) shutdown();
}

export default handleError;
