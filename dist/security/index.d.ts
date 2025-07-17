/**
 * MJOS Security System
 * 魔剑工作室操作系统安全系统
 */
import { EventEmitter } from 'events';
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
export declare class SecurityManager extends EventEmitter {
    private users;
    private roles;
    private permissions;
    private tokens;
    private auditLogs;
    private loginAttempts;
    private logger;
    private options;
    private encryptionKey;
    constructor(options?: SecurityManagerOptions);
    private initializeDefaultRolesAndPermissions;
    createUser(userData: {
        username: string;
        email: string;
        password: string;
        roles?: string[];
        permissions?: string[];
    }): Promise<string>;
    authenticateUser(username: string, password: string, ipAddress?: string): Promise<AuthToken | null>;
    validateToken(token: string): Promise<User | null>;
    revokeToken(token: string): Promise<boolean>;
    checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
    private matchesPermission;
    encrypt(data: string): string;
    decrypt(encryptedData: string): string;
    private auditLog;
    getAuditLogs(filter?: {
        userId?: string;
        action?: string;
        resource?: string;
        result?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): SecurityAuditLog[];
    private validatePassword;
    private hashPassword;
    private verifyPassword;
    private generateSalt;
    private generateToken;
    private generateEncryptionKey;
    private recordFailedLogin;
    private generateId;
    getUser(userId: string): User | undefined;
    getUsers(): User[];
    getRole(roleId: string): Role | undefined;
    getRoles(): Role[];
    getPermission(permissionId: string): Permission | undefined;
    getPermissions(): Permission[];
    getSecurityStats(): {
        totalUsers: number;
        activeUsers: number;
        totalRoles: number;
        totalPermissions: number;
        activeTokens: number;
        auditLogEntries: number;
        failedLoginAttempts: number;
    };
    cleanup(): void;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map