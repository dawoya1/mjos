/**
 * MPML Memory Version Control
 * Magic Persistent Memory Language 记忆版本控制
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { MemoryEntry, MJOSError } from './types/index';

export interface MemoryVersion {
  id: string;
  memoryId: string;
  version: number;
  content: any;
  metadata: VersionMetadata;
  parentVersion?: string;
  createdAt: Date;
  author: string;
}

export interface VersionMetadata {
  changeType: ChangeType;
  changeDescription: string;
  tags: string[];
  size: number;
  checksum: string;
  diff?: VersionDiff;
}

export type ChangeType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'merge' 
  | 'branch' 
  | 'restore';

export interface VersionDiff {
  added: any[];
  removed: any[];
  modified: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

export interface MemoryBranch {
  id: string;
  name: string;
  memoryId: string;
  baseVersion: string;
  headVersion: string;
  createdAt: Date;
  author: string;
  description: string;
  status: BranchStatus;
}

export type BranchStatus = 'active' | 'merged' | 'abandoned';

export interface MergeRequest {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  memoryId: string;
  author: string;
  title: string;
  description: string;
  status: MergeStatus;
  conflicts?: MergeConflict[];
  createdAt: Date;
  updatedAt: Date;
}

export type MergeStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'conflicted';

export interface MergeConflict {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolution?: any;
}

export interface VersionHistory {
  memoryId: string;
  versions: MemoryVersion[];
  branches: MemoryBranch[];
  mergeRequests: MergeRequest[];
  totalVersions: number;
  currentVersion: string;
}

/**
 * 记忆版本控制�? * 管理记忆的版本历史、分支和合并
 */
export class MemoryVersionControl {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private versions = new Map<string, MemoryVersion>();
  private branches = new Map<string, MemoryBranch>();
  private mergeRequests = new Map<string, MergeRequest>();
  private memoryVersions = new Map<string, string[]>(); // memoryId -> versionIds
  private memoryBranches = new Map<string, string[]>(); // memoryId -> branchIds

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
    
