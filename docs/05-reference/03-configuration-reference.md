# MJOS 配置参考

> **最后更新时间**: 2025-07-17 09:49:00 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的系统配置参考文档

## 📋 概述

本文档详细说明MJOS系统的所有配置选项，包括核心配置、模块配置、环境配置和高级配置。

## 📁 配置文件结构

### 配置文件位置
```
mjos/
├── config/
│   ├── default.json          # 默认配置
│   ├── development.json      # 开发环境配置
│   ├── production.json       # 生产环境配置
│   ├── test.json            # 测试环境配置
│   └── local.json           # 本地覆盖配置
├── .env                     # 环境变量
├── .env.development         # 开发环境变量
├── .env.production          # 生产环境变量
└── mjos.config.js           # 主配置文件
```

### 配置优先级
1. 命令行参数 (最高优先级)
2. 环境变量
3. local.json
4. 环境特定配置 (development.json, production.json等)
5. default.json (最低优先级)

## 🔧 核心配置

### 基本配置 (mjos.config.js)
```javascript
module.exports = {
  // 应用基本信息
  app: {
    name: 'MJOS',
    version: '2.0.0',
    description: '魔剑工作室操作系统',
    author: 'MJOS Team'
  },

  // 服务器配置
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3000,
    protocol: 'http',
    cors: {
      enabled: true,
      origin: ['http://localhost:3000', 'https://mjos.com'],
      credentials: true
    },
    compression: {
      enabled: true,
      level: 6
    },
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000 // 每个IP最多1000次请求
    }
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    file: {
      enabled: true,
      path: './logs/mjos.log',
      maxSize: '100MB',
      maxFiles: 10,
      datePattern: 'YYYY-MM-DD'
    },
    console: {
      enabled: true,
      colorize: true,
      timestamp: true
    }
  },

  // 数据库配置
  database: {
    // PostgreSQL主数据库
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'mjos',
      username: process.env.DB_USER || 'mjos_user',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true',
      pool: {
        min: 5,
        max: 20,
        acquire: 30000,
        idle: 10000
      },
      logging: false
    },

    // Redis缓存
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
      keyPrefix: 'mjos:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    }
  },

  // 安全配置
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '24h',
      issuer: 'mjos',
      audience: 'mjos-users'
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      key: process.env.ENCRYPTION_KEY || 'your-encryption-key'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24小时
      }
    }
  }
};
```

## 🧠 模块配置

### 记忆系统配置
```json
{
  "memory": {
    "enabled": true,
    "storage": {
      "provider": "hybrid",
      "shortTerm": {
        "type": "memory",
        "maxSize": 1000,
        "ttl": 3600
      },
      "longTerm": {
        "type": "database",
        "compression": true,
        "indexing": true
      }
    },
    "processing": {
      "autoIndex": true,
      "batchSize": 100,
      "processingInterval": 5000
    },
    "retention": {
      "defaultTtl": 2592000,
      "maxRetention": 31536000,
      "cleanupInterval": 86400
    },
    "search": {
      "engine": "elasticsearch",
      "indexName": "mjos-memories",
      "similarity": {
        "algorithm": "cosine",
        "threshold": 0.7
      }
    }
  }
}
```

### 知识图谱配置
```json
{
  "knowledge": {
    "enabled": true,
    "graph": {
      "type": "neo4j",
      "uri": "bolt://localhost:7687",
      "username": "neo4j",
      "password": "password",
      "database": "mjos"
    },
    "indexing": {
      "enabled": true,
      "batchSize": 1000,
      "updateInterval": 10000
    },
    "reasoning": {
      "enabled": true,
      "engines": ["deductive", "inductive", "abductive"],
      "maxDepth": 5,
      "timeout": 30000
    },
    "validation": {
      "enabled": true,
      "strictMode": false,
      "conflictResolution": "latest"
    }
  }
}
```

### 智能体配置
```json
{
  "agents": {
    "enabled": true,
    "defaults": {
      "type": "reactive",
      "maxConcurrentTasks": 3,
      "memoryLimit": 1000,
      "timeout": 300000
    },
    "lifecycle": {
      "autoStart": true,
      "healthCheckInterval": 30000,
      "maxRestarts": 3,
      "gracefulShutdownTimeout": 10000
    },
    "communication": {
      "protocol": "websocket",
      "messageQueue": {
        "maxSize": 1000,
        "persistence": true
      },
      "encryption": true
    },
    "capabilities": {
      "registry": {
        "autoDiscovery": true,
        "validation": true
      },
      "execution": {
        "sandbox": true,
        "timeout": 60000,
        "retries": 3
      }
    }
  }
}
```

