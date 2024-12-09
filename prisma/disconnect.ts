import prismaSeed from '../src/prisma-client/prisma-initalization';

async function disconnectPrisma(): Promise<void> {
  try {
    console.log('Disconnecting from the database...');
    await prismaSeed.$disconnect();
    console.log('Disconnected from the database successfully.');
  } catch (error: unknown) {
    console.error('Error while disconnecting from the database:', error);
    throw error;
  }
}

export default disconnectPrisma
