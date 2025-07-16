/**
 * Security Manager
 * 安全管理�?- 权限管理、数据加密、访问控�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import * as crypto from 'crypto';

// 权限级别枚举
export enum PermissionLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  EXECUTE = 4,
  ADMIN = 8,
  SUPER_ADMIN = 16
}

// 用户角色枚举
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SYSTEM = 'system'
}

// 安全事件类型
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ENCRYPTION_FAILURE = 'encryption_failure',
  TOKEN_EXPIRED = 'token_expired'
}

// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: PermissionLevel[];
  isActive: boolean;
  lastLogin: Date;
  loginAttempts: number;
  isLocked: boolean;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 访问令牌接口
export interface AccessToken {
  token: string;
  userId: string;
  permissions: PermissionLevel[];
  expiresAt: Date;
  issuedAt: Date;
  refreshToken?: string;
}

// 安全事件接口
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  success: boolean;
  timestamp: Date;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 加密配置
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
}

// 访问控制规则
export interface AccessRule {
  id: string;
  resource: string;
  action: string;
  requiredPermission: PermissionLevel;
  requiredRole?: UserRole;
  conditions?: string[];
  isActive: boolean;
}

/**
 * 加密服务
 */
export class EncryptionService {
  private config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    iterations: 100000
  };

  constructor(private logger: Logger) {}

  /**
   * 生成密钥
   */
  public generateKey(password: string, salt?: Buffer): Buffer {
    const actualSalt = salt || crypto.randomBytes(this.config.saltLength);
    return crypto.pbkdf2Sync(password, actualSalt, this.config.iterations, this.config.keyLength, 'sha256');
  }

  /**
   * 加密数据
   */
  public encrypt(data: string, password: string): {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  } {
    try {
      const salt = crypto.randomBytes(this.config.saltLength);
      const key = this.generateKey(password, salt);
      const iv = crypto.randomBytes(this.config.ivLength);
      
      const cipher = crypto.createCipherGCM(this.config.algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      this.logger.error('Encryption failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * 解密数据
   */
  public decrypt(encryptedData: {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  }, password: string): string {
    try {
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const key = this.generateKey(password, salt);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipherGCM(this.config.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * 生成哈希
   */
  public hash(data: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, this.config.iterations, 64, 'sha256').toString('hex');
    
    return { hash, salt: actualSalt };
  }

  /**
   * 验证哈希
   */
  public verifyHash(data: string, hash: string, salt: string): boolean {
    const computedHash = crypto.pbkdf2Sync(data, salt, this.config.iterations, 64, 'sha256').toString('hex');
    return computedHash === hash;
  }

  /**
   * 生成随机令牌
   */
  public generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * 权限管理�? */
export class PermissionManager {
  private users = new Map<string, User>();
  private accessRules = new Map<string, AccessRule>();
  private rolePermissions = new Map<UserRole, PermissionLevel[]>();

  constructor(private logger: Logger) {
    this.initializeRolePermissions();
  }

  /**
   * 初始化角色权�?   */
  private initializeRolePermissions(): void {
    this.rolePermissions.set(UserRole.GUEST, [PermissionLevel.READ]);
    this.rolePermissions.set(UserRole.USER, [PermissionLevel.READ, PermissionLevel.WRITE]);
    this.rolePermissions.set(UserRole.MODERATOR, [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE]);
    this.rolePermissions.set(UserRole.ADMIN, [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE, PermissionLevel.ADMIN]);
    this.rolePermissions.set(UserRole.SUPER_ADMIN, [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE, PermissionLevel.ADMIN, PermissionLevel.SUPER_ADMIN]);
    this.rolePermissions.set(UserRole.SYSTEM, [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE, PermissionLevel.ADMIN, PermissionLevel.SUPER_ADMIN]);
  }

  /**
   * 创建用户
   */
  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'loginAttempts' | 'isLocked'>): User {
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
      loginAttempts: 0,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 设置角色默认权限
    const rolePermissions = this.rolePermissions.get(user.role) || [];
    user.permissions = [...rolePermissions, ...user.permissions];

    this.users.set(user.id, user);
    this.logger.info('User created', { userId: user.id, username: user.username, role: user.role });

    return user;
  }

  /**
   * 获取用户
   */
  public getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  /**
   * 根据用户名获取用�?   */
  public getUserByUsername(username: string): User | null {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  /**
   * 更新用户
   */
  public updateUser(userId: string, updates: Partial<User>): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    Object.assign(user, updates, { updatedAt: new Date() });
    this.users.set(userId, user);

    this.logger.info('User updated', { userId, updates: Object.keys(updates) });
    return true;
  }

  /**
   * 检查权�?   */
  public hasPermission(userId: string, requiredPermission: PermissionLevel): boolean {
    const user = this.users.get(userId);
    if (!user || !user.isActive || user.isLocked) {
      return false;
    }

    return user.permissions.some(permission => (permission & requiredPermission) === requiredPermission);
  }

  /**
   * 检查角�?   */
  public hasRole(userId: string, requiredRole: UserRole): boolean {
    const user = this.users.get(userId);
    if (!user || !user.isActive || user.isLocked) {
      return false;
    }

    // 系统角色拥有所有权�?    if (user.role === UserRole.SYSTEM) {
      return true;
    }

    // 超级管理员拥有除系统外的所有权�?    if (user.role === UserRole.SUPER_ADMIN && requiredRole !== UserRole.SYSTEM) {
      return true;
    }

    return user.role === requiredRole;
  }

  /**
   * 添加访问规则
   */
  public addAccessRule(rule: Omit<AccessRule, 'id'>): string {
    const ruleId = crypto.randomUUID();
    const accessRule: AccessRule = {
      ...rule,
      id: ruleId
    };

    this.accessRules.set(ruleId, accessRule);
    this.logger.info('Access rule added', { ruleId, resource: rule.resource, action: rule.action });

    return ruleId;
  }

  /**
   * 检查访问权�?   */
  public checkAccess(userId: string, resource: string, action: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.isActive || user.isLocked) {
      return false;
    }

    // 查找匹配的访问规�?    for (const rule of this.accessRules.values()) {
      if (!rule.isActive) continue;
      
      if (rule.resource === resource && rule.action === action) {
        // 检查权限要�?        if (rule.requiredPermission && !this.hasPermission(userId, rule.requiredPermission)) {
          return false;
        }

        // 检查角色要�?        if (rule.requiredRole && !this.hasRole(userId, rule.requiredRole)) {
          return false;
        }

        // 检查额外条�?        if (rule.conditions && !this.evaluateConditions(user, rule.conditions)) {
          return false;
        }

        return true;
      }
    }

    // 如果没有找到匹配的规则，默认拒绝访问
    return false;
  }

  /**
   * 评估条件
   */
  private evaluateConditions(user: User, conditions: string[]): boolean {
    // 简化的条件评估实现
    for (const condition of conditions) {
      if (condition === 'active' && !user.isActive) {
        return false;
      }
      if (condition === 'not_locked' && user.isLocked) {
        return false;
      }
      if (condition.startsWith('role:') && user.role !== condition.substring(5)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 锁定用户
   */
  public lockUser(userId: string, duration?: number): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isLocked = true;
    if (duration) {
      user.lockUntil = new Date(Date.now() + duration);
    }
    user.updatedAt = new Date();

    this.users.set(userId, user);
    this.logger.warn('User locked', { userId, duration });

    return true;
  }

  /**
   * 解锁用户
   */
  public unlockUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isLocked = false;
    user.lockUntil = undefined;
    user.loginAttempts = 0;
    user.updatedAt = new Date();

    this.users.set(userId, user);
    this.logger.info('User unlocked', { userId });

    return true;
  }

  /**
   * 获取用户统计
   */
  public getUserStats(): {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    usersByRole: Record<UserRole, number>;
  } {
    const stats = {
      totalUsers: this.users.size,
      activeUsers: 0,
      lockedUsers: 0,
      usersByRole: {} as Record<UserRole, number>
    };

    // 初始化角色计�?    Object.values(UserRole).forEach(role => {
      stats.usersByRole[role] = 0;
    });

    for (const user of this.users.values()) {
      if (user.isActive) stats.activeUsers++;
      if (user.isLocked) stats.lockedUsers++;
      stats.usersByRole[user.role]++;
    }

    return stats;
  }
}

