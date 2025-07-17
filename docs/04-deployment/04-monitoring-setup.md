# MJOS 监控系统配置指南

> **最后更新时间**: 2025-07-17 09:35:20 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的监控系统配置指南

## 📋 概述

本指南详细说明如何为MJOS系统配置完整的监控体系，包括指标收集、日志聚合、告警通知和可视化展示。

## 🏗️ 监控架构

### 监控体系架构
```
┌─────────────────────────────────────────────────────────┐
│                    可视化层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Grafana   │  │  Kibana     │  │   自定义     │     │
│  │   仪表板     │  │   日志      │  │   监控页面   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                    数据存储层                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Prometheus  │  │Elasticsearch│  │   InfluxDB  │     │
│  │   时序数据   │  │   日志数据   │  │   性能数据   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                    数据收集层                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Node      │  │  Filebeat   │  │   自定义     │     │
│  │  Exporter   │  │   日志收集   │  │   指标收集   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  MJOS应用层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ MJOS App 1  │  │ MJOS App 2  │  │ MJOS App 3  │     │
│  │   指标暴露   │  │   日志输出   │  │   健康检查   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 📊 Prometheus监控配置

### Prometheus配置文件
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # MJOS应用监控
  - job_name: 'mjos-app'
    static_configs:
      - targets: ['mjos-app:9090']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Node.js进程监控
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # PostgreSQL监控
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis监控
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx监控
  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # 自定义业务指标
  - job_name: 'mjos-business-metrics'
    static_configs:
      - targets: ['mjos-app:9091']
    metrics_path: '/business-metrics'
```

### 告警规则配置
```yaml
# monitoring/rules/mjos-alerts.yml
groups:
  - name: mjos-application
    rules:
      # 应用可用性告警
      - alert: MJOSAppDown
        expr: up{job="mjos-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MJOS应用实例下线"
          description: "MJOS应用实例 {{ $labels.instance }} 已下线超过1分钟"

      # 高错误率告警
      - alert: MJOSHighErrorRate
        expr: rate(mjos_http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "MJOS应用错误率过高"
          description: "MJOS应用错误率超过10%，当前值: {{ $value }}"

      # 高响应时间告警
      - alert: MJOSHighLatency
        expr: histogram_quantile(0.95, rate(mjos_http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MJOS应用响应时间过长"
          description: "MJOS应用95%响应时间超过1秒，当前值: {{ $value }}s"

      # 内存使用告警
      - alert: MJOSHighMemoryUsage
        expr: (mjos_memory_usage_bytes / mjos_memory_limit_bytes) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MJOS应用内存使用率过高"
          description: "MJOS应用内存使用率超过80%，当前值: {{ $value }}%"

      # CPU使用告警
      - alert: MJOSHighCPUUsage
        expr: rate(mjos_cpu_usage_seconds_total[5m]) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MJOS应用CPU使用率过高"
          description: "MJOS应用CPU使用率超过80%，当前值: {{ $value }}%"

  - name: mjos-database
    rules:
      # 数据库连接告警
      - alert: PostgreSQLDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL数据库下线"
          description: "PostgreSQL数据库已下线超过1分钟"

      # 数据库连接数告警
      - alert: PostgreSQLTooManyConnections
        expr: pg_stat_database_numbackends / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL连接数过多"
          description: "PostgreSQL连接数超过80%，当前值: {{ $value }}%"

  - name: mjos-redis
    rules:
      # Redis可用性告警
      - alert: RedisDown
        expr: up{job="redis-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis服务下线"
          description: "Redis服务已下线超过1分钟"

      # Redis内存使用告警
      - alert: RedisHighMemoryUsage
        expr: (redis_memory_used_bytes / redis_memory_max_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis内存使用率过高"
          description: "Redis内存使用率超过90%，当前值: {{ $value }}%"
```

### Alertmanager配置
```yaml
# monitoring/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@mjos.com'
  smtp_auth_username: 'alerts@mjos.com'
  smtp_auth_password: 'your_email_password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://webhook-service:5001/webhook'

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@mjos.com'
        subject: '🚨 MJOS关键告警: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          告警: {{ .Annotations.summary }}
          描述: {{ .Annotations.description }}
          时间: {{ .StartsAt }}
          {{ end }}
    webhook_configs:
      - url: 'http://webhook-service:5001/critical'

  - name: 'warning-alerts'
    email_configs:
      - to: 'ops@mjos.com'
        subject: '⚠️ MJOS警告告警: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          告警: {{ .Annotations.summary }}
          描述: {{ .Annotations.description }}
          时间: {{ .StartsAt }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

## 📈 Grafana仪表板配置

### 数据源配置
```yaml
# monitoring/grafana/datasources.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    database: mjos-logs-*
    timeField: "@timestamp"

  - name: InfluxDB
    type: influxdb
    access: proxy
    url: http://influxdb:8086
    database: mjos_metrics
