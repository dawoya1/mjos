/**
 * MJOS Web管理界面
 * MJOS Web Management Interface
 */
import { MJOS } from '../index';
export interface WebInterfaceConfig {
    port: number;
    host: string;
    enableCORS: boolean;
    staticPath?: string;
}
export declare class MJOSWebInterface {
    private app;
    private server;
    private mjos;
    private teamSystem;
    private memoryManager;
    private localManager;
    private config;
    constructor(mjos: MJOS, config?: Partial<WebInterfaceConfig>);
    /**
     * 设置中间件
     */
    private setupMiddleware;
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 设置API路由
     */
    private setupAPIRoutes;
    /**
     * 设置团队管理路由
     */
    private setupTeamRoutes;
    /**
     * 设置记忆管理路由
     */
    private setupMemoryRoutes;
    /**
     * 设置监控路由
     */
    private setupMonitoringRoutes;
    /**
     * 生成主页HTML
     */
    private generateHomePage;
    /**
     * 启动Web服务器
     */
    start(): Promise<void>;
    /**
     * 停止Web服务器
     */
    stop(): Promise<void>;
}
export default MJOSWebInterface;
//# sourceMappingURL=MJOSWebInterface.d.ts.map