    this.logger.info('Memory Version Control initialized');
  }

  /**
   * 创建记忆版本
   */
  public async createVersion(
    memoryId: string,
    content: any,
    changeType: ChangeType,
    changeDescription: string,
    author: string,
    parentVersion?: string
  ): Promise<string> {
    try {
      const versionId = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 计算版本�?      const existingVersions = this.memoryVersions.get(memoryId) || [];
      const version = existingVersions.length + 1;
      
      // 计算差异
      const diff = parentVersion ? 
        await this.calculateDiff(parentVersion, content) : undefined;
      
      const memoryVersion: MemoryVersion = {
        id: versionId,
        memoryId,
        version,
        content,
        metadata: {
          changeType,
          changeDescription,
          tags: [],
          size: this.calculateContentSize(content),
          checksum: this.calculateChecksum(content),
          diff
        },
        parentVersion,
        createdAt: new Date(),
        author
      };

      this.versions.set(versionId, memoryVersion);
      
      // 更新记忆版本映射
      if (!this.memoryVersions.has(memoryId)) {
        this.memoryVersions.set(memoryId, []);
      }
      this.memoryVersions.get(memoryId)!.push(versionId);

      this.logger.info('Memory version created', {
        versionId,
        memoryId,
        version,
        changeType,
        author
      });

      this.eventBus.publishEvent('memory_version.created', {
        memoryVersion
      }, 'MemoryVersionControl');

      return versionId;

    } catch (error) {
      this.logger.error('Failed to create memory version', {
        memoryId,
        changeType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.createVersionError(error, 'createVersion', { memoryId, changeType });
    }
  }

  /**
   * 获取版本历史
   */
  public getVersionHistory(memoryId: string): VersionHistory {
    const versionIds = this.memoryVersions.get(memoryId) || [];
    const versions = versionIds
      .map(id => this.versions.get(id))
      .filter(v => v !== undefined) as MemoryVersion[];
    
    const branchIds = this.memoryBranches.get(memoryId) || [];
    const branches = branchIds
      .map(id => this.branches.get(id))
      .filter(b => b !== undefined) as MemoryBranch[];
    
    const mergeRequests = Array.from(this.mergeRequests.values())
      .filter(mr => mr.memoryId === memoryId);
    
    const currentVersion = versions.length > 0 ? 
      versions[versions.length - 1].id : '';

    return {
      memoryId,
      versions: versions.sort((a, b) => a.version - b.version),
      branches,
      mergeRequests,
      totalVersions: versions.length,
      currentVersion
    };
  }

  /**
   * 获取特定版本
   */
  public getVersion(versionId: string): MemoryVersion | undefined {
    return this.versions.get(versionId);
  }

  /**
   * 恢复到特定版�?   */
  public async restoreToVersion(
    memoryId: string,
    versionId: string,
    author: string
  ): Promise<string | null> {
    try {
      const targetVersion = this.versions.get(versionId);
      if (!targetVersion) {
        throw new Error(`Version not found: ${versionId}`);
      }

      if (targetVersion.memoryId !== memoryId) {
        throw new Error(`Version ${versionId} does not belong to memory ${memoryId}`);
      }

      // 创建恢复版本
      const restoredVersionId = await this.createVersion(
        memoryId,
        targetVersion.content,
        'restore',
        `Restored to version ${targetVersion.version}`,
        author,
        this.getCurrentVersion(memoryId)
      );

      this.logger.info('Memory restored to version', {
        memoryId,
        targetVersionId: versionId,
        restoredVersionId,
        author
      });

      this.eventBus.publishEvent('memory_version.restored', {
        memoryId,
        targetVersionId: versionId,
        restoredVersionId,
        author
      }, 'MemoryVersionControl');

      return restoredVersionId;

    } catch (error) {
      this.logger.error('Failed to restore memory version', {
        memoryId,
        versionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 创建分支
   */
  public async createBranch(
    memoryId: string,
    branchName: string,
    baseVersionId: string,
    author: string,
    description: string = ''
  ): Promise<string | null> {
    try {
      const baseVersion = this.versions.get(baseVersionId);
      if (!baseVersion) {
        throw new Error(`Base version not found: ${baseVersionId}`);
      }

      if (baseVersion.memoryId !== memoryId) {
        throw new Error(`Base version does not belong to memory ${memoryId}`);
      }

      const branchId = `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const branch: MemoryBranch = {
        id: branchId,
        name: branchName,
        memoryId,
        baseVersion: baseVersionId,
        headVersion: baseVersionId,
        createdAt: new Date(),
        author,
        description,
        status: 'active'
      };

      this.branches.set(branchId, branch);
      
      // 更新记忆分支映射
      if (!this.memoryBranches.has(memoryId)) {
        this.memoryBranches.set(memoryId, []);
      }
      this.memoryBranches.get(memoryId)!.push(branchId);

      this.logger.info('Memory branch created', {
        branchId,
        branchName,
        memoryId,
        baseVersionId,
        author
      });

      this.eventBus.publishEvent('memory_branch.created', {
        branch
      }, 'MemoryVersionControl');

      return branchId;

    } catch (error) {
      this.logger.error('Failed to create memory branch', {
        memoryId,
        branchName,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 创建合并请求
   */
  public async createMergeRequest(
    sourceBranchId: string,
    targetBranchId: string,
    author: string,
    title: string,
    description: string
  ): Promise<string | null> {
    try {
      const sourceBranch = this.branches.get(sourceBranchId);
      const targetBranch = this.branches.get(targetBranchId);
      
      if (!sourceBranch || !targetBranch) {
        throw new Error('Source or target branch not found');
      }

      if (sourceBranch.memoryId !== targetBranch.memoryId) {
        throw new Error('Branches must belong to the same memory');
      }

      const mergeRequestId = `merge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 检测冲�?      const conflicts = await this.detectConflicts(sourceBranch, targetBranch);
      
      const mergeRequest: MergeRequest = {
        id: mergeRequestId,
        sourceBranch: sourceBranchId,
        targetBranch: targetBranchId,
        memoryId: sourceBranch.memoryId,
        author,
        title,
        description,
        status: conflicts.length > 0 ? 'conflicted' : 'pending',
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.mergeRequests.set(mergeRequestId, mergeRequest);

      this.logger.info('Merge request created', {
        mergeRequestId,
        sourceBranch: sourceBranch.name,
        targetBranch: targetBranch.name,
        status: mergeRequest.status,
        conflictCount: conflicts.length
      });

      this.eventBus.publishEvent('memory_merge.request_created', {
        mergeRequest
      }, 'MemoryVersionControl');

      return mergeRequestId;

    } catch (error) {
      this.logger.error('Failed to create merge request', {
        sourceBranchId,
        targetBranchId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 执行合并
   */
  public async executeMerge(
    mergeRequestId: string,
    author: string,
    conflictResolutions?: Map<string, any>
  ): Promise<boolean> {
    try {
      const mergeRequest = this.mergeRequests.get(mergeRequestId);
      if (!mergeRequest) {
        throw new Error(`Merge request not found: ${mergeRequestId}`);
      }

      if (mergeRequest.status !== 'approved' && mergeRequest.status !== 'pending') {
        throw new Error(`Cannot merge request with status: ${mergeRequest.status}`);
      }

      const sourceBranch = this.branches.get(mergeRequest.sourceBranch)!;
      const targetBranch = this.branches.get(mergeRequest.targetBranch)!;
      
      const sourceVersion = this.versions.get(sourceBranch.headVersion)!;
      const targetVersion = this.versions.get(targetBranch.headVersion)!;

      // 合并内容
      const mergedContent = await this.mergeContent(
        sourceVersion.content,
        targetVersion.content,
        mergeRequest.conflicts,
        conflictResolutions
      );

      // 创建合并版本
      const mergedVersionId = await this.createVersion(
        mergeRequest.memoryId,
        mergedContent,
        'merge',
        `Merged ${sourceBranch.name} into ${targetBranch.name}`,
        author,
        targetVersion.id
      );

      // 更新目标分支
      targetBranch.headVersion = mergedVersionId;
      this.branches.set(targetBranch.id, targetBranch);

      // 更新合并请求状�?      mergeRequest.status = 'merged';
      mergeRequest.updatedAt = new Date();
      this.mergeRequests.set(mergeRequestId, mergeRequest);

      this.logger.info('Merge executed successfully', {
        mergeRequestId,
        mergedVersionId,
        sourceBranch: sourceBranch.name,
        targetBranch: targetBranch.name
      });

      this.eventBus.publishEvent('memory_merge.executed', {
        mergeRequest,
        mergedVersionId
      }, 'MemoryVersionControl');

      return true;

    } catch (error) {
      this.logger.error('Failed to execute merge', {
        mergeRequestId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 比较版本
   */
  public async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<VersionDiff | null> {
    try {
      const version1 = this.versions.get(versionId1);
      const version2 = this.versions.get(versionId2);
      
      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }

      return await this.calculateDiff(versionId1, version2.content);

    } catch (error) {
      this.logger.error('Failed to compare versions', {
        versionId1,
        versionId2,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 获取当前版本
   */
  private getCurrentVersion(memoryId: string): string | undefined {
    const versionIds = this.memoryVersions.get(memoryId) || [];
    return versionIds.length > 0 ? versionIds[versionIds.length - 1] : undefined;
  }

  /**
   * 计算差异
   */
  private async calculateDiff(baseVersionId: string, newContent: any): Promise<VersionDiff> {
    const baseVersion = this.versions.get(baseVersionId);
    if (!baseVersion) {
      return { added: [newContent], removed: [], modified: [] };
    }

    const baseContent = baseVersion.content;
    
    // 简化的差异计算
    const diff: VersionDiff = {
      added: [],
      removed: [],
      modified: []
    };

    if (typeof baseContent === 'object' && typeof newContent === 'object') {
      // 对象比较
      const baseKeys = Object.keys(baseContent);
      const newKeys = Object.keys(newContent);
      
      // 查找新增字段
      for (const key of newKeys) {
        if (!baseKeys.includes(key)) {
          diff.added.push({ [key]: newContent[key] });
        }
      }
      
      // 查找删除字段
      for (const key of baseKeys) {
        if (!newKeys.includes(key)) {
          diff.removed.push({ [key]: baseContent[key] });
        }
      }
      
      // 查找修改字段
      for (const key of baseKeys) {
        if (newKeys.includes(key) && baseContent[key] !== newContent[key]) {
          diff.modified.push({
            field: key,
            oldValue: baseContent[key],
            newValue: newContent[key]
          });
        }
      }
    } else if (baseContent !== newContent) {
      // 简单值比�?      diff.modified.push({
        field: 'content',
        oldValue: baseContent,
        newValue: newContent
      });
    }

    return diff;
  }

  /**
   * 检测冲�?   */
  private async detectConflicts(
    sourceBranch: MemoryBranch,
    targetBranch: MemoryBranch
  ): Promise<MergeConflict[]> {
    const conflicts: MergeConflict[] = [];
    
    const sourceVersion = this.versions.get(sourceBranch.headVersion)!;
    const targetVersion = this.versions.get(targetBranch.headVersion)!;
    
    // 简化的冲突检�?    if (typeof sourceVersion.content === 'object' && typeof targetVersion.content === 'object') {
      const sourceKeys = Object.keys(sourceVersion.content);
      const targetKeys = Object.keys(targetVersion.content);
      
      for (const key of sourceKeys) {
        if (targetKeys.includes(key) && 
            sourceVersion.content[key] !== targetVersion.content[key]) {
          conflicts.push({
            field: key,
            sourceValue: sourceVersion.content[key],
            targetValue: targetVersion.content[key]
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 合并内容
   */
  private async mergeContent(
    sourceContent: any,
    targetContent: any,
    conflicts?: MergeConflict[],
    resolutions?: Map<string, any>
  ): Promise<any> {
    let mergedContent = { ...targetContent };
    
    if (typeof sourceContent === 'object' && typeof targetContent === 'object') {
      // 合并对象
      for (const [key, value] of Object.entries(sourceContent)) {
        const conflict = conflicts?.find(c => c.field === key);
        
        if (conflict && resolutions?.has(key)) {
          // 使用冲突解决方案
          mergedContent[key] = resolutions.get(key);
        } else if (!conflict) {
          // 无冲突，直接合并
          mergedContent[key] = value;
        }
        // 有冲突但无解决方案，保持目标�?      }
    } else {
      // 简单值合�?      if (resolutions?.has('content')) {
        mergedContent = resolutions.get('content');
      } else {
        mergedContent = sourceContent; // 默认使用源内�?      }
    }
    
    return mergedContent;
  }

  /**
   * 计算内容大小
   */
  private calculateContentSize(content: any): number {
    return JSON.stringify(content).length;
  }

  /**
   * 计算校验�?   */
  private calculateChecksum(content: any): string {
    const contentString = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('memory.updated', async (event) => {
      const { entryId, updates, author } = event.payload;
      
      // 自动创建版本
      await this.createVersion(
        entryId,
        updates,
        'update',
        'Automatic version created on memory update',
        author || 'system'
      );
    });

    this.eventBus.subscribeEvent('memory.deleted', async (event) => {
      const { entryId, author } = event.payload;
      
      // 创建删除版本
      await this.createVersion(
        entryId,
        null,
        'delete',
        'Memory deleted',
        author || 'system'
      );
    });
  }

  /**
   * 创建版本错误
   */
  private createVersionError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const versionError = new Error(`Memory version ${operation} failed: ${message}`) as MJOSError;
    
    versionError.code = 'VersionError';
    versionError.component = 'MemoryVersionControl';
    versionError.context = context;
    versionError.recoverable = true;
    versionError.timestamp = new Date();
    
    return versionError;
  }
}
