"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersion = getVersion;
exports.getVersionInfo = getVersionInfo;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * 获取当前版本号
 * 从package.json动态读取，确保版本一致性
 */
function getVersion() {
    try {
        // 尝试从多个可能的路径读取package.json
        const possiblePaths = [
            (0, path_1.join)(__dirname, '../../package.json'),
            (0, path_1.join)(__dirname, '../../../package.json'),
            (0, path_1.join)(process.cwd(), 'package.json')
        ];
        for (const path of possiblePaths) {
            try {
                const packageJson = JSON.parse((0, fs_1.readFileSync)(path, 'utf8'));
                if (packageJson.version) {
                    return packageJson.version;
                }
            }
            catch {
                // 继续尝试下一个路径
                continue;
            }
        }
        // 如果都失败了，返回默认版本
        return '2.5.2';
    }
    catch (error) {
        // 出错时返回默认版本
        return '2.5.2';
    }
}
/**
 * 获取版本信息字符串
 */
function getVersionInfo() {
    const version = getVersion();
    return `MJOS v${version} initialized with enhanced AI capabilities!`;
}
//# sourceMappingURL=version.js.map