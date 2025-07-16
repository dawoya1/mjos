# GitHub上传命令

在GitHub上创建仓库后，运行以下命令上传代码：

```bash
# 进入项目目录
cd .mjos

# 推送到GitHub（如果仓库已创建）
git push -u origin main
```

如果遇到权限问题，可能需要：

1. **配置Git用户信息**:
```bash
git config --global user.name "dawoya1"
git config --global user.email "dawoya01@outlook.com"
```

2. **使用Personal Access Token**:
   - 在GitHub Settings > Developer settings > Personal access tokens 创建token
   - 使用token作为密码推送

3. **或者使用SSH**:
```bash
# 添加SSH远程地址
git remote set-url origin git@github.com:dawoya1/mjos.git
git push -u origin main
```

## 仓库信息

- **仓库名**: mjos
- **描述**: MJOS (Magic Sword Studio Operating System) - 企业级AI团队协作框架，支持智能记忆管理、团队任务协调和MCP协议集成
- **URL**: https://github.com/dawoya1/mjos
- **类型**: Public
- **许可证**: MIT

## 已准备的内容

✅ 所有源代码文件
✅ 完整的文档系统
✅ 测试套件
✅ 示例代码
✅ MCP服务器实现
✅ 配置文件
✅ .gitignore文件
✅ README.md
✅ LICENSE文件

代码已经提交到本地Git仓库，只需要推送到GitHub即可。
