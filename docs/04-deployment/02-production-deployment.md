# MJOS 生产环境部署指南

> **最后更新时间**: 2025-07-17 09:30:15 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的生产环境部署指南

## 📋 概述

本指南详细说明如何在生产环境中部署MJOS系统，包括系统要求、安全配置、性能优化和监控设置。

## 🏗️ 系统架构

### 推荐架构
```
┌─────────────────────────────────────────────────────────┐
│                    负载均衡器 (Load Balancer)            │
│                    Nginx / HAProxy                      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  应用服务器集群                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ MJOS Node 1 │  │ MJOS Node 2 │  │ MJOS Node 3 │     │
│  │   Port 3000 │  │   Port 3000 │  │   Port 3000 │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                    数据层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ PostgreSQL  │  │    Redis    │  │   文件存储   │     │
│  │   主从复制   │  │    集群     │  │    NFS/S3   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 🖥️ 系统要求

### 硬件要求

#### 最小配置
- **CPU**: 4核心 2.4GHz
- **内存**: 8GB RAM
- **存储**: 100GB SSD
- **网络**: 1Gbps

#### 推荐配置
- **CPU**: 8核心 3.0GHz+
- **内存**: 16GB+ RAM
- **存储**: 500GB+ NVMe SSD
- **网络**: 10Gbps

#### 高可用配置
- **CPU**: 16核心 3.2GHz+
- **内存**: 32GB+ RAM
- **存储**: 1TB+ NVMe SSD RAID
- **网络**: 10Gbps 冗余

### 软件要求

#### 操作系统
- **Linux**: Ubuntu 20.04+ LTS, CentOS 8+, RHEL 8+
- **容器**: Docker 20.10+, Kubernetes 1.20+

#### 运行时环境
- **Node.js**: 18.17.0+ LTS
- **npm**: 9.6.7+
- **PM2**: 5.3.0+ (进程管理)

#### 数据库
- **PostgreSQL**: 13+ (主数据库)
- **Redis**: 6.2+ (缓存和会话)

## 🚀 部署步骤

### 1. 环境准备

#### 创建部署用户
```bash
# 创建专用用户
sudo useradd -m -s /bin/bash mjos
sudo usermod -aG sudo mjos

# 切换到部署用户
sudo su - mjos
```

#### 安装Node.js
```bash
# 使用NodeSource仓库安装
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应显示 v18.17.0+
npm --version   # 应显示 9.6.7+
```

#### 安装PM2
```bash
# 全局安装PM2
sudo npm install -g pm2

# 设置PM2开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u mjos --hp /home/mjos
```

### 2. 数据库配置

#### PostgreSQL安装和配置
```bash
# 安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE mjos_production;
CREATE USER mjos_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mjos_production TO mjos_user;
\q

# 配置PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# 修改以下配置：
# listen_addresses = '*'
# max_connections = 200
# shared_buffers = 256MB
# effective_cache_size = 1GB

sudo nano /etc/postgresql/13/main/pg_hba.conf
# 添加：
# host mjos_production mjos_user 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

#### Redis安装和配置
```bash
# 安装Redis
sudo apt install redis-server

# 配置Redis
sudo nano /etc/redis/redis.conf
# 修改以下配置：
# bind 127.0.0.1 ::1
# requirepass your_redis_password
# maxmemory 2gb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 3. 应用部署

#### 下载和配置应用
```bash
# 创建应用目录
mkdir -p /home/mjos/apps
cd /home/mjos/apps

# 克隆代码（生产环境建议使用发布包）
git clone https://github.com/dawoya1/mjos.git
cd mjos

# 安装依赖
npm ci --only=production

# 构建应用
npm run build
```

#### 环境配置
```bash
# 创建生产环境配置
cat > .env.production << EOF
# 环境配置
NODE_ENV=production
LOG_LEVEL=info

# 服务配置
PORT=3000
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mjos_production
DB_USER=mjos_user
DB_PASSWORD=your_secure_password
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# 安全配置
JWT_SECRET=your_super_secure_jwt_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
SESSION_SECRET=your_session_secret_key_here

# 存储配置
STORAGE_PROVIDER=file
STORAGE_PATH=/home/mjos/data

# 监控配置
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_PORT=3001

# 日志配置
LOG_FILE=/home/mjos/logs/mjos.log
LOG_MAX_SIZE=100MB
LOG_MAX_FILES=10

# 性能配置
MAX_MEMORY_USAGE=1GB
WORKER_PROCESSES=4
CLUSTER_MODE=true
EOF

# 设置文件权限
chmod 600 .env.production
```

#### PM2配置
```bash
# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mjos-production',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    log_file: '/home/mjos/logs/mjos.log',
    out_file: '/home/mjos/logs/mjos-out.log',
    error_file: '/home/mjos/logs/mjos-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
};
EOF
```

### 4. 启动应用

```bash
# 创建必要目录
mkdir -p /home/mjos/logs
mkdir -p /home/mjos/data

# 启动应用
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 查看应用状态
pm2 status
pm2 logs mjos-production
```

## 🔒 安全配置

### 防火墙配置
```bash
# 配置UFW防火墙
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # MJOS应用端口（内网）

# 查看状态
sudo ufw status
```

### SSL/TLS配置
```bash
# 安装Certbot
sudo apt install certbot

# 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 配置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx反向代理
```bash
# 安装Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/mjos
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # 代理配置
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }

    # 静态文件
    location /static/ {
        alias /home/mjos/apps/mjos/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/mjos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 监控配置

### 系统监控
```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 配置日志轮转
sudo nano /etc/logrotate.d/mjos
```

```
/home/mjos/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mjos mjos
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 应用监控
```bash
# 安装监控依赖
npm install --save prometheus-client prom-client

# PM2监控
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
```

## 🔧 性能优化

### 系统优化
```bash
# 优化系统参数
sudo nano /etc/sysctl.conf
# 添加：
# net.core.somaxconn = 65535
# net.ipv4.tcp_max_syn_backlog = 65535
# fs.file-max = 100000

# 应用生效
sudo sysctl -p
```

### 应用优化
```bash
# Node.js优化参数
export NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size"

# PM2集群模式
pm2 start ecosystem.config.js --instances max
```

## 🚨 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 检查日志
pm2 logs mjos-production

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查环境变量
pm2 env 0
```

#### 2. 数据库连接失败
```bash
# 测试数据库连接
psql -h localhost -U mjos_user -d mjos_production

# 检查PostgreSQL状态
sudo systemctl status postgresql
```

#### 3. 内存使用过高
```bash
# 监控内存使用
pm2 monit

# 重启应用
pm2 restart mjos-production
```

## 📋 部署检查清单

### 部署前检查
- [ ] 系统要求满足
- [ ] 数据库配置正确
- [ ] 环境变量设置
- [ ] SSL证书配置
- [ ] 防火墙规则设置
- [ ] 备份策略制定

### 部署后验证
- [ ] 应用正常启动
- [ ] 健康检查通过
- [ ] API接口可访问
- [ ] 数据库连接正常
- [ ] 日志记录正常
- [ ] 监控指标正常

### 安全检查
- [ ] 默认密码已更改
- [ ] 不必要端口已关闭
- [ ] SSL/TLS配置正确
- [ ] 安全头设置
- [ ] 访问日志启用
- [ ] 备份加密存储

---

**维护团队**: MJOS运维团队  
**更新频率**: 每月一次  
**紧急联系**: ops@mjos.com
