import prismaSeed from '../src/prisma-client/prisma-initialization';
import Logger from '../src/utils/logger';

async function disconnectPrisma(): Promise<void> {
  try {
    Logger.info({
      type: 'Database',
      context: 'Disconnection',
      logMessage: { message: 'Disconnecting from the database...' }
    });
    await prismaSeed.$disconnect();
    Logger.info({
      type: 'Database',
      context: 'Disconnection',
      logMessage: { message: 'Disconnected from the database successfully.' }
    });
  } catch (error: unknown) {
    Logger.error({
      type: 'Database',
      context: 'Disconnection',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }
}

export default disconnectPrisma
