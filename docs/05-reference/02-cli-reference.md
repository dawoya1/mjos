# MJOS CLI 命令行参考

> **最后更新时间**: 2025-07-17 09:45:30 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的CLI命令行参考文档

## 📋 概述

MJOS CLI是一个强大的命令行工具，提供了完整的系统管理、开发和运维功能。本文档详细说明所有可用的命令和选项。

## 🚀 安装和配置

### 全局安装
```bash
npm install -g mjos-cli
```

### 本地安装
```bash
npm install mjos-cli
npx mjos --help
```

### 配置初始化
```bash
mjos init
mjos config set --key api.endpoint --value http://localhost:3000
mjos config set --key auth.token --value your_token_here
```

## 📚 命令分类

### 系统管理命令
- `mjos start` - 启动MJOS系统
- `mjos stop` - 停止MJOS系统
- `mjos restart` - 重启MJOS系统
- `mjos status` - 查看系统状态
- `mjos health` - 健康检查

### 记忆管理命令
- `mjos memory` - 记忆系统管理
- `mjos knowledge` - 知识图谱管理

### 智能体管理命令
- `mjos agent` - 智能体管理
- `mjos team` - 团队管理
- `mjos task` - 任务管理

### 开发工具命令
- `mjos dev` - 开发工具
- `mjos test` - 测试工具
- `mjos build` - 构建工具

## 🔧 详细命令参考

### mjos start
启动MJOS系统

**语法**:
```bash
mjos start [options]
```

**选项**:
- `-p, --port <port>` - 指定端口号 (默认: 3000)
- `-h, --host <host>` - 指定主机地址 (默认: localhost)
- `-e, --env <env>` - 指定环境 (development|production|test)
- `-c, --config <path>` - 指定配置文件路径
- `-d, --daemon` - 后台运行
- `-w, --watch` - 监听文件变化自动重启
- `--cluster` - 启用集群模式
- `--workers <num>` - 指定工作进程数量

**示例**:
```bash
# 基本启动
mjos start

# 指定端口和环境
mjos start --port 8080 --env production

# 后台运行
mjos start --daemon

# 集群模式
mjos start --cluster --workers 4

# 开发模式（监听文件变化）
mjos start --watch --env development
```

### mjos stop
停止MJOS系统

**语法**:
```bash
mjos stop [options]
```

**选项**:
- `-f, --force` - 强制停止
- `-t, --timeout <seconds>` - 停止超时时间 (默认: 30)
- `--all` - 停止所有实例

**示例**:
```bash
# 正常停止
mjos stop

# 强制停止
mjos stop --force

# 停止所有实例
mjos stop --all
```

### mjos status
查看系统状态

**语法**:
```bash
mjos status [options]
```

**选项**:
- `-j, --json` - JSON格式输出
- `-w, --watch` - 实时监控
- `--detailed` - 详细信息
- `--metrics` - 显示性能指标

**示例**:
```bash
# 查看基本状态
mjos status

# JSON格式输出
mjos status --json

# 实时监控
mjos status --watch

# 详细信息
mjos status --detailed --metrics
```

### mjos memory
记忆系统管理

**子命令**:
- `store` - 存储记忆
- `retrieve` - 检索记忆
- `delete` - 删除记忆
- `list` - 列出记忆
- `search` - 搜索记忆
- `export` - 导出记忆
- `import` - 导入记忆

**语法**:
```bash
mjos memory <subcommand> [options]
```

#### memory store
存储新记忆

**语法**:
```bash
mjos memory store [options] <content>
```

**选项**:
- `-t, --tags <tags>` - 标签列表 (逗号分隔)
- `-i, --importance <value>` - 重要性 (0-1)
- `-c, --category <category>` - 分类
- `-m, --metadata <json>` - 元数据 (JSON格式)
- `-f, --file <path>` - 从文件读取内容

**示例**:
```bash
# 存储简单记忆
mjos memory store "今天学习了TypeScript" --tags "学习,编程" --importance 0.8

# 从文件存储
mjos memory store --file ./notes.txt --tags "文档" --category "技术"

# 带元数据存储
mjos memory store "项目会议记录" --metadata '{"date":"2025-01-17","participants":["张三","李四"]}'
```

#### memory retrieve
检索记忆

**语法**:
```bash
mjos memory retrieve [options] <id>
```

**选项**:
- `-f, --format <format>` - 输出格式 (json|text|markdown)
- `--include-metadata` - 包含元数据

**示例**:
```bash
# 检索指定记忆
mjos memory retrieve abc123

# JSON格式输出
mjos memory retrieve abc123 --format json --include-metadata
```

#### memory search
搜索记忆

**语法**:
```bash
mjos memory search [options] <query>
```

**选项**:
- `-t, --tags <tags>` - 按标签过滤
- `-c, --category <category>` - 按分类过滤
- `-l, --limit <num>` - 结果数量限制 (默认: 10)
- `-s, --sort <field>` - 排序字段 (importance|date|relevance)
- `--min-importance <value>` - 最小重要性
- `--from <date>` - 开始日期
- `--to <date>` - 结束日期

**示例**:
```bash
# 基本搜索
mjos memory search "TypeScript学习"

# 按标签和重要性过滤
mjos memory search "编程" --tags "学习" --min-importance 0.5 --limit 20

# 按日期范围搜索
mjos memory search "会议" --from "2025-01-01" --to "2025-01-31"
```

### mjos agent
智能体管理

**子命令**:
- `create` - 创建智能体
- `list` - 列出智能体
- `show` - 显示智能体详情
- `update` - 更新智能体
- `delete` - 删除智能体
- `start` - 启动智能体
- `stop` - 停止智能体

