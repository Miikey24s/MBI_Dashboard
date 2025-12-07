const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName?: string;
  departmentId?: string;
  departmentName?: string;
  roles: string[];
  permissions?: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthError {
  message: string;
  statusCode: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Đăng nhập thất bại');
  }

  return res.json();
}

export async function register(data: {
  email: string;
  password: string;
  fullName: string;
  tenantName?: string;
  tenantId?: string;
}): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Đăng ký thất bại');
  }

  return res.json();
}

export async function getProfile(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to get profile');
  }

  return res.json();
}

// Token management
const TOKEN_KEY = 'bi_dashboard_token';
const USER_KEY = 'bi_dashboard_user';

export function saveAuth(token: string, user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
