# Contributing to MJOS

> **最后更新时间**: 2025-07-17 09:05:45 UTC
> **文档版本**: v2.0.0
> **更新内容**: 新增贡献指南，包含开发流程和代码规范

Thank you for your interest in contributing to MJOS! This guide will help you get started.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/mjos.git
   cd mjos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Provide complete type definitions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing
- Write unit tests for all new features
- Maintain test coverage above 90%
- Use descriptive test names
- Test both success and error cases

### Documentation
- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update API documentation
- Provide usage examples

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Submit pull request**
   - Provide clear description
   - Reference related issues
   - Include test results

## Issue Reporting

When reporting issues, please include:
- MJOS version
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Code Review

All submissions require code review. We look for:
- Code quality and style
- Test coverage
- Documentation completeness
- Performance impact
- Security considerations

## Release Process

1. Version bump following semantic versioning
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm
5. Update documentation

## Getting Help

- Check existing issues and documentation
- Join our Discord community
- Email: dev@mjos.com

Thank you for contributing to MJOS!