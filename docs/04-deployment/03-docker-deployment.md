# MJOS Docker 容器化部署指南

> **最后更新时间**: 2025-07-17 09:32:45 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的Docker容器化部署指南

## 📋 概述

本指南详细说明如何使用Docker容器化部署MJOS系统，包括单容器部署、多容器编排和Kubernetes集群部署。

## 🐳 Docker配置

### Dockerfile
```dockerfile
# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装dumb-init用于信号处理
RUN apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mjos -u 1001

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建必要目录并设置权限
RUN mkdir -p /app/logs /app/data && \
    chown -R mjos:nodejs /app

# 切换到非root用户
USER mjos

# 暴露端口
EXPOSE 3000 9090

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/health-check.js || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### .dockerignore
```dockerignore
# 依赖目录
node_modules/
npm-debug.log*

# 构建产物
dist/
build/
*.tsbuildinfo

# 测试和覆盖率
coverage/
.nyc_output/
tests/

# 日志文件
logs/
*.log

# 环境文件
.env*
!.env.example

# Git相关
.git/
.gitignore

# IDE文件
.vscode/
.idea/
*.swp
*.swo

# 操作系统文件
.DS_Store
Thumbs.db

# 文档
docs/
README.md
CHANGELOG.md

# 开发工具配置
.eslintrc*
.prettierrc*
jest.config.js

# 临时文件
tmp/
temp/
.cache/

# 备份文件
*.backup
*-backup.*
```

## 🏗️ 构建和运行

### 本地构建
```bash
# 构建镜像
docker build -t mjos:latest .

# 运行容器
docker run -d \
  --name mjos-app \
  -p 3000:3000 \
  -p 9090:9090 \
  -e NODE_ENV=production \
  -e DB_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  -v mjos-data:/app/data \
  -v mjos-logs:/app/logs \
  mjos:latest

# 查看日志
docker logs -f mjos-app

# 进入容器
docker exec -it mjos-app sh
```

### 多阶段优化构建
```bash
# 构建优化镜像
docker build \
  --target production \
  --build-arg NODE_ENV=production \
  -t mjos:v2.0.0 \
  -t mjos:latest \
  .

# 查看镜像大小
docker images mjos
```

## 🐙 Docker Compose

### docker-compose.yml
```yaml
version: '3.8'

services:
  # MJOS应用服务
  mjos-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: mjos:latest
    container_name: mjos-app
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "9090:9090"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - DB_USER=mjos_user
      - DB_PASSWORD=mjos_password
      - DB_NAME=mjos_production
      - REDIS_PASSWORD=redis_password
    volumes:
      - mjos-data:/app/data
      - mjos-logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - mjos-network
    healthcheck:
      test: ["CMD", "node", "dist/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    container_name: mjos-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=mjos_production
      - POSTGRES_USER=mjos_user
      - POSTGRES_PASSWORD=mjos_password
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    ports:
      - "5432:5432"
    networks:
      - mjos-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mjos_user -d mjos_production"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: mjos-redis
    restart: unless-stopped
    command: redis-server --requirepass redis_password --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - mjos-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: mjos-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      - mjos-app
    networks:
      - mjos-network

  # 监控服务 (可选)
  prometheus:
    image: prom/prometheus:latest
    container_name: mjos-prometheus
    restart: unless-stopped
    ports:
      - "9091:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - mjos-network

volumes:
  mjos-data:
    driver: local
  mjos-logs:
    driver: local
  postgres-data:
    driver: local
  redis-data:
    driver: local
  nginx-logs:
    driver: local
  prometheus-data:
    driver: local

networks:
  mjos-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 环境配置文件
```bash
# .env.docker
NODE_ENV=production
LOG_LEVEL=info

# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mjos_production
DB_USER=mjos_user
DB_PASSWORD=mjos_password
DB_SSL=false
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_DB=0

# 安全配置
JWT_SECRET=your_super_secure_jwt_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
SESSION_SECRET=your_session_secret_key_here

# 应用配置
PORT=3000
HOST=0.0.0.0
METRICS_PORT=9090

# 存储配置
STORAGE_PROVIDER=file
STORAGE_PATH=/app/data

# 监控配置
ENABLE_METRICS=true
HEALTH_CHECK_PORT=3000
```

## 🚀 部署命令

### 开发环境
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f mjos-app

# 停止服务
docker-compose down
```

### 生产环境
```bash
# 使用生产配置启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 扩展应用实例
docker-compose up -d --scale mjos-app=3

# 滚动更新
docker-compose pull mjos-app
docker-compose up -d --no-deps mjos-app

# 备份数据
docker-compose exec postgres pg_dump -U mjos_user mjos_production > backup.sql
```

## ☸️ Kubernetes部署

### Namespace
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mjos
  labels:
    name: mjos
```

### ConfigMap
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mjos-config
  namespace: mjos
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
  METRICS_PORT: "9090"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "mjos_production"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  STORAGE_PROVIDER: "file"
  STORAGE_PATH: "/app/data"
  ENABLE_METRICS: "true"
```

### Secret
```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mjos-secret
  namespace: mjos
type: Opaque
data:
  DB_USER: bWpvc191c2Vy  # base64 encoded
  DB_PASSWORD: bWpvc19wYXNzd29yZA==  # base64 encoded
  REDIS_PASSWORD: cmVkaXNfcGFzc3dvcmQ=  # base64 encoded
  JWT_SECRET: eW91cl9zdXBlcl9zZWN1cmVfand0X3NlY3JldA==  # base64 encoded
  ENCRYPTION_KEY: eW91cl8zMl9jaGFyYWN0ZXJfZW5jcnlwdGlvbl9rZXk=  # base64 encoded
```

### Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mjos-app
  namespace: mjos
  labels:
    app: mjos-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mjos-app
  template:
    metadata:
      labels:
        app: mjos-app
    spec:
      containers:
      - name: mjos-app
        image: mjos:v2.0.0
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics
        envFrom:
        - configMapRef:
            name: mjos-config
        - secretRef:
            name: mjos-secret
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
        - name: logs-volume
          mountPath: /app/logs
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: mjos-data-pvc
      - name: logs-volume
        persistentVolumeClaim:
          claimName: mjos-logs-pvc
```

### Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mjos-service
  namespace: mjos
  labels:
    app: mjos-app
spec:
  selector:
    app: mjos-app
  ports:
  - name: http
    port: 80
    targetPort: 3000
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
```

### Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mjos-ingress
  namespace: mjos
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - mjos.yourdomain.com
    secretName: mjos-tls
  rules:
  - host: mjos.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mjos-service
            port:
              number: 80
```

## 📊 监控和日志

### 健康检查脚本
```javascript
// dist/health-check.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### 日志配置
```yaml
# 使用Fluentd收集日志
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/mjos-app*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
    
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch-service
      port 9200
      index_name mjos-logs
    </match>
```

## 🔧 优化建议

### 镜像优化
```dockerfile
# 使用多阶段构建减小镜像大小
# 使用Alpine Linux基础镜像
# 清理不必要的文件和缓存
# 使用.dockerignore排除不需要的文件
```

### 性能优化
```yaml
# 资源限制
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"

# 水平扩展
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### 安全配置
```yaml
# 安全上下文
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
```

---

**维护团队**: MJOS容器化团队  
**更新频率**: 每月一次  
**技术支持**: docker@mjos.com