### 团队协作配置
```json
{
  "team": {
    "enabled": true,
    "collaboration": {
      "mode": "distributed",
      "coordination": "consensus",
      "conflictResolution": "voting"
    },
    "communication": {
      "channels": ["direct", "broadcast", "multicast"],
      "messageRetention": 86400,
      "encryption": true
    },
    "workflow": {
      "engine": "bpmn",
      "autoAssignment": true,
      "loadBalancing": true,
      "priorityScheduling": true
    },
    "monitoring": {
      "enabled": true,
      "metrics": ["performance", "collaboration", "efficiency"],
      "reporting": {
        "interval": 3600,
        "format": "json"
      }
    }
  }
}
```

## 🔒 安全配置

### 认证和授权
```json
{
  "auth": {
    "providers": {
      "local": {
        "enabled": true,
        "passwordPolicy": {
          "minLength": 8,
          "requireUppercase": true,
          "requireLowercase": true,
          "requireNumbers": true,
          "requireSymbols": true
        }
      },
      "oauth": {
        "enabled": true,
        "providers": ["google", "github", "microsoft"],
        "google": {
          "clientId": "your-google-client-id",
          "clientSecret": "your-google-client-secret",
          "scope": ["profile", "email"]
        }
      },
      "ldap": {
        "enabled": false,
        "url": "ldap://localhost:389",
        "bindDN": "cn=admin,dc=example,dc=com",
        "bindCredentials": "admin",
        "searchBase": "ou=users,dc=example,dc=com"
      }
    },
    "session": {
      "strategy": "jwt",
      "refreshTokens": true,
      "multipleDevices": true
    },
    "permissions": {
      "rbac": {
        "enabled": true,
        "defaultRole": "user",
        "inheritance": true
      },
      "acl": {
        "enabled": true,
        "granularity": "resource"
      }
    }
  }
}
```

### 加密和安全
```json
{
  "encryption": {
    "atRest": {
      "enabled": true,
      "algorithm": "aes-256-gcm",
      "keyRotation": {
        "enabled": true,
        "interval": 2592000
      }
    },
    "inTransit": {
      "tls": {
        "enabled": true,
        "version": "1.3",
        "ciphers": ["ECDHE-RSA-AES256-GCM-SHA384"]
      }
    },
    "keys": {
      "storage": "vault",
      "provider": "hashicorp",
      "autoRotation": true
    }
  },
  "audit": {
    "enabled": true,
    "events": ["auth", "data-access", "admin-actions"],
    "storage": {
      "type": "database",
      "retention": 2592000
    },
    "alerting": {
      "enabled": true,
      "rules": ["failed-logins", "privilege-escalation"]
    }
  }
}
```

## 📊 监控配置

### 性能监控
```json
{
  "monitoring": {
    "enabled": true,
    "metrics": {
      "collection": {
        "interval": 10000,
        "retention": 604800
      },
      "exporters": {
        "prometheus": {
          "enabled": true,
          "port": 9090,
          "path": "/metrics"
        },
        "influxdb": {
          "enabled": false,
          "url": "http://localhost:8086",
          "database": "mjos_metrics"
        }
      }
    },
    "health": {
      "checks": {
        "database": true,
        "redis": true,
        "memory": true,
        "disk": true
      },
      "endpoint": "/health",
      "timeout": 5000
    },
    "alerting": {
      "enabled": true,
      "channels": ["email", "slack", "webhook"],
      "rules": {
        "highMemoryUsage": {
          "threshold": 0.8,
          "duration": 300
        },
        "highResponseTime": {
          "threshold": 1000,
          "duration": 60
        }
      }
    }
  }
}
```

