import handleError from '../../../utils/error';
import Logger from '../../../utils/logger';
import disconnectPrisma from '../../../../prisma/disconnect';
import server from '../../../app';

// Mock dependencies
jest.mock('../../../utils/logger');
jest.mock('../../../../prisma/disconnect');
jest.mock('../../../app', () => ({
  listen: jest.fn(() => ({
    close: jest.fn((callback) => callback()),
  })),
}));

describe('Error Handling Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should log Prisma errors correctly', () => {
      const prismaError = new Error('Prisma error');
      prismaError.stack = '@prisma/client error stack';

      handleError(prismaError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith(expect.objectContaining({
        type: 'Prisma',
        context: 'Test context',
        logMessage: prismaError,
      }));
    });

    it('should log HubSpot API errors correctly', () => {
      const hubspotError = new Error('hubapi error');

      handleError(hubspotError, 'Test context');

      expect(Logger.error).toHaveBeenCalledWith(expect.objectContaining({
        type: 'Hubspot API',
        context: 'Test context',
        logMessage: hubspotError,
      }));
    });

    it('should handle critical errors and initiate shutdown', async () => {
      const criticalError = new Error('Critical error');

      handleError(criticalError, 'Test context', true);

      expect(Logger.error).toHaveBeenCalled();
      expect(server.listen).toHaveBeenCalled();
      expect(disconnectPrisma).toHaveBeenCalled();
    });
  });
});
