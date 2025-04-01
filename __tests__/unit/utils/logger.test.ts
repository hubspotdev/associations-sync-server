import Logger from '../../../src/utils/logger';
import { LogObject } from '../../../types/common';

describe('Logger', () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('should log info messages correctly', () => {
    const logObject: LogObject = {
      type: 'Test',
      context: 'Test Context',
      logMessage: 'Test message',
    };

    Logger.info(logObject);

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Test Info'));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Test Context'));
  });

  it('should log error messages with stack traces', () => {
    const error = new Error('Test error');
    const logObject: LogObject = {
      type: 'Test',
      context: 'Test Context',
      logMessage: error,
    };

    Logger.error(logObject);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Stack:'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(error.stack!));
  });
});