### 日志配置
```json
{
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": {
      "console": {
        "enabled": true,
        "level": "debug",
        "colorize": true
      },
      "file": {
        "enabled": true,
        "level": "info",
        "path": "./logs/mjos.log",
        "rotation": {
          "maxSize": "100MB",
          "maxFiles": 10,
          "datePattern": "YYYY-MM-DD"
        }
      },
      "elasticsearch": {
        "enabled": false,
        "level": "warn",
        "index": "mjos-logs",
        "host": "localhost:9200"
      }
    },
    "structured": {
      "enabled": true,
      "fields": ["timestamp", "level", "message", "module", "requestId"]
    },
    "sampling": {
      "enabled": false,
      "rate": 0.1
    }
  }
}
```

## 🚀 性能配置

### 缓存配置
```json
{
  "cache": {
    "layers": {
      "l1": {
        "type": "memory",
        "maxSize": "100MB",
        "ttl": 300
      },
      "l2": {
        "type": "redis",
        "ttl": 3600,
        "compression": true
      }
    },
    "strategies": {
      "memory": "lru",
      "invalidation": "ttl",
      "warming": {
        "enabled": true,
        "schedule": "0 */6 * * *"
      }
    }
  }
}
```

### 并发配置
```json
{
  "concurrency": {
    "workers": {
      "count": "auto",
      "maxMemory": "1GB",
      "gracefulShutdown": 10000
    },
    "queues": {
      "default": {
        "concurrency": 10,
        "retries": 3,
        "backoff": "exponential"
      },
      "priority": {
        "concurrency": 5,
        "retries": 5
      }
    },
    "rateLimiting": {
      "global": {
        "requests": 1000,
        "window": 60000
      },
      "perUser": {
        "requests": 100,
        "window": 60000
      }
    }
  }
}
```

## 🌍 环境配置

### 开发环境 (.env.development)
```bash
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=mjos:*

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mjos_dev
DB_USER=mjos_dev
DB_PASSWORD=dev_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 安全
JWT_SECRET=dev-jwt-secret
ENCRYPTION_KEY=dev-encryption-key-32-characters
SESSION_SECRET=dev-session-secret

# 功能开关
ENABLE_HOT_RELOAD=true
ENABLE_DEBUG_ROUTES=true
ENABLE_MOCK_DATA=true
```

### 生产环境 (.env.production)
```bash
NODE_ENV=production
LOG_LEVEL=warn

# 数据库
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=mjos_prod
DB_USER=mjos_prod
DB_PASSWORD=secure_prod_password
DB_SSL=true

# Redis
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# 安全
JWT_SECRET=super-secure-jwt-secret-for-production
ENCRYPTION_KEY=super-secure-32-char-encryption-key
SESSION_SECRET=super-secure-session-secret

# 监控
ENABLE_METRICS=true
METRICS_PORT=9090
SENTRY_DSN=https://your-sentry-dsn

# 性能
CLUSTER_MODE=true
WORKER_PROCESSES=4
MAX_MEMORY=2GB
```

## 🔧 配置验证

### 配置模式验证
```javascript
const Joi = require('joi');

const configSchema = Joi.object({
  server: Joi.object({
    host: Joi.string().hostname().required(),
    port: Joi.number().port().required(),
    protocol: Joi.string().valid('http', 'https').required()
  }).required(),
  
  database: Joi.object({
    postgres: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().port().required(),
      database: Joi.string().required(),
      username: Joi.string().required(),
      password: Joi.string().required()
    }).required()
  }).required(),
  
  security: Joi.object({
    jwt: Joi.object({
      secret: Joi.string().min(32).required(),
      expiresIn: Joi.string().required()
    }).required()
  }).required()
});

// 验证配置
const { error, value } = configSchema.validate(config);
if (error) {
  throw new Error(`配置验证失败: ${error.message}`);
}
```

## 📋 配置最佳实践

### 1. 环境分离
- 使用不同的配置文件区分环境
- 敏感信息使用环境变量
- 生产环境禁用调试功能

### 2. 安全配置
- 定期轮换密钥
- 使用强密码策略
- 启用审计日志

### 3. 性能优化
- 根据负载调整并发设置
- 合理配置缓存策略
- 监控资源使用情况

### 4. 监控告警
- 设置关键指标阈值
- 配置多渠道告警
- 定期检查监控系统

---

**维护团队**: MJOS配置团队  
**更新频率**: 每个版本发布时更新  
**技术支持**: config@mjos.com
