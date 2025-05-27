/**
 * Application Logger
 * 
 * Centralized logging utility with consistent formatting and environment-aware
 * log levels. Use this instead of direct console.log calls for better control
 * over logging behavior across environments.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  timestamp?: boolean;
  includeContext?: boolean;
  context?: string;
}

const defaultOptions: LogOptions = {
  timestamp: true,
  includeContext: true,
  context: 'APP'
};

/**
 * Determine if logging is enabled for the current environment and level
 */
function shouldLog(level: LogLevel): boolean {
  // In production, only log warnings and errors
  if (process.env.NODE_ENV === 'production') {
    return level === 'warn' || level === 'error';
  }
  
  // In development and test, log everything
  return true;
}

/**
 * Format a log message with timestamp and context if enabled
 */
function formatMessage(message: string, options: LogOptions): string {
  const parts: string[] = [];
  
  if (options.timestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  if (options.includeContext && options.context) {
    parts.push(`[${options.context}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Debug level log - only shown in development
 */
export function debug(message: string, context?: string): void {
  if (!shouldLog('debug')) return;
  
  console.debug(formatMessage(message, {
    ...defaultOptions,
    context: context || defaultOptions.context
  }));
}

/**
 * Info level log - shown in development
 */
export function info(message: string, context?: string): void {
  if (!shouldLog('info')) return;
  
  console.log(formatMessage(message, {
    ...defaultOptions,
    context: context || defaultOptions.context
  }));
}

/**
 * Warning level log - shown in all environments
 */
export function warn(message: string, error?: any, context?: string): void {
  if (!shouldLog('warn')) return;
  
  console.warn(formatMessage(message, {
    ...defaultOptions,
    context: context || defaultOptions.context
  }));
  
  if (error) {
    console.warn(error);
  }
}

/**
 * Error level log - shown in all environments
 */
export function error(message: string, error?: any, context?: string): void {
  if (!shouldLog('error')) return;
  
  console.error(formatMessage(message, {
    ...defaultOptions,
    context: context || defaultOptions.context
  }));
  
  if (error) {
    console.error(error);
  }
}

/**
 * Shorthand logger functions
 */
export const logger = {
  debug,
  info,
  warn,
  error
};

export default logger; 