**语法**:
```bash
mjos agent <subcommand> [options]
```

#### agent create
创建新智能体

**语法**:
```bash
mjos agent create [options] <name>
```

**选项**:
- `-t, --type <type>` - 智能体类型 (reactive|deliberative|hybrid)
- `-r, --role <role>` - 角色定义
- `-c, --capabilities <caps>` - 能力列表 (逗号分隔)
- `-f, --config <path>` - 配置文件路径
- `--template <template>` - 使用模板

**示例**:
```bash
# 创建基本智能体
mjos agent create "数据分析师" --type deliberative --role "数据分析专家"

# 使用模板创建
mjos agent create "客服助手" --template customer-service

# 指定能力
mjos agent create "研发助手" --capabilities "代码分析,文档生成,测试执行"
```

#### agent list
列出所有智能体

**语法**:
```bash
mjos agent list [options]
```

**选项**:
- `-s, --status <status>` - 按状态过滤 (active|inactive|error)
- `-t, --type <type>` - 按类型过滤
- `-f, --format <format>` - 输出格式 (table|json|yaml)
- `--detailed` - 显示详细信息

**示例**:
```bash
# 列出所有智能体
mjos agent list

# 只显示活跃的智能体
mjos agent list --status active

# JSON格式输出
mjos agent list --format json --detailed
```

### mjos task
任务管理

**子命令**:
- `create` - 创建任务
- `list` - 列出任务
- `show` - 显示任务详情
- `assign` - 分配任务
- `update` - 更新任务状态
- `cancel` - 取消任务

**语法**:
```bash
mjos task <subcommand> [options]
```

#### task create
创建新任务

**语法**:
```bash
mjos task create [options] <title>
```

**选项**:
- `-d, --description <desc>` - 任务描述
- `-p, --priority <priority>` - 优先级 (low|medium|high|urgent)
- `-a, --assignee <agent>` - 分配给指定智能体
- `-t, --tags <tags>` - 标签列表
- `--deadline <date>` - 截止日期
- `--dependencies <tasks>` - 依赖任务ID列表

**示例**:
```bash
# 创建基本任务
mjos task create "分析用户数据" --description "分析最近一个月的用户行为数据"

# 创建高优先级任务并分配
mjos task create "紧急修复" --priority urgent --assignee "开发助手"

# 带依赖的任务
mjos task create "部署系统" --dependencies "task123,task124" --deadline "2025-01-20"
```

### mjos dev
开发工具

**子命令**:
- `scaffold` - 创建项目脚手架
- `generate` - 代码生成
- `lint` - 代码检查
- `format` - 代码格式化
- `docs` - 文档生成

**语法**:
```bash
mjos dev <subcommand> [options]
```

#### dev scaffold
创建项目脚手架

**语法**:
```bash
mjos dev scaffold [options] <project-name>
```

**选项**:
- `-t, --template <template>` - 项目模板
- `-l, --language <lang>` - 编程语言 (typescript|javascript|python)
- `-f, --framework <framework>` - 框架选择
- `--git` - 初始化Git仓库
- `--install` - 自动安装依赖

**示例**:
```bash
# 创建TypeScript项目
mjos dev scaffold my-project --template basic --language typescript --git --install

# 创建插件项目
mjos dev scaffold my-plugin --template plugin --framework express
```

## 🔧 配置管理

### 配置文件位置
- 全局配置: `~/.mjos/config.json`
- 项目配置: `./mjos.config.js`
- 环境配置: `./.env`

### 配置命令
```bash
# 查看所有配置
mjos config list

# 设置配置项
mjos config set --key api.timeout --value 30000

# 获取配置项
mjos config get api.timeout

# 删除配置项
mjos config delete api.timeout

# 重置配置
mjos config reset
```

## 🐛 调试和日志

### 调试模式
```bash
# 启用调试模式
DEBUG=mjos:* mjos start

# 指定调试模块
DEBUG=mjos:memory,mjos:agent mjos start
```

### 日志管理
```bash
# 查看日志
mjos logs

# 实时日志
mjos logs --follow

# 按级别过滤
mjos logs --level error

# 导出日志
mjos logs --export ./logs.txt --from "2025-01-01"
```

## 📊 性能监控

### 性能指标
```bash
# 查看性能指标
mjos metrics

# 实时监控
mjos metrics --watch

# 导出指标
mjos metrics --export ./metrics.json
```

## 🔗 集成和扩展

### 插件管理
```bash
# 安装插件
mjos plugin install <plugin-name>

# 列出插件
mjos plugin list

# 启用/禁用插件
mjos plugin enable <plugin-name>
mjos plugin disable <plugin-name>

# 卸载插件
mjos plugin uninstall <plugin-name>
```

### API集成
```bash
# 测试API连接
mjos api test

# 调用API
mjos api call --method GET --endpoint /status

# 批量操作
mjos api batch --file ./operations.json
```

## 📋 常用命令组合

### 开发工作流
```bash
# 1. 初始化项目
mjos init
mjos dev scaffold my-app --template full

# 2. 启动开发环境
mjos start --watch --env development

# 3. 创建智能体
mjos agent create "开发助手" --template developer

# 4. 运行测试
mjos test --watch

# 5. 构建项目
mjos build --env production
```

### 生产部署
```bash
# 1. 构建生产版本
mjos build --env production --optimize

# 2. 启动生产服务
mjos start --env production --cluster --daemon

# 3. 健康检查
mjos health --detailed

# 4. 监控状态
mjos status --watch --metrics
```

---

**维护团队**: MJOS CLI团队  
**更新频率**: 每个版本发布时更新  
**技术支持**: cli@mjos.com