/**
 * 令牌管理�? */
export class TokenManager {
  private tokens = new Map<string, AccessToken>();
  private refreshTokens = new Map<string, string>(); // refreshToken -> tokenId
  private readonly TOKEN_EXPIRY = 3600000; // 1小时
  private readonly REFRESH_TOKEN_EXPIRY = 604800000; // 7�?
  constructor(
    private encryptionService: EncryptionService,
    private logger: Logger
  ) {
    this.startTokenCleanup();
  }

  /**
   * 生成访问令牌
   */
  public generateAccessToken(userId: string, permissions: PermissionLevel[]): AccessToken {
    const token = this.encryptionService.generateToken(32);
    const refreshToken = this.encryptionService.generateToken(32);

    const accessToken: AccessToken = {
      token,
      userId,
      permissions,
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY),
      issuedAt: new Date(),
      refreshToken
    };

    this.tokens.set(token, accessToken);
    this.refreshTokens.set(refreshToken, token);

    this.logger.info('Access token generated', { userId, expiresAt: accessToken.expiresAt });
    return accessToken;
  }

  /**
   * 验证令牌
   */
  public validateToken(token: string): AccessToken | null {
    const accessToken = this.tokens.get(token);
    if (!accessToken) {
      return null;
    }

    if (accessToken.expiresAt < new Date()) {
      this.revokeToken(token);
      return null;
    }

    return accessToken;
  }

  /**
   * 刷新令牌
   */
  public refreshToken(refreshToken: string): AccessToken | null {
    const tokenId = this.refreshTokens.get(refreshToken);
    if (!tokenId) {
      return null;
    }

    const oldToken = this.tokens.get(tokenId);
    if (!oldToken) {
      return null;
    }

    // 撤销旧令�?    this.revokeToken(tokenId);

    // 生成新令�?    return this.generateAccessToken(oldToken.userId, oldToken.permissions);
  }

  /**
   * 撤销令牌
   */
  public revokeToken(token: string): boolean {
    const accessToken = this.tokens.get(token);
    if (!accessToken) {
      return false;
    }

    this.tokens.delete(token);
    if (accessToken.refreshToken) {
      this.refreshTokens.delete(accessToken.refreshToken);
    }

    this.logger.info('Token revoked', { userId: accessToken.userId });
    return true;
  }

  /**
   * 撤销用户所有令�?   */
  public revokeUserTokens(userId: string): number {
    let revokedCount = 0;

    for (const [token, accessToken] of this.tokens) {
      if (accessToken.userId === userId) {
        this.revokeToken(token);
        revokedCount++;
      }
    }

    this.logger.info('User tokens revoked', { userId, count: revokedCount });
    return revokedCount;
  }

  /**
   * 启动令牌清理
   */
  private startTokenCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 300000); // �?分钟清理一�?  }

  /**
   * 清理过期令牌
   */
  private cleanupExpiredTokens(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, accessToken] of this.tokens) {
      if (accessToken.expiresAt < now) {
        this.revokeToken(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Expired tokens cleaned', { count: cleanedCount });
    }
  }

  /**
   * 获取令牌统计
   */
  public getTokenStats(): {
    activeTokens: number;
    expiredTokens: number;
    tokensPerUser: Record<string, number>;
  } {
    const now = new Date();
    const stats = {
      activeTokens: 0,
      expiredTokens: 0,
      tokensPerUser: {} as Record<string, number>
    };

    for (const accessToken of this.tokens.values()) {
      if (accessToken.expiresAt > now) {
        stats.activeTokens++;
      } else {
        stats.expiredTokens++;
      }

      stats.tokensPerUser[accessToken.userId] = (stats.tokensPerUser[accessToken.userId] || 0) + 1;
    }

    return stats;
  }
}

