#!/usr/bin/env node
/**
 * MJOS Command Line Interface
 * 魔剑工作室操作系统命令行界面
 */
export declare class MJOSCli {
    private program;
    private mjos;
    private logger;
    constructor();
    private setupCommands;
    private showStatus;
    private startSystem;
    private stopSystem;
    private storeMemory;
    private queryMemory;
    private showMemoryStats;
    private addKnowledge;
    private searchKnowledge;
    private showTeamMembers;
    private showTasks;
    private createTask;
    private listAgents;
    private createAgent;
    private listWorkflows;
    private executeWorkflow;
    private interactiveMode;
    private showInteractiveHelp;
    private executeInteractiveCommand;
    run(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map