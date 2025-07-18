import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 获取当前版本号
 * 从package.json动态读取，确保版本一致性
 */
export function getVersion(): string {
  try {
    // 尝试从多个可能的路径读取package.json
    const possiblePaths = [
      join(__dirname, '../../package.json'),
      join(__dirname, '../../../package.json'),
      join(process.cwd(), 'package.json')
    ];

    for (const path of possiblePaths) {
      try {
        const packageJson = JSON.parse(readFileSync(path, 'utf8'));
        if (packageJson.version) {
          return packageJson.version;
        }
      } catch {
        // 继续尝试下一个路径
        continue;
      }
    }

    // 如果都失败了，返回默认版本
    return '2.5.2';
  } catch (error) {
    // 出错时返回默认版本
    return '2.5.2';
  }
}

/**
 * 获取版本信息字符串
 */
export function getVersionInfo(): string {
  const version = getVersion();
  return `MJOS v${version} initialized with enhanced AI capabilities!`;
}