/**
 * 安全事件监控�? */
export class SecurityEventMonitor {
  private events: SecurityEvent[] = [];
  private suspiciousActivities = new Map<string, number>(); // userId -> count
  private ipBlacklist = new Set<string>();
  private readonly MAX_EVENTS = 10000;
  private readonly SUSPICIOUS_THRESHOLD = 5;

  constructor(private logger: Logger, private eventBus: EventBus) {
    this.startThreatDetection();
  }

  /**
   * 记录安全事件
   */
  public logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // 限制事件历史大小
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // 分析威胁
    this.analyzeThreat(securityEvent);

    this.logger.info('Security event logged', {
      eventId: securityEvent.id,
      type: securityEvent.type,
      userId: securityEvent.userId,
      riskLevel: securityEvent.riskLevel
    });

    this.eventBus.publishEvent('security.event_logged', securityEvent, 'SecurityEventMonitor');
  }

  /**
   * 分析威胁
   */
  private analyzeThreat(event: SecurityEvent): void {
    // 检查失败的登录尝试
    if (event.type === SecurityEventType.LOGIN_FAILURE && event.userId) {
      const count = this.suspiciousActivities.get(event.userId) || 0;
      this.suspiciousActivities.set(event.userId, count + 1);

      if (count + 1 >= this.SUSPICIOUS_THRESHOLD) {
        this.handleSuspiciousActivity(event.userId, 'multiple_login_failures');
      }
    }

    // 检查未授权访问
    if (event.type === SecurityEventType.UNAUTHORIZED_ACCESS) {
      this.ipBlacklist.add(event.ipAddress);
      this.handleSuspiciousActivity(event.userId || 'unknown', 'unauthorized_access');
    }

    // 检查数据泄露尝�?    if (event.type === SecurityEventType.DATA_BREACH_ATTEMPT) {
      this.handleCriticalThreat(event);
    }
  }

  /**
   * 处理可疑活动
   */
  private handleSuspiciousActivity(userId: string, activityType: string): void {
    this.logger.warn('Suspicious activity detected', { userId, activityType });

    this.eventBus.publishEvent('security.suspicious_activity', {
      userId,
      activityType,
      timestamp: new Date()
    }, 'SecurityEventMonitor');
  }

  /**
   * 处理关键威胁
   */
  private handleCriticalThreat(event: SecurityEvent): void {
    this.logger.error('Critical security threat detected', {
      eventId: event.id,
      type: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress
    });

    this.eventBus.publishEvent('security.critical_threat', {
      event,
      timestamp: new Date()
    }, 'SecurityEventMonitor');

    // 立即阻止IP
    this.ipBlacklist.add(event.ipAddress);
  }

  /**
   * 启动威胁检�?   */
  private startThreatDetection(): void {
    setInterval(() => {
      this.performThreatAnalysis();
    }, 60000); // 每分钟分析一�?  }

  /**
   * 执行威胁分析
   */
  private performThreatAnalysis(): void {
    const recentEvents = this.events.filter(event =>
      Date.now() - event.timestamp.getTime() < 300000 // 5分钟内的事件
    );

    // 分析异常模式
    this.analyzeAnomalousPatterns(recentEvents);

    // 清理过期的可疑活动记�?    this.cleanupSuspiciousActivities();
  }

  /**
   * 分析异常模式
   */
  private analyzeAnomalousPatterns(events: SecurityEvent[]): void {
    // 检查短时间内的大量失败登录
    const loginFailures = events.filter(e => e.type === SecurityEventType.LOGIN_FAILURE);
    if (loginFailures.length > 10) {
      this.logger.warn('High volume of login failures detected', {
        count: loginFailures.length,
        timeWindow: '5 minutes'
      });
    }

    // 检查来自同一IP的多次未授权访问
    const ipCounts = new Map<string, number>();
    events.filter(e => e.type === SecurityEventType.UNAUTHORIZED_ACCESS)
          .forEach(e => {
            ipCounts.set(e.ipAddress, (ipCounts.get(e.ipAddress) || 0) + 1);
          });

    for (const [ip, count] of ipCounts) {
      if (count > 3) {
        this.ipBlacklist.add(ip);
        this.logger.warn('IP blacklisted due to repeated unauthorized access', { ip, count });
      }
    }
  }

  /**
   * 清理可疑活动记录
   */
  private cleanupSuspiciousActivities(): void {
    // 简化实现：每小时重置计数器
    if (Date.now() % 3600000 < 60000) { // 每小时的第一分钟
      this.suspiciousActivities.clear();
    }
  }

  /**
   * 检查IP是否被阻�?   */
  public isIpBlocked(ipAddress: string): boolean {
    return this.ipBlacklist.has(ipAddress);
  }

  /**
   * 获取安全统计
   */
  public getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsByRiskLevel: Record<string, number>;
    suspiciousUsers: number;
    blockedIps: number;
    recentThreats: SecurityEvent[];
  } {
    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsByRiskLevel = { low: 0, medium: 0, high: 0, critical: 0 };

    // 初始化事件类型计�?    Object.values(SecurityEventType).forEach(type => {
      eventsByType[type] = 0;
    });

    // 统计事件
    for (const event of this.events) {
      eventsByType[event.type]++;
      eventsByRiskLevel[event.riskLevel]++;
    }

    // 获取最近的高风险事�?    const recentThreats = this.events
      .filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical')
      .slice(-10);

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByRiskLevel,
      suspiciousUsers: this.suspiciousActivities.size,
      blockedIps: this.ipBlacklist.size,
      recentThreats
    };
  }
}

