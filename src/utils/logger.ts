/**
 * Centralized logging utility for AudioWeb
 * Provides consistent logging with levels and formatting
 */

import { DEBUG_LOGGING, LOG_LEVELS } from '@/config/constants';

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

/**
 * Logger class for structured logging
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (DEBUG_LOGGING) {
      this.log('debug', message, ...args);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'debug':
        console.log(prefix, message, ...args);
        break;
    }
  }

  /**
   * Log the start of an operation
   */
  start(operation: string): void {
    this.debug(`Starting: ${operation}`);
  }

  /**
   * Log the completion of an operation
   */
  complete(operation: string, duration?: number): void {
    if (duration !== undefined) {
      this.debug(`Completed: ${operation} (${duration}ms)`);
    } else {
      this.debug(`Completed: ${operation}`);
    }
  }

  /**
   * Log a performance metric
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.debug(`Performance - ${metric}: ${value}${unit}`);
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = new Logger('AudioWeb');
