/**
 * MJOS Security System
 * 魔剑工作室操作系统安全系统
 */

import { EventEmitter } from 'events';
import { createCipher, createDecipher, randomBytes, pbkdf2Sync } from 'crypto';
import { Logger } from '../core/index';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
}

export interface AuthToken {
  token: string;
  userId: string;
  type: 'access' | 'refresh' | 'api';
  expiresAt: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface SecurityManagerOptions {
  enableAuditLog?: boolean;
  enableEncryption?: boolean;
  encryptionAlgorithm?: string;
  tokenExpiration?: number;
  refreshTokenExpiration?: number;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  passwordMinLength?: number;
  passwordRequireSpecialChars?: boolean;
}

export class SecurityManager extends EventEmitter {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private auditLogs: SecurityAuditLog[] = [];
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private logger: Logger;
  private options: SecurityManagerOptions;
  private encryptionKey: string;

  constructor(options: SecurityManagerOptions = {}) {
    super();
    
    this.options = {
      enableAuditLog: options.enableAuditLog !== false,
      enableEncryption: options.enableEncryption !== false,
      encryptionAlgorithm: options.encryptionAlgorithm || 'aes-256-cbc',
      tokenExpiration: options.tokenExpiration || 3600000, // 1 hour
      refreshTokenExpiration: options.refreshTokenExpiration || 604800000, // 7 days
      maxLoginAttempts: options.maxLoginAttempts || 5,
      lockoutDuration: options.lockoutDuration || 900000, // 15 minutes
      passwordMinLength: options.passwordMinLength || 8,
      passwordRequireSpecialChars: options.passwordRequireSpecialChars !== false,
      ...options
    };

    this.logger = new Logger('SecurityManager');
    this.encryptionKey = this.generateEncryptionKey();
    
    this.initializeDefaultRolesAndPermissions();
  }

  private initializeDefaultRolesAndPermissions(): void {
    // Default permissions
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      { name: 'read', resource: '*', action: 'read', description: 'Read access to all resources', isActive: true },
      { name: 'write', resource: '*', action: 'write', description: 'Write access to all resources', isActive: true },
      { name: 'delete', resource: '*', action: 'delete', description: 'Delete access to all resources', isActive: true },
      { name: 'admin', resource: '*', action: '*', description: 'Full administrative access', isActive: true },
      { name: 'memory.read', resource: 'memory', action: 'read', description: 'Read memory data', isActive: true },
      { name: 'memory.write', resource: 'memory', action: 'write', description: 'Write memory data', isActive: true },
      { name: 'knowledge.read', resource: 'knowledge', action: 'read', description: 'Read knowledge data', isActive: true },
      { name: 'knowledge.write', resource: 'knowledge', action: 'write', description: 'Write knowledge data', isActive: true },
      { name: 'team.read', resource: 'team', action: 'read', description: 'Read team data', isActive: true },
      { name: 'team.manage', resource: 'team', action: 'manage', description: 'Manage team members and tasks', isActive: true }
    ];

    defaultPermissions.forEach(perm => {
      const permission: Permission = {
        id: this.generateId('perm'),
        ...perm
      };
      this.permissions.set(permission.id, permission);
    });

