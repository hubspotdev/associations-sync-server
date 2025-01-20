import handleError from '../../../utils/error';
import Logger from '../../../utils/logger';
import disconnectPrisma from '../../../../prisma/disconnect';
import server from '../../../app';
import { LogObject } from '../../../types/common';

// Mock dependencies
jest.mock('../../../utils/logger', () => ({
  error: jest.fn(),
}));

jest.mock('../../../../prisma/disconnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

// Mock server with proper close behavior
jest.mock('../../../app', () => ({
  __esModule: true,
  default: {
    listen: jest.fn(() => ({
      close: jest.fn((callback) => callback()),
    })),
  },
}));

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('Error Handling Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log Prisma errors correctly when stack trace is present', () => {
      // Create PrismaClientKnownRequestError
      const prismaError = Object.create(Error.prototype, {
        name: {
          value: 'PrismaClientKnownRequestError',
          enumerable: true,
        },
        message: {
          value: 'Database error',
          enumerable: true,
        },
        code: {
          value: 'P2002',
          enumerable: true,
        },
        clientVersion: {
          value: '5.0.0',
          enumerable: true,
        },
        meta: {
          value: { target: ['email'] },
          enumerable: true,
        },
        stack: {
          value: 'Error: Database error\n    at PrismaClient._executeRequest (/node_modules/@prisma/client/runtime/library.js:123:45)',
          enumerable: true,
        },
      });

      handleError(prismaError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith({
        type: 'Prisma',
        context: 'Test context',
        logMessage: prismaError,
      });
    });

    it('should log Prisma errors correctly when message contains prisma', () => {
      // Create an error with a message that includes 'prisma'
      const prismaError = Object.create(Error.prototype, {
        message: {
          value: 'PRISMA Client Error: Invalid data',
          enumerable: true,
        },
      });

      handleError(prismaError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith({
        type: 'Prisma',
        context: 'Test context',
        logMessage: prismaError,
      });
    });

    it('should log HubSpot API errors correctly', () => {
      const hubspotError = Object.create(Error.prototype, {
        name: {
          value: 'HubspotError',
          enumerable: true,
        },
        message: {
          value: 'Failed to fetch from hubapi endpoint',
          enumerable: true,
        },
        stack: {
          value: 'Error: Failed to fetch from hubapi endpoint',
          enumerable: true,
        },
      });

      handleError(hubspotError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith({
        type: 'Hubspot API',
        context: 'Test context',
        logMessage: hubspotError,
      });
    });

    it('should handle general errors', () => {
      const generalError = new Error('General error');

      handleError(generalError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith({
        type: 'General',
        context: 'Test context',
        logMessage: generalError,
      });
    });

    it('should handle non-error objects', () => {
      const nonError = {
        message: 'not an error',
        code: 'CUSTOM_ERROR',
        statusCode: 400,
        details: ['detail1', 'detail2'],
        data: { foo: 'bar' },
      };

      handleError(nonError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith({
        type: 'Non-error object was thrown',
        context: 'Test context',
        logMessage: nonError,
      });
    });

    it('should log Prisma errors with proper formatting', () => {
      const prismaError = Object.create(Error.prototype, {
        name: {
          value: 'PrismaClientKnownRequestError',
          enumerable: true,
        },
        message: {
          value: 'Unique constraint failed on the fields: (`email`)',
          enumerable: true,
        },
        code: {
          value: 'P2002',
          enumerable: true,
        },
        clientVersion: {
          value: '5.0.0',
          enumerable: true,
        },
        meta: {
          value: { target: ['email'] },
          enumerable: true,
        },
        stack: {
          value: 'Error: Unique constraint failed\n    at PrismaClient._executeRequest (/node_modules/@prisma/client/runtime/library.js:123:45)',
          enumerable: true,
        },
      });

      handleError(prismaError, 'Test context');

      // Verify Logger.error was called with correct object
      expect(Logger.error).toHaveBeenCalledWith({
        type: 'Prisma',
        context: 'Test context',
        logMessage: prismaError,
      });

      // Verify console output format
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Prisma Error at'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context: Test context'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Code: P2002'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack: Error: Unique constraint failed'),
      );
    });

    it('should handle critical errors with proper shutdown sequence', async () => {
      const criticalError = new Error('Critical error');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      handleError(criticalError, 'Test context', true);

      // Verify shutdown sequence
      expect(consoleSpy).toHaveBeenCalledWith('Initiating graceful shutdown...');
      expect(server.listen).toHaveBeenCalled();
      expect(disconnectPrisma).toHaveBeenCalled();

      // Wait for shutdown to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleSpy).toHaveBeenCalledWith('Graceful shutdown complete.');
    });
  });
});
