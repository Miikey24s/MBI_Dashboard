'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, Plus, Trash2, Edit, Loader2, Shield, Users, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getToken } from '@/lib/auth';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DepartmentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.roles?.includes('Admin')) {
      fetchDepartments();
    }
  }, [isAuthenticated, user]);

  const fetchDepartments = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };


  const openAddModal = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, code: dept.code || '', description: dept.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error(t.departmentName + ' is required');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const url = editingDept 
        ? `${API_BASE_URL}/departments/${editingDept.id}`
        : `${API_BASE_URL}/departments`;
      
      const res = await fetch(url, {
        method: editingDept ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(t.success);
        setShowModal(false);
        fetchDepartments();
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

  const handleToggleActive = async (dept: Department) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/departments/${dept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !dept.isActive }),
      });

      if (res.ok) {
        toast.success(t.success);
        fetchDepartments();
      }
    } catch {
      toast.error(t.error);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`${t.confirmDeleteDept} "${dept.name}"?`)) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/departments/${dept.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success(t.deleteSuccess);
        fetchDepartments();
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
                <Building2 className="w-7 h-7" />
                {t.departmentsTitle}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t.departmentsDescription}
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.addDepartment}
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t.noDepartments}</p>
                <button onClick={openAddModal} className="mt-4 text-blue-600 hover:underline">
                  {t.addFirstDepartment}
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.id} className={!dept.isActive ? 'opacity-60' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                          {dept.code && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {t.departmentCode}: {dept.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={dept.isActive ? 'success' : 'error'}>
                        {dept.isActive ? t.active : t.inactive}
                      </Badge>
                    </div>
                    
                    {dept.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {dept.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{dept.userCount} {t.employees}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(dept)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title={t.edit}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(dept)} 
                          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${dept.isActive ? 'text-green-600 hover:text-yellow-600' : 'text-gray-400 hover:text-green-600'}`}
                          title={dept.isActive ? t.deactivate : t.activate}
                        >
                          {dept.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDelete(dept)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title={t.delete}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingDept ? t.editDepartment : t.addDepartment}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.departmentName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Accounting Department"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.departmentCode}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ACC, HR, MKT"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Department description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDept ? t.update : t.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
