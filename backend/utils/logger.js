/**
 * Logger utility that respects environment settings
 * In production, only error and warn logs are shown
 */

const { isEnabled } = require('../config/features');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.WARN 
  : LOG_LEVELS.DEBUG;

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _shouldLog(level) {
    return level <= currentLevel;
  }

  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = this.context ? `[${this.context}]` : '';
    return { timestamp, level, prefix, message, args };
  }

  error(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      const formatted = this._formatMessage('ERROR', message, ...args);
      console.error(`${formatted.timestamp} ERROR ${formatted.prefix}`, formatted.message, ...formatted.args);
    }
  }

  warn(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
      const formatted = this._formatMessage('WARN', message, ...args);
      console.warn(`${formatted.timestamp} WARN ${formatted.prefix}`, formatted.message, ...formatted.args);
    }
  }

  info(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      const formatted = this._formatMessage('INFO', message, ...args);
      console.info(`${formatted.timestamp} INFO ${formatted.prefix}`, formatted.message, ...formatted.args);
    }
  }

  debug(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.DEBUG) || isEnabled('enableDebugLogging')) {
      const formatted = this._formatMessage('DEBUG', message, ...args);
      console.log(`${formatted.timestamp} DEBUG ${formatted.prefix}`, formatted.message, ...formatted.args);
    }
  }

  // Convenience method for logging that only shows in development
  dev(message, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      this.debug(message, ...args);
    }
  }
}

// Factory function to create logger instances
function createLogger(context) {
  return new Logger(context);
}

// Default logger instance
const defaultLogger = new Logger();

module.exports = {
  createLogger,
  logger: defaultLogger
};