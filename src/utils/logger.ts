import { LogObject } from '../../types/common';

type Level = 'Info' | 'Warning' | 'Error';
class Logger {
  private static log(message: LogObject, level: Level): void {
    const timestamp = new Date().toISOString();
    const logOutput = Logger.formatLogMessage(message, timestamp);

    switch (level) {
      case 'Error':
        console.error(logOutput);
        break;
      case 'Warning':
        console.warn(logOutput);
        break;
      case 'Info':
      default:
        console.info(logOutput);
        break;
    }
  }

  private static formatLogMessage(logObject: LogObject, timestamp: string): string {
    const {
      type = 'Unknown', context, logMessage, level,
    } = logObject;
    const {
      code, statusCode, correlationId, details, data, stack, message,
    } = logMessage;

    const outputLines: string[] = [
      `${type} ${level} at ${timestamp}`,
    ];

    if (context) outputLines.push(`Context: ${context}`);
    if (message && !stack) outputLines.push(`Message: ${message}`);
    if (stack) outputLines.push(`Stack: ${stack}`);
    if (code) outputLines.push(`Code: ${code}`);
    if (statusCode) outputLines.push(`StatusCode: ${statusCode}`);
    if (correlationId) outputLines.push(`Correlation ID: ${correlationId}`);
    if (details && details.length > 0) outputLines.push(`Details: ${JSON.stringify(details, null, 2)}`);
    if (data) outputLines.push(`Data: ${JSON.stringify(data, null, 2)}`);

    return outputLines.join('\n');
  }

  public static info(message: LogObject): void {
    const level = 'Info';
    Logger.log(message, level);
  }

  public static warn(message: LogObject): void {
    const level = 'Warning';
    Logger.log(message, level);
  }

  public static error(message: LogObject): void {
    const level = 'Error';
    Logger.log(message, level);
  }
}

export default Logger;
