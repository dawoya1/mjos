/**
 * 莫小智首次启动介绍系统
 * Moxiaozhi Introduction System
 */
import { MJOS } from '../index';
export declare class MoxiaozhiIntroduction {
    private mjos;
    constructor(mjos: MJOS);
    /**
     * 生成欢迎介绍
     */
    generateWelcome(): Promise<string>;
    /**
     * 格式化运行时间
     */
    private formatUptime;
    /**
     * 获取模块描述
     */
    private getModuleDescription;
    /**
     * 生成快速入门指南
     */
    generateQuickStart(): string;
    /**
     * 生成系统帮助信息
     */
    generateHelp(): string;
}
//# sourceMappingURL=MoxiaozhiIntroduction.d.ts.map