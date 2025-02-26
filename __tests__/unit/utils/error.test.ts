import handleError from '../../../src/utils/error';
import Logger from '../../../src/utils/logger';
import disconnectPrisma from '../../../prisma/disconnect';
import server from '../../../src/app';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
}));

jest.mock('../../../prisma/disconnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

// Mock server with proper close behavior
jest.mock('../../../src/app', () => ({
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
