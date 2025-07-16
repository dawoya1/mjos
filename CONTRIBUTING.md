# 贡献指南

感谢您对MJOS项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、测试、反馈和建议。

## 🤝 如何贡献

### 报告问题

如果您发现了bug或有功能建议，请：

1. 检查[现有Issues](https://github.com/magic-sword-studio/mjos/issues)确保问题未被报告
2. 使用相应的Issue模板创建新Issue
3. 提供详细的描述和复现步骤
4. 如果可能，请提供错误日志和环境信息

### 提交代码

1. **Fork项目**
   ```bash
   git clone https://github.com/your-username/mjos.git
   cd mjos
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **进行开发**
   - 遵循现有的代码风格
   - 添加必要的测试
   - 更新相关文档

5. **运行测试**
   ```bash
   npm test
   npm run build
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建Pull Request**
   - 使用PR模板
   - 详细描述更改内容
   - 关联相关Issues

## 📝 代码规范

### TypeScript规范
- 使用TypeScript进行开发
- 遵循严格的类型检查
- 为所有公共API提供类型定义
- 使用有意义的变量和函数名

### 代码风格
- 使用2个空格缩进
- 使用单引号字符串
- 行末不要分号（除非必要）
- 最大行长度120字符

### 提交信息规范
使用[Conventional Commits](https://conventionalcommits.org/)格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 测试要求
- 新功能必须包含测试
- 测试覆盖率不能降低
- 所有测试必须通过
- 包含单元测试和集成测试

## 🏗️ 开发环境设置

### 系统要求
- Node.js 18+
- npm 8+
- TypeScript 5.0+

### 本地开发
```bash
# 克隆项目
git clone https://github.com/magic-sword-studio/mjos.git
cd mjos

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test

# 运行示例
node test-enhanced.js
```

### 项目结构
```
mjos/
├── src/                 # 源代码
│   ├── core/           # 核心模块
│   ├── memory/         # 记忆系统
│   ├── team/           # 团队管理
│   ├── performance/    # 性能监控
│   └── types/          # 类型定义
├── tests/              # 测试文件
├── docs/               # 文档
├── examples/           # 示例代码
└── dist/               # 构建输出
```

## 🎯 开发指南

### 添加新功能
1. 在相应模块目录下创建新文件
2. 导出必要的类型和接口
3. 在主index.ts中导出新功能
4. 添加相应的测试
5. 更新API文档

### 修复Bug
1. 创建复现bug的测试用例
2. 修复代码使测试通过
3. 确保不影响现有功能
4. 更新相关文档

### 更新文档
1. API文档使用TypeScript注释自动生成
2. 使用示例放在docs/EXAMPLES.md
3. 重要变更更新CHANGELOG.md

## 🔍 代码审查

所有PR都需要经过代码审查：

- 至少一个维护者的批准
- 所有CI检查通过
- 代码符合项目规范
- 包含必要的测试和文档

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. 查看[文档](./docs/)
2. 搜索[现有Issues](https://github.com/magic-sword-studio/mjos/issues)
3. 在[Discussions](https://github.com/magic-sword-studio/mjos/discussions)中提问
4. 联系维护者

## 🙏 致谢

感谢所有为MJOS项目做出贡献的开发者！

您的贡献将被记录在项目的贡献者列表中。

---

**魔剑工作室团队**  
让AI团队协作更智能、更高效
