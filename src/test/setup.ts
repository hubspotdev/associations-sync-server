import {
  jest, afterAll, afterEach, beforeAll,
} from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Add any global setup here
});

// Global test teardown
afterAll(async () => {
  // Add any global teardown here
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