```

### 仪表板配置
```json
{
  "dashboard": {
    "title": "MJOS系统监控仪表板",
    "tags": ["mjos", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "title": "应用状态概览",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"mjos-app\"}",
            "legendFormat": "应用实例状态"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "title": "请求速率",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(mjos_http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "响应时间分布",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(mjos_http_request_duration_seconds_bucket[5m])",
            "legendFormat": "{{le}}"
          }
        ]
      },
      {
        "title": "内存使用情况",
        "type": "graph",
        "targets": [
          {
            "expr": "mjos_memory_usage_bytes",
            "legendFormat": "已使用内存"
          },
          {
            "expr": "mjos_memory_limit_bytes",
            "legendFormat": "内存限制"
          }
        ]
      },
      {
        "title": "数据库连接池",
        "type": "graph",
        "targets": [
          {
            "expr": "mjos_db_connections_active",
            "legendFormat": "活跃连接"
          },
          {
            "expr": "mjos_db_connections_idle",
            "legendFormat": "空闲连接"
          }
        ]
      }
    ]
  }
}
```

## 📝 日志监控配置

### ELK Stack配置

#### Elasticsearch配置
```yaml
# monitoring/elasticsearch.yml
cluster.name: mjos-logs
node.name: elasticsearch-node-1
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true
```

#### Logstash配置
```ruby
# monitoring/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "mjos" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    mutate {
      add_field => { "service" => "mjos" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "mjos-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

#### Filebeat配置
```yaml
# monitoring/filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/mjos/*.log
    fields:
      service: mjos
    fields_under_root: true
    multiline.pattern: '^\d{4}-\d{2}-\d{2}'
    multiline.negate: true
    multiline.match: after

output.logstash:
  hosts: ["logstash:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
```

## 🔔 告警通知配置

### 钉钉机器人通知
```javascript
// monitoring/webhook-service.js
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 钉钉机器人Webhook
const DINGTALK_WEBHOOK = 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN';

app.post('/webhook', async (req, res) => {
  const alerts = req.body.alerts;
  
  for (const alert of alerts) {
    const message = {
      msgtype: 'markdown',
      markdown: {
        title: `MJOS告警: ${alert.labels.alertname}`,
        text: `
### ${alert.annotations.summary}

**告警级别**: ${alert.labels.severity}
**告警描述**: ${alert.annotations.description}
**告警时间**: ${alert.startsAt}
**实例**: ${alert.labels.instance}

[查看详情](http://grafana.mjos.com/dashboard)
        `
      }
    };
    
    try {
      await axios.post(DINGTALK_WEBHOOK, message);
    } catch (error) {
      console.error('发送钉钉通知失败:', error);
    }
  }
  
  res.status(200).send('OK');
});

app.listen(5001, () => {
  console.log('Webhook服务启动在端口5001');
});
```

### 企业微信通知
```javascript
// monitoring/wechat-webhook.js
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const WECHAT_WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY';

app.post('/wechat', async (req, res) => {
  const alerts = req.body.alerts;
  
  for (const alert of alerts) {
    const message = {
      msgtype: 'markdown',
      markdown: {
        content: `
## MJOS系统告警

**告警名称**: ${alert.labels.alertname}
**告警级别**: <font color="warning">${alert.labels.severity}</font>
**告警描述**: ${alert.annotations.description}
**告警时间**: ${alert.startsAt}
**实例地址**: ${alert.labels.instance}

> 请及时处理相关问题
        `
      }
    };
    
    try {
      await axios.post(WECHAT_WEBHOOK, message);
    } catch (error) {
      console.error('发送企业微信通知失败:', error);
    }
  }
  
  res.status(200).send('OK');
});

app.listen(5002, () => {
  console.log('企业微信Webhook服务启动在端口5002');
});
```

## 🐳 Docker Compose监控栈

```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: mjos-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: mjos-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml

  alertmanager:
    image: prom/alertmanager:latest
    container_name: mjos-alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

  node-exporter:
    image: prom/node-exporter:latest
    container_name: mjos-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus-data:
  grafana-data:
```

## 📋 监控检查清单

### 部署前检查
- [ ] Prometheus配置文件正确
- [ ] 告警规则配置完整
- [ ] Grafana数据源配置
- [ ] 通知渠道测试通过
- [ ] 存储空间充足

### 运行时监控
- [ ] 所有目标正常采集
- [ ] 告警规则正常触发
- [ ] 仪表板数据正常显示
- [ ] 通知正常发送
- [ ] 日志正常收集

### 定期维护
- [ ] 清理过期数据
- [ ] 更新监控规则
- [ ] 优化查询性能
- [ ] 备份监控配置
- [ ] 测试灾难恢复

---

**维护团队**: MJOS监控团队  
**更新频率**: 每月一次  
**技术支持**: monitoring@mjos.com