/**
 * 安全管理器主�? */
export class SecurityManager {
  private encryptionService: EncryptionService;
  private permissionManager: PermissionManager;
  private tokenManager: TokenManager;
  private eventMonitor: SecurityEventMonitor;

  constructor(private logger: Logger, private eventBus: EventBus) {
    this.encryptionService = new EncryptionService(logger);
    this.permissionManager = new PermissionManager(logger);
    this.tokenManager = new TokenManager(this.encryptionService, logger);
    this.eventMonitor = new SecurityEventMonitor(logger, eventBus);

    this.setupSecurityPolicies();
    this.logger.info('Security Manager initialized');
  }

  /**
   * 获取加密服务
   */
  public getEncryptionService(): EncryptionService {
    return this.encryptionService;
  }

  /**
   * 获取权限管理�?   */
  public getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  /**
   * 获取令牌管理�?   */
  public getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * 获取事件监控�?   */
  public getEventMonitor(): SecurityEventMonitor {
    return this.eventMonitor;
  }

  /**
   * 用户认证
   */
  public async authenticateUser(username: string, password: string, ipAddress: string, userAgent: string): Promise<{
    success: boolean;
    user?: User;
    token?: AccessToken;
    message: string;
  }> {
    // 检查IP是否被阻�?    if (this.eventMonitor.isIpBlocked(ipAddress)) {
      this.eventMonitor.logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        ipAddress,
        userAgent,
        resource: 'authentication',
        action: 'login',
        success: false,
        details: { reason: 'ip_blocked' },
        riskLevel: 'high'
      });

      return {
        success: false,
        message: 'Access denied from this IP address'
      };
    }

    const user = this.permissionManager.getUserByUsername(username);
    if (!user) {
      this.eventMonitor.logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        ipAddress,
        userAgent,
        resource: 'authentication',
        action: 'login',
        success: false,
        details: { reason: 'user_not_found', username },
        riskLevel: 'medium'
      });

      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // 检查用户是否被锁定
    if (user.isLocked) {
      if (user.lockUntil && user.lockUntil > new Date()) {
        this.eventMonitor.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILURE,
          userId: user.id,
          ipAddress,
          userAgent,
          resource: 'authentication',
          action: 'login',
          success: false,
          details: { reason: 'user_locked', lockUntil: user.lockUntil },
          riskLevel: 'medium'
        });

        return {
          success: false,
          message: 'Account is temporarily locked'
        };
      } else {
        // 锁定时间已过，解锁用�?        this.permissionManager.unlockUser(user.id);
      }
    }

    // 验证密码（这里应该使用实际的密码验证逻辑�?    const isValidPassword = this.validatePassword(password, user);

    if (!isValidPassword) {
      // 增加登录失败次数
      user.loginAttempts++;

      // 如果失败次数过多，锁定账�?      if (user.loginAttempts >= 5) {
        this.permissionManager.lockUser(user.id, 1800000); // 锁定30分钟
      }

      this.permissionManager.updateUser(user.id, { loginAttempts: user.loginAttempts });

      this.eventMonitor.logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        userId: user.id,
        ipAddress,
        userAgent,
        resource: 'authentication',
        action: 'login',
        success: false,
        details: { reason: 'invalid_password', attempts: user.loginAttempts },
        riskLevel: user.loginAttempts >= 3 ? 'high' : 'medium'
      });

      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // 登录成功
    this.permissionManager.updateUser(user.id, {
      lastLogin: new Date(),
      loginAttempts: 0
    });

    const token = this.tokenManager.generateAccessToken(user.id, user.permissions);

    this.eventMonitor.logSecurityEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId: user.id,
      ipAddress,
      userAgent,
      resource: 'authentication',
      action: 'login',
      success: true,
      details: { username: user.username },
      riskLevel: 'low'
    });

    return {
      success: true,
      user,
      token,
      message: 'Authentication successful'
    };
  }

  /**
   * 验证密码
   */
  private validatePassword(password: string, user: User): boolean {
    // 简化实现，实际应该使用哈希验证
    // 这里假设用户对象中存储了密码哈希
    return true; // 模拟验证成功
  }

  /**
   * 设置安全策略
   */
  private setupSecurityPolicies(): void {
    // 添加基本访问规则
    this.permissionManager.addAccessRule({
      resource: 'system',
      action: 'read',
      requiredPermission: PermissionLevel.READ,
      isActive: true
    });

    this.permissionManager.addAccessRule({
      resource: 'system',
      action: 'write',
      requiredPermission: PermissionLevel.WRITE,
      isActive: true
    });

    this.permissionManager.addAccessRule({
      resource: 'admin',
      action: '*',
      requiredPermission: PermissionLevel.ADMIN,
      requiredRole: UserRole.ADMIN,
      isActive: true
    });

    // 监听安全事件
    this.eventBus.subscribe('security.critical_threat', (data) => {
      this.handleCriticalThreat(data.event);
    });
  }

  /**
   * 处理关键威胁
   */
  private handleCriticalThreat(event: SecurityEvent): void {
    this.logger.error('Handling critical security threat', { eventId: event.id });

    // 如果有用户ID，立即锁定用�?    if (event.userId) {
      this.permissionManager.lockUser(event.userId);
      this.tokenManager.revokeUserTokens(event.userId);
    }

    // 触发系统安全响应
    this.eventBus.publishEvent('system.security_lockdown', {
      reason: 'critical_threat',
      eventId: event.id
    }, 'SecurityManager');
  }

  /**
   * 获取安全报告
   */
  public getSecurityReport(): {
    userStats: any;
    tokenStats: any;
    securityStats: any;
    recommendations: string[];
  } {
    const userStats = this.permissionManager.getUserStats();
    const tokenStats = this.tokenManager.getTokenStats();
    const securityStats = this.eventMonitor.getSecurityStats();

    const recommendations: string[] = [];

    // 基于统计生成建议
    if (userStats.lockedUsers > 0) {
      recommendations.push('Review locked user accounts and consider security training');
    }

    if (securityStats.blockedIps > 0) {
      recommendations.push('Monitor blocked IP addresses for potential threats');
    }

    if (securityStats.eventsByRiskLevel.high > 10) {
      recommendations.push('Investigate high-risk security events');
    }

    if (tokenStats.expiredTokens > tokenStats.activeTokens * 0.5) {
      recommendations.push('Consider adjusting token expiration policies');
    }

    return {
      userStats,
      tokenStats,
      securityStats,
      recommendations
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.logger.info('Security Manager destroyed');
  }
}
