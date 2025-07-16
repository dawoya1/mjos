/**
 * MPEOAS Collaboration State Tracker
 * Magic Process Engine of AI State 协作状态追踪器
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';

export interface CollaborationSession {
  id: string;
  name: string;
  participants: string[];
  initiator: string;
  startTime: Date;
  endTime?: Date;
  status: CollaborationStatus;
  type: CollaborationType;
  context: StateContext;
  metadata: {
    objective: string;
    expectedDuration: number;
    priority: number;
    tags: string[];
  };
}

export type CollaborationStatus = 
  | 'initiated' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

export type CollaborationType = 
  | 'brainstorming' 
  | 'problem-solving' 
  | 'decision-making' 
  | 'knowledge-sharing' 
  | 'code-review' 
  | 'planning';

export interface CollaborationEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: CollaborationEventType;
  participant: string;
  data: any;
  impact: CollaborationImpact;
}

export type CollaborationEventType = 
  | 'join' 
  | 'leave' 
  | 'contribute' 
  | 'question' 
  | 'decision' 
  | 'conflict' 
  | 'resolution';

export interface CollaborationImpact {
  productivity: number; // -100 to 100
  quality: number; // 0 to 100
  engagement: number; // 0 to 100
  consensus: number; // 0 to 100
}

export interface CollaborationMetrics {
  sessionId: string;
  duration: number;
  participantCount: number;
  eventCount: number;
  averageProductivity: number;
  averageQuality: number;
  averageEngagement: number;
  consensusLevel: number;
  conflictCount: number;
  resolutionRate: number;
}

export interface CollaborationPattern {
  id: string;
  name: string;
  description: string;
  participants: string[];
  frequency: number;
  successRate: number;
  averageDuration: number;
  commonOutcomes: string[];
  recommendations: string[];
}

/**
 * 协作状态追踪器�? * 追踪和分析团队协作过程和效果
 */
export class CollaborationStateTracker {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private activeSessions = new Map<string, CollaborationSession>();
  private sessionHistory: CollaborationSession[] = [];
  private collaborationEvents: CollaborationEvent[] = [];
  private patterns: CollaborationPattern[] = [];

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
    
