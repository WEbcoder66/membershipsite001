// src/lib/adminConfig.ts

// Types for admin user and roles
export type AdminRole = 'super-admin' | 'admin' | 'editor' | 'moderator';

export interface AdminUser {
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
}

export interface AdminConfig {
  credentials: {
    email: string;
    password: string;
  };
  roles: Record<AdminRole, {
    label: string;
    permissions: string[];
  }>;
  permissions: {
    content: string[];
    users: string[];
    settings: string[];
  };
  session: {
    maxAge: number;  // in seconds
    updateAge: number;  // in seconds
  };
}

// Define available permissions
export const PERMISSIONS = {
  content: [
    'create:content',
    'read:content',
    'update:content',
    'delete:content',
    'publish:content',
    'unpublish:content'
  ],
  users: [
    'create:user',
    'read:user',
    'update:user',
    'delete:user',
    'manage:roles'
  ],
  settings: [
    'read:settings',
    'update:settings',
    'manage:site',
    'access:analytics'
  ]
};

// Define role configurations
const getRolePermissions = (permissionList: string[]): string[] => [...permissionList];

export const ROLES = {
  'super-admin': {
    label: 'Super Admin',
    permissions: [
      ...getRolePermissions(PERMISSIONS.content),
      ...getRolePermissions(PERMISSIONS.users),
      ...getRolePermissions(PERMISSIONS.settings)
    ]
  },
  'admin': {
    label: 'Administrator',
    permissions: [
      ...getRolePermissions(PERMISSIONS.content),
      'read:user',
      'update:user',
      'read:settings',
      'update:settings'
    ]
  },
  'editor': {
    label: 'Content Editor',
    permissions: [
      'create:content',
      'read:content',
      'update:content',
      'publish:content',
      'unpublish:content'
    ]
  },
  'moderator': {
    label: 'Moderator',
    permissions: [
      'read:content',
      'update:content',
      'unpublish:content'
    ]
  }
};

// Main admin configuration
export const ADMIN_CONFIG: AdminConfig = {
  credentials: {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@membershipsite001.com',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'default-password'
  },
  roles: ROLES,
  permissions: {
    content: [...PERMISSIONS.content],
    users: [...PERMISSIONS.users],
    settings: [...PERMISSIONS.settings]
  },
  session: {
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60 // 1 hour
  }
};

// Helper functions
export const hasPermission = (user: AdminUser, permission: string): boolean => {
  return user.permissions.includes(permission);
};

export const isSuperAdmin = (user: AdminUser): boolean => {
  return user.role === 'super-admin';
};

export const ADMIN_CREDENTIALS = ADMIN_CONFIG.credentials;

// Admin routes configuration
export const ADMIN_ROUTES = {
  login: '/admin/login',
  dashboard: '/admin/dashboard',
  content: '/admin/content',
  users: '/admin/users',
  settings: '/admin/settings',
  analytics: '/admin/analytics'
} as const;

// Admin API endpoints
export const ADMIN_API_ENDPOINTS = {
  auth: '/api/admin/auth',
  content: '/api/admin/content',
  users: '/api/admin/users',
  settings: '/api/admin/settings',
  analytics: '/api/admin/analytics'
} as const;

export default ADMIN_CONFIG;