    // Default roles
    const defaultRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['admin'],
        isActive: true
      },
      {
        name: 'user',
        description: 'Regular user with basic access',
        permissions: ['read', 'memory.read', 'knowledge.read', 'team.read'],
        isActive: true
      },
      {
        name: 'developer',
        description: 'Developer with extended access',
        permissions: ['read', 'write', 'memory.read', 'memory.write', 'knowledge.read', 'knowledge.write', 'team.read'],
        isActive: true
      },
      {
        name: 'manager',
        description: 'Team manager with management access',
        permissions: ['read', 'write', 'memory.read', 'knowledge.read', 'team.read', 'team.manage'],
        isActive: true
      }
    ];

    defaultRoles.forEach(role => {
      const roleObj: Role = {
        id: this.generateId('role'),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...role
      };
      this.roles.set(roleObj.id, roleObj);
    });

    this.logger.info('Default roles and permissions initialized');
  }

  // User Management
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    roles?: string[];
    permissions?: string[];
  }): Promise<string> {
    // Validate password
    if (!this.validatePassword(userData.password)) {
      throw new Error('Password does not meet security requirements');
    }

    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(
      u => u.username === userData.username || u.email === userData.email
    );
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    const userId = this.generateId('user');
    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(userData.password, salt);

    const user: User = {
      id: userId,
      username: userData.username,
      email: userData.email,
      passwordHash,
      salt,
      roles: userData.roles || ['user'],
      permissions: userData.permissions || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    this.users.set(userId, user);
    
    this.auditLog('user.created', 'user', 'success', userId, {
      username: userData.username,
      email: userData.email
    });

    this.emit('user:created', user);
    this.logger.info(`User created: ${userData.username}`);

    return userId;
  }

  async authenticateUser(username: string, password: string, ipAddress?: string): Promise<AuthToken | null> {
    // Check login attempts
    const attemptKey = `${username}:${ipAddress || 'unknown'}`;
    const attempts = this.loginAttempts.get(attemptKey);
    
    if (attempts && attempts.count >= this.options.maxLoginAttempts!) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      if (timeSinceLastAttempt < this.options.lockoutDuration!) {
        this.auditLog('user.login', 'auth', 'blocked', undefined, {
          username,
          reason: 'account_locked',
          ipAddress
        });
        throw new Error('Account temporarily locked due to too many failed attempts');
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.delete(attemptKey);
      }
    }

    const user = Array.from(this.users.values()).find(u => u.username === username);
    
    if (!user || !user.isActive) {
      this.recordFailedLogin(attemptKey);
      this.auditLog('user.login', 'auth', 'failure', user?.id, {
        username,
        reason: 'user_not_found',
        ipAddress
      });
      return null;
    }

    const isValidPassword = this.verifyPassword(password, user.passwordHash, user.salt);
    
    if (!isValidPassword) {
      this.recordFailedLogin(attemptKey);
      this.auditLog('user.login', 'auth', 'failure', user.id, {
        username,
        reason: 'invalid_password',
        ipAddress
      });
      return null;
    }

    // Clear failed attempts on successful login
    this.loginAttempts.delete(attemptKey);

    // Update user last login
    user.lastLogin = new Date();
    user.updatedAt = new Date();

    // Generate access token
    const token = this.generateToken();
    const authToken: AuthToken = {
      token,
      userId: user.id,
      type: 'access',
      expiresAt: new Date(Date.now() + this.options.tokenExpiration!),
      createdAt: new Date(),
      metadata: { ipAddress }
    };

    this.tokens.set(token, authToken);

    this.auditLog('user.login', 'auth', 'success', user.id, {
      username,
      ipAddress
    });

    this.emit('user:authenticated', { user, token: authToken });
    this.logger.info(`User authenticated: ${username}`);

    return authToken;
  }

  async validateToken(token: string): Promise<User | null> {
    const authToken = this.tokens.get(token);
    
    if (!authToken) {
      return null;
    }

    // Check if token is expired
    if (authToken.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }

    const user = this.users.get(authToken.userId);
    
    if (!user || !user.isActive) {
      this.tokens.delete(token);
      return null;
    }

    return user;
  }

  async revokeToken(token: string): Promise<boolean> {
    const authToken = this.tokens.get(token);
    
    if (authToken) {
      this.tokens.delete(token);
      this.auditLog('token.revoked', 'auth', 'success', authToken.userId, { token });
      this.emit('token:revoked', authToken);
      return true;
    }

    return false;
  }

  // Authorization
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = this.users.get(userId);
    
    if (!user || !user.isActive) {
      return false;
    }

    // Check direct permissions
    for (const permissionId of user.permissions) {
      const permission = this.permissions.get(permissionId);
      if (permission && this.matchesPermission(permission, resource, action)) {
        return true;
      }
    }

    // Check role-based permissions
    for (const roleId of user.roles) {
      const role = this.roles.get(roleId);
      if (role && role.isActive) {
        for (const permissionName of role.permissions) {
          // Find permission by name
          const permission = Array.from(this.permissions.values()).find(p => p.name === permissionName);
          if (permission && this.matchesPermission(permission, resource, action)) {
            return true;
          }
        }
      }
    }

    this.auditLog('permission.check', resource, 'failure', userId, {
      resource,
      action,
      reason: 'insufficient_permissions'
    });

    return false;
  }

  private matchesPermission(permission: Permission, resource: string, action: string): boolean {
    if (!permission.isActive) {
      return false;
    }

    const resourceMatch = permission.resource === '*' || permission.resource === resource;
    const actionMatch = permission.action === '*' || permission.action === action;

    return resourceMatch && actionMatch;
  }

  // Encryption
  encrypt(data: string): string {
    if (!this.options.enableEncryption) {
      return data;
    }

    try {
      const cipher = createCipher(this.options.encryptionAlgorithm!, this.encryptionKey);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedData: string): string {
    if (!this.options.enableEncryption) {
      return encryptedData;
    }

    try {
      const decipher = createDecipher(this.options.encryptionAlgorithm!, this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  // Audit Logging
  private auditLog(action: string, resource: string, result: 'success' | 'failure' | 'blocked', userId?: string, metadata: Record<string, any> = {}): void {
    if (!this.options.enableAuditLog) {
      return;
    }

    const auditLog: SecurityAuditLog = {
      id: this.generateId('audit'),
      action,
      resource,
      result,
      timestamp: new Date(),
      metadata,
      ...(userId ? { userId } : {})
    };

    this.auditLogs.push(auditLog);

    // Limit audit log size (keep last 10000 entries)
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    this.emit('audit:log', auditLog);
  }

  getAuditLogs(filter?: {
    userId?: string;
    action?: string;
    resource?: string;
    result?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): SecurityAuditLog[] {
    let logs = [...this.auditLogs];

    if (filter) {
      if (filter.userId) {
        logs = logs.filter(log => log.userId === filter.userId);
      }
      if (filter.action) {
        logs = logs.filter(log => log.action === filter.action);
      }
      if (filter.resource) {
        logs = logs.filter(log => log.resource === filter.resource);
      }
      if (filter.result) {
        logs = logs.filter(log => log.result === filter.result);
      }
      if (filter.startDate) {
        logs = logs.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        logs = logs.filter(log => log.timestamp <= filter.endDate!);
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  // Utility methods
  private validatePassword(password: string): boolean {
    if (password.length < this.options.passwordMinLength!) {
      return false;
    }

    if (this.options.passwordRequireSpecialChars) {
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);

      return hasSpecialChar && hasNumber && hasUpperCase && hasLowerCase;
    }

    return true;
  }

  private hashPassword(password: string, salt: string): string {
    return pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  private verifyPassword(password: string, hash: string, salt: string): boolean {
    const hashedPassword = this.hashPassword(password, salt);
    return hashedPassword === hash;
  }

  private generateSalt(): string {
    return randomBytes(32).toString('hex');
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
  }

  private recordFailedLogin(attemptKey: string): void {
    const attempts = this.loginAttempts.get(attemptKey) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.loginAttempts.set(attemptKey, attempts);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  getPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  // Statistics
  getSecurityStats(): {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
    totalPermissions: number;
    activeTokens: number;
    auditLogEntries: number;
    failedLoginAttempts: number;
    } {
    const now = new Date();
    const activeTokens = Array.from(this.tokens.values()).filter(token => token.expiresAt > now).length;

    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
      totalRoles: this.roles.size,
      totalPermissions: this.permissions.size,
      activeTokens,
      auditLogEntries: this.auditLogs.length,
      failedLoginAttempts: this.loginAttempts.size
    };
  }

  // Cleanup
  cleanup(): void {
    // Remove expired tokens
    const now = new Date();
    for (const [token, authToken] of this.tokens.entries()) {
      if (authToken.expiresAt < now) {
        this.tokens.delete(token);
      }
    }

    // Clear old login attempts
    const cutoff = new Date(Date.now() - this.options.lockoutDuration!);
    for (const [key, attempts] of this.loginAttempts.entries()) {
      if (attempts.lastAttempt < cutoff) {
        this.loginAttempts.delete(key);
      }
    }

    this.logger.debug('Security cleanup completed');
  }

  destroy(): void {
    this.users.clear();
    this.roles.clear();
    this.permissions.clear();
    this.tokens.clear();
    this.auditLogs.length = 0;
    this.loginAttempts.clear();
    this.removeAllListeners();
    this.logger.info('Security manager destroyed');
  }
}