    this.logger.info('Collaboration State Tracker initialized');
  }

  /**
   * 开始协作会�?   */
  public async startCollaboration(
    name: string,
    participants: string[],
    initiator: string,
    type: CollaborationType,
    context: StateContext,
    metadata: {
      objective: string;
      expectedDuration: number;
      priority: number;
      tags: string[];
    }
  ): Promise<string> {
    try {
      const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const session: CollaborationSession = {
        id: sessionId,
        name,
        participants,
        initiator,
        startTime: new Date(),
        status: 'initiated',
        type,
        context,
        metadata
      };

      this.activeSessions.set(sessionId, session);

      this.logger.info('Collaboration session started', {
        sessionId,
        name,
        participants,
        type,
        initiator
      });

      // 记录开始事�?      await this.recordEvent(sessionId, 'join', initiator, {
        action: 'start_session',
        participants
      });

      // 发布协作开始事�?      this.eventBus.publishEvent('collaboration.started', {
        sessionId,
        session,
        participants
      }, 'CollaborationStateTracker');

      return sessionId;

    } catch (error) {
      const collaborationError = this.createCollaborationError(
        error,
        'startCollaboration',
        { name, participants, initiator }
      );
      this.logger.error('Failed to start collaboration', { error: collaborationError });
      throw collaborationError;
    }
  }

  /**
   * 结束协作会话
   */
  public async endCollaboration(
    sessionId: string,
    status: 'completed' | 'cancelled' | 'failed',
    outcome?: any
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Collaboration session not found: ${sessionId}`);
      }

      session.endTime = new Date();
      session.status = status;

      // 移动到历史记�?      this.sessionHistory.push(session);
      this.activeSessions.delete(sessionId);

      this.logger.info('Collaboration session ended', {
        sessionId,
        status,
        duration: session.endTime.getTime() - session.startTime.getTime(),
        participants: session.participants.length
      });

      // 记录结束事件
      await this.recordEvent(sessionId, 'leave', session.initiator, {
        action: 'end_session',
        status,
        outcome
      });

      // 分析协作模式
      await this.analyzeCollaborationPattern(session);

      // 发布协作结束事件
      this.eventBus.publishEvent('collaboration.ended', {
        sessionId,
        session,
        status,
        outcome
      }, 'CollaborationStateTracker');

      return true;

    } catch (error) {
      this.logger.error('Failed to end collaboration', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 记录协作事件
   */
  public async recordEvent(
    sessionId: string,
    type: CollaborationEventType,
    participant: string,
    data: any
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        this.logger.warn('Recording event for unknown session', { sessionId });
        return;
      }

      const event: CollaborationEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        timestamp: new Date(),
        type,
        participant,
        data,
        impact: this.calculateEventImpact(type, data, session)
      };

      this.collaborationEvents.push(event);

      this.logger.debug('Collaboration event recorded', {
        sessionId,
        type,
        participant,
        impact: event.impact
      });

      // 发布事件记录
      this.eventBus.publishEvent('collaboration.event_recorded', {
        event,
        session
      }, 'CollaborationStateTracker');

    } catch (error) {
      this.logger.error('Failed to record collaboration event', {
        sessionId,
        type,
        participant,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取协作会话状�?   */
  public getSessionStatus(sessionId: string): CollaborationSession | undefined {
    return this.activeSessions.get(sessionId) || 
           this.sessionHistory.find(s => s.id === sessionId);
  }

  /**
   * 获取活跃协作会话
   */
  public getActiveSessions(): CollaborationSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * 获取协作指标
   */
  public getCollaborationMetrics(sessionId: string): CollaborationMetrics | null {
    const session = this.getSessionStatus(sessionId);
    if (!session) return null;

    const events = this.collaborationEvents.filter(e => e.sessionId === sessionId);
    const duration = session.endTime ? 
      session.endTime.getTime() - session.startTime.getTime() : 
      Date.now() - session.startTime.getTime();

    const impacts = events.map(e => e.impact);
    const conflictEvents = events.filter(e => e.type === 'conflict');
    const resolutionEvents = events.filter(e => e.type === 'resolution');

    return {
      sessionId,
      duration,
      participantCount: session.participants.length,
      eventCount: events.length,
      averageProductivity: this.calculateAverage(impacts.map(i => i.productivity)),
      averageQuality: this.calculateAverage(impacts.map(i => i.quality)),
      averageEngagement: this.calculateAverage(impacts.map(i => i.engagement)),
      consensusLevel: this.calculateAverage(impacts.map(i => i.consensus)),
      conflictCount: conflictEvents.length,
      resolutionRate: conflictEvents.length > 0 ? 
        (resolutionEvents.length / conflictEvents.length) * 100 : 100
    };
  }

  /**
   * 获取协作模式
   */
  public getCollaborationPatterns(): CollaborationPattern[] {
    return [...this.patterns];
  }

  /**
   * 分析协作效果
   */
  public analyzeCollaborationEffectiveness(): {
    totalSessions: number;
    averageSuccessRate: number;
    mostEffectivePatterns: CollaborationPattern[];
    improvementAreas: string[];
    recommendations: string[];
  } {
    const totalSessions = this.sessionHistory.length;
    const successfulSessions = this.sessionHistory.filter(s => s.status === 'completed').length;
    const averageSuccessRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;

    const mostEffectivePatterns = this.patterns
      .filter(p => p.successRate > 80)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    const improvementAreas = this.identifyImprovementAreas();
    const recommendations = this.generateRecommendations();

    return {
      totalSessions,
      averageSuccessRate,
      mostEffectivePatterns,
      improvementAreas,
      recommendations
    };
  }

  /**
   * 预测协作结果
   */
  public predictCollaborationOutcome(
    participants: string[],
    type: CollaborationType,
    context: any
  ): {
    successProbability: number;
    expectedDuration: number;
    riskFactors: string[];
    recommendations: string[];
  } {
    // 基于历史数据预测
    const similarSessions = this.sessionHistory.filter(s => 
      s.type === type && 
      this.calculateParticipantOverlap(s.participants, participants) > 0.5
    );

    const successRate = similarSessions.length > 0 ? 
      (similarSessions.filter(s => s.status === 'completed').length / similarSessions.length) * 100 : 70;

    const avgDuration = similarSessions.length > 0 ?
      similarSessions.reduce((sum, s) => {
        const duration = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0;
        return sum + duration;
      }, 0) / similarSessions.length : 3600000; // 1 hour default

    const riskFactors = this.identifyRiskFactors(participants, type, context);
    const recommendations = this.generateCollaborationRecommendations(participants, type);

    return {
      successProbability: successRate,
      expectedDuration: avgDuration,
      riskFactors,
      recommendations
    };
  }

  /**
   * 计算事件影响
   */
  private calculateEventImpact(
    type: CollaborationEventType,
    data: any,
    session: CollaborationSession
  ): CollaborationImpact {
    const baseImpact: CollaborationImpact = {
      productivity: 0,
      quality: 0,
      engagement: 0,
      consensus: 0
    };

    switch (type) {
      case 'join':
        return {
          productivity: 10,
          quality: 5,
          engagement: 20,
          consensus: 0
        };
      
      case 'contribute':
        return {
          productivity: 15,
          quality: 10,
          engagement: 10,
          consensus: 5
        };
      
      case 'question':
        return {
          productivity: -5,
          quality: 15,
          engagement: 10,
          consensus: -5
        };
      
      case 'decision':
        return {
          productivity: 20,
          quality: 15,
          engagement: 5,
          consensus: 25
        };
      
      case 'conflict':
        return {
          productivity: -20,
          quality: -10,
          engagement: 5,
          consensus: -30
        };
      
      case 'resolution':
        return {
          productivity: 25,
          quality: 20,
          engagement: 15,
          consensus: 40
        };
      
      default:
        return baseImpact;
    }
  }

  /**
   * 分析协作模式
   */
  private async analyzeCollaborationPattern(session: CollaborationSession): Promise<void> {
    const participantKey = session.participants.sort().join(',');
    const existingPattern = this.patterns.find(p => 
      p.participants.sort().join(',') === participantKey
    );

    if (existingPattern) {
      // 更新现有模式
      existingPattern.frequency += 1;
      const isSuccess = session.status === 'completed';
      existingPattern.successRate = (
        (existingPattern.successRate * (existingPattern.frequency - 1) + (isSuccess ? 100 : 0)) / 
        existingPattern.frequency
      );
      
      const duration = session.endTime ? 
        session.endTime.getTime() - session.startTime.getTime() : 0;
      existingPattern.averageDuration = (
        (existingPattern.averageDuration * (existingPattern.frequency - 1) + duration) / 
        existingPattern.frequency
      );
    } else {
      // 创建新模�?      const newPattern: CollaborationPattern = {
        id: `pattern-${Date.now()}`,
        name: `${session.type} with ${session.participants.join(', ')}`,
        description: `Collaboration pattern for ${session.type}`,
        participants: session.participants,
        frequency: 1,
        successRate: session.status === 'completed' ? 100 : 0,
        averageDuration: session.endTime ? 
          session.endTime.getTime() - session.startTime.getTime() : 0,
        commonOutcomes: [],
        recommendations: []
      };
      
      this.patterns.push(newPattern);
    }
  }

  /**
   * 计算平均�?   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * 计算参与者重叠度
   */
  private calculateParticipantOverlap(participants1: string[], participants2: string[]): number {
    const set1 = new Set(participants1);
    const set2 = new Set(participants2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * 识别改进领域
   */
  private identifyImprovementAreas(): string[] {
    const areas: string[] = [];
    
    // 分析失败会话
    const failedSessions = this.sessionHistory.filter(s => s.status === 'failed' || s.status === 'cancelled');
    if (failedSessions.length > this.sessionHistory.length * 0.2) {
      areas.push('High failure rate - need better preparation and conflict resolution');
    }
    
    // 分析协作时长
    const longSessions = this.sessionHistory.filter(s => {
      const duration = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0;
      return duration > s.metadata.expectedDuration * 1.5;
    });
    if (longSessions.length > this.sessionHistory.length * 0.3) {
      areas.push('Sessions often exceed expected duration - improve time management');
    }
    
    return areas;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(): string[] {
    return [
      'Establish clear objectives before starting collaboration',
      'Use structured collaboration formats for complex decisions',
      'Implement regular check-ins during long sessions',
      'Develop conflict resolution protocols',
      'Encourage equal participation from all members'
    ];
  }

  /**
   * 识别风险因素
   */
  private identifyRiskFactors(
    participants: string[],
    type: CollaborationType,
    context: any
  ): string[] {
    const risks: string[] = [];
    
    if (participants.length > 5) {
      risks.push('Large group size may reduce efficiency');
    }
    
    if (type === 'decision-making' && participants.length % 2 === 0) {
      risks.push('Even number of participants may lead to deadlocks');
    }
    
    return risks;
  }

  /**
   * 生成协作建议
   */
  private generateCollaborationRecommendations(
    participants: string[],
    type: CollaborationType
  ): string[] {
    const recommendations: string[] = [];
    
    if (type === 'brainstorming') {
      recommendations.push('Use divergent thinking techniques');
      recommendations.push('Defer judgment during idea generation');
    }
    
    if (participants.length > 3) {
      recommendations.push('Assign a facilitator to manage the session');
    }
    
    return recommendations;
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听角色协作事件
    this.eventBus.subscribeEvent('role.collaboration_requested', async (event) => {
      const { fromRole, toRole, objective } = event.payload;
      
      await this.startCollaboration(
        `${fromRole} - ${toRole} Collaboration`,
        [fromRole, toRole],
        fromRole,
        'problem-solving',
        event.payload.context,
        {
          objective,
          expectedDuration: 1800000, // 30 minutes
          priority: 5,
          tags: ['role-collaboration']
        }
      );
    });

    // 监听团队协作事件
    this.eventBus.subscribeEvent('team.collaboration_started', async (event) => {
      const { participants, type, objective } = event.payload;
      
      await this.startCollaboration(
        'Team Collaboration',
        participants,
        participants[0],
        type,
        event.payload.context,
        {
          objective,
          expectedDuration: 3600000, // 1 hour
          priority: 8,
          tags: ['team-collaboration']
        }
      );
    });

    // 监听任务完成事件
    this.eventBus.subscribeEvent('task.completed', async (event) => {
      const { roleId, collaborationSessionId } = event.payload;
      
      if (collaborationSessionId) {
        await this.recordEvent(
          collaborationSessionId,
          'contribute',
          roleId,
          { action: 'task_completed', ...event.payload }
        );
      }
    });
  }

  /**
   * 创建协作错误
   */
  private createCollaborationError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const collaborationError = new Error(`Collaboration ${operation} failed: ${message}`) as MJOSError;
    
    collaborationError.code = 'CollaborationError';
    collaborationError.component = 'CollaborationStateTracker';
    collaborationError.context = context;
    collaborationError.recoverable = true;
    collaborationError.timestamp = new Date();
    
    return collaborationError;
  }
}
