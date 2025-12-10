'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Plus, Trash2, Edit, Loader2, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getToken } from '@/lib/auth';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  departmentId?: string;
  departmentName?: string;
  createdAt: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string;
}

interface DepartmentData {
  id: string;
  name: string;
  code: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function UsersPage() {
  const { user, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', roleId: '', departmentId: '' });
  const [editUser, setEditUser] = useState({ fullName: '', roleId: '', departmentId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.roles?.includes('Admin')) {
      fetchUsers();
      fetchRoles();
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch {
      console.error('Failed to fetch roles');
    }
  };

  const fetchDepartments = async () => {
    if (!user?.tenantId) return;
    
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/departments?tenantId=${user.tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch {
      console.error('Failed to fetch departments');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast.error(t.error);
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        toast.success(t.success);
        setShowAddModal(false);
        setNewUser({ email: '', password: '', fullName: '', roleId: '', departmentId: '' });
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.message || t.error);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        toast.success(t.success);
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.message || t.error);
      }
    } catch {
      toast.error(t.error);
    }
  };

  const openEditModal = (u: UserData) => {
    setEditingUser(u);
    
    // Find current role ID
    const currentRole = roles.find(r => u.roles.includes(r.name));
    
    setEditUser({
      fullName: u.fullName,
      roleId: currentRole?.id || (roles.length > 0 ? roles[0].id : ''),
      departmentId: u.departmentId || '',
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      });

      if (res.ok) {
        toast.success(t.success);
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
        
        // Refresh profile if editing current user or if role changed
        if (editingUser.id === user?.id || editUser.roleId) {
          await refreshProfile();
          setTimeout(() => window.location.reload(), 500);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || t.error);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success(t.deleteSuccess);
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.message || t.deleteError);
      }
    } catch {
      toast.error(t.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!user?.roles?.includes('Admin')) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Card>
              <CardContent className="py-16 text-center">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.noAccess}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {t.noAccessDesc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-7 h-7" />
                {t.usersTitle}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t.usersDescription}
              </p>
            </div>
            <button
              onClick={() => {
                // Set default role to first role (usually Viewer)
                const defaultRole = roles.find(r => r.name === 'Viewer') || roles[0];
                setNewUser({ 
                  email: '', 
                  password: '', 
                  fullName: '', 
                  roleId: defaultRole?.id || '', 
                  departmentId: '' 
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.addUser}
            </button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t.noUsers}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.department}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.role}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.status}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{u.fullName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {u.departmentName ? (
                              <span className="text-sm text-gray-700 dark:text-gray-300">{u.departmentName}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">{t.notAssigned}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {u.roles.map((role) => (
                              <Badge key={role} variant={role === 'Admin' ? 'default' : 'secondary'}>
                                {role}
                              </Badge>
                            ))}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={u.isActive ? 'success' : 'error'}>
                              {u.isActive ? t.active : t.inactive}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.id === user?.id ? (
                              <span className="text-xs text-gray-400 italic">{t.currentUser}</span>
                            ) : u.roles.includes('Admin') ? (
                              <span className="text-xs text-gray-400 italic">Admin</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openEditModal(u)} className="p-2 text-gray-500 hover:text-blue-600" title={t.edit}>
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(u.id, u.isActive)}
                                  className={`p-2 ${u.isActive ? 'text-green-600 hover:text-yellow-600' : 'text-gray-400 hover:text-green-600'}`}
                                  title={u.isActive ? t.deactivate : t.activate}
                                >
                                  {u.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-500 hover:text-red-600" title={t.delete}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.edit} User</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.fullName}</label>
                <input type="text" value={editUser.fullName} onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                <input type="email" value={editingUser.email} disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
                <select value={editUser.roleId} onChange={(e) => setEditUser({ ...editUser, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {roles.map((role) => (<option key={role.id} value={role.id}>{role.name} - {role.description}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.department}</label>
                <select value={editUser.departmentId} onChange={(e) => setEditUser({ ...editUser, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{t.notAssigned}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} {dept.code ? `(${dept.code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t.update}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.addUser}</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.fullName}</label>
                <input type="text" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.password}</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
                <select value={newUser.roleId} onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {roles.map((role) => (<option key={role.id} value={role.id}>{role.name} - {role.description}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.department}</label>
                <select value={newUser.departmentId} onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{t.notAssigned}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} {dept.code ? `(${dept.code})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
