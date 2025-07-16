/**
 * MJOS Logger Factory
 * 魔剑工作室操作系统日志工�? */

import winston, { Logger, format, transports } from 'winston';
import { LoggingConfig } from './types/index';

/**
 * 日志工厂�? */
export class LoggerFactory {
  private static loggers = new Map<string, Logger>();

  /**
   * 创建日志�?   */
  public static createLogger(config: LoggingConfig, name = 'MJOS'): Logger {
    const loggerKey = `${name}-${config.level}-${config.format}`;
    
    if (LoggerFactory.loggers.has(loggerKey)) {
      return LoggerFactory.loggers.get(loggerKey)!;
    }

    const logger = winston.createLogger({
      level: config.level,
      format: LoggerFactory.createFormat(config),
      transports: LoggerFactory.createTransports(config),
      exitOnError: false
    });

    LoggerFactory.loggers.set(loggerKey, logger);
    return logger;
  }

  /**
   * 创建日志格式
   */
  private static createFormat(config: LoggingConfig) {
    const formats = [
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true })
    ];

    if (config.format === 'json') {
      formats.push(format.json());
    } else {
      formats.push(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          let log = `${timestamp} [${level}] ${message}`;
          
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          
          return log;
        })
      );
    }

    return format.combine(...formats);
  }

  /**
   * 创建传输�?   */
  private static createTransports(config: LoggingConfig) {
    const transportList: winston.transport[] = [];

    // 控制台输�?    if (config.outputs.includes('console')) {
      transportList.push(
        new transports.Console({
          handleExceptions: true,
          handleRejections: true
        })
      );
    }

    // 文件输出
    if (config.outputs.includes('file') && config.file) {
      transportList.push(
        new transports.File({
          filename: config.file.path,
          maxsize: LoggerFactory.parseSize(config.file.maxSize),
          maxFiles: config.file.maxFiles,
          handleExceptions: true,
          handleRejections: true
        })
      );
    }

    return transportList;
  }

  /**
   * 解析文件大小
   */
  private static parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }

    const [, size, unit] = match;
    return parseInt(size, 10) * units[unit.toUpperCase()];
  }

  /**
   * 获取现有日志�?   */
  public static getLogger(name: string): Logger | undefined {
    for (const [key, logger] of LoggerFactory.loggers) {
      if (key.startsWith(name)) {
        return logger;
      }
    }
    return undefined;
  }

  /**
   * 清理所有日志器
   */
  public static cleanup(): void {
    for (const logger of LoggerFactory.loggers.values()) {
      logger.close();
    }
    LoggerFactory.loggers.clear();
  }
}
