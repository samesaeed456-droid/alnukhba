import React, { useState } from 'react';
import { Shield, UserPlus, Trash2, UserCheck, UserX, Mail, User, Lock, X, Edit2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUser, AdminRole, AdminPermission } from '../../types';
import { FloatingInput } from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function Security() {
  const { 
    adminUsers, addAdminUser, updateAdminUser, deleteAdminUser
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState<Omit<AdminUser, 'id'>>({
    name: '',
    email: '',
    password: '',
    role: 'editor',
    isActive: true,
    permissions: ['view_dashboard', 'manage_products', 'manage_marketing', 'manage_coupons', 'manage_messages']
  });

  const allPermissions: { id: AdminPermission; label: string; icon: React.ReactNode }[] = [
    { id: 'view_dashboard', label: 'لوحة التحكم', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_orders', label: 'الطلبات', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_products', label: 'المنتجات', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_customers', label: 'العملاء', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_marketing', label: 'التسويق', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_coupons', label: 'الكوبونات', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_settings', label: 'الإعدادات', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_security', label: 'الأمان', icon: <Shield className="w-3 h-3" /> },
    { id: 'view_logs', label: 'السجلات', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_logistics', label: 'الشحن', icon: <Shield className="w-3 h-3" /> },
    { id: 'manage_messages', label: 'الرسائل', icon: <Shield className="w-3 h-3" /> },
  ];

  const rolePermissionTemplates: Record<AdminRole, AdminPermission[]> = {
    super_admin: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages'],
    manager: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_logistics', 'manage_messages'],
    editor: ['view_dashboard', 'manage_products', 'manage_marketing', 'manage_coupons', 'manage_messages'],
    support: ['view_dashboard', 'manage_orders', 'manage_customers', 'manage_messages']
  };

  const handleRoleChange = (role: AdminRole) => {
    setAdminForm({
      ...adminForm,
      role,
      permissions: rolePermissionTemplates[role]
    });
  };

  const togglePermission = (permId: AdminPermission) => {
    setAdminForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    addAdminUser(adminForm);
    setIsAddModalOpen(false);
    setAdminForm({ 
      name: '', 
      email: '', 
      password: '',
      role: 'editor', 
      isActive: true,
      permissions: rolePermissionTemplates['editor']
    });
  };

  const handleEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdminId) {
      const originalAdmin = adminUsers.find(a => a.id === editingAdminId);
      let logDetails = `تم تحديث بيانات المشرف ${adminForm.name}`;
      
      if (originalAdmin) {
        if (originalAdmin.role !== adminForm.role) {
          logDetails += ` - تم تغيير الصلاحية من ${getRoleLabel(originalAdmin.role)} إلى ${getRoleLabel(adminForm.role)}`;
        }
        if (originalAdmin.password !== adminForm.password) {
          logDetails += ` - تم تغيير كلمة المرور`;
        }
      }

      updateAdminUser(editingAdminId, adminForm, logDetails);
      setIsEditModalOpen(false);
      setEditingAdminId(null);
      setAdminForm({ 
        name: '', 
        email: '', 
        password: '',
        role: 'editor', 
        isActive: true,
        permissions: rolePermissionTemplates['editor']
      });
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setAdminForm({
      name: admin.name,
      email: admin.email,
      password: admin.password || '',
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions
    });
    setEditingAdminId(admin.id);
    setIsEditModalOpen(true);
  };

  const getRoleLabel = (role: AdminRole) => {
    switch (role) {
      case 'super_admin': return 'مدير عام';
      case 'manager': return 'مدير متجر';
      case 'editor': return 'محرر محتوى';
      case 'support': return 'دعم فني';
      default: return role;
    }
  };

  const getRoleColor = (role: AdminRole) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'editor': return 'bg-green-100 text-green-700 border-green-200';
      case 'support': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPermissionLabel = (permission: AdminPermission) => {
    const labels: Record<AdminPermission, string> = {
      view_dashboard: 'لوحة التحكم',
      manage_orders: 'الطلبات',
      manage_products: 'المنتجات',
      manage_customers: 'العملاء',
      manage_marketing: 'التسويق',
      manage_coupons: 'الكوبونات',
      manage_settings: 'الإعدادات',
      manage_security: 'الأمان',
      view_logs: 'السجلات',
      manage_logistics: 'الشحن',
      manage_messages: 'الرسائل'
    };
    return labels[permission] || permission;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-carbon flex items-center gap-2">
          <Shield className="w-6 h-6 text-solar" />
          <span>إدارة طاقم العمل والأدوار</span>
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-solar text-white px-4 py-2 rounded-xl font-bold hover:bg-solar/90 transition-all shadow-lg shadow-solar/20"
        >
          <UserPlus className="w-5 h-5" />
          <span>إضافة مشرف جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminUsers.map((admin) => (
          <div key={admin.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-carbon">{admin.name}</h3>
                  <p className="text-xs text-gray-400">{admin.email}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${getRoleColor(admin.role)}`}>
                {getRoleLabel(admin.role)}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">الحالة:</span>
                <span className={`font-bold ${admin.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {admin.isActive ? 'نشط' : 'معطل'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">آخر ظهور:</span>
                <span className="text-gray-400">
                  {(admin.lastLogin as any)?.seconds 
                    ? new Date((admin.lastLogin as any).seconds * 1000).toLocaleString('ar-EG') 
                    : (admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('ar-EG') : 'لم يسجل دخول بعد')}
                </span>
              </div>
            </div>

            <div className="mb-6 flex-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">الصلاحيات الممنوحة</span>
              <div className="flex flex-wrap gap-1.5">
                {admin.permissions?.map((perm) => (
                  <span key={perm} className="text-[9px] font-bold bg-gray-50 text-gray-500 px-2 py-1 rounded-lg border border-gray-100">
                    {getPermissionLabel(perm)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
              <button
                onClick={() => updateAdminUser(admin.id, { isActive: !admin.isActive }, `تم ${admin.isActive ? 'تعطيل' : 'تفعيل'} حساب المشرف ${admin.name}`)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all font-bold text-sm ${
                  admin.isActive ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-green-100 text-green-500 hover:bg-green-50'
                }`}
              >
                {admin.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                <span>{admin.isActive ? 'تعطيل' : 'تفعيل'}</span>
              </button>
              <button
                onClick={() => openEditModal(admin)}
                className="p-2 border border-gray-100 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmId(admin.id)}
                className="p-2 border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-carbon">إضافة مشرف جديد</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                <FloatingInput
                  id="adminName"
                  label="الاسم الكامل"
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  icon={<User className="w-4 h-4" />}
                  iconPosition="start"
                />
                <FloatingInput
                  id="adminEmail"
                  label="البريد الإلكتروني"
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  icon={<Mail className="w-4 h-4" />}
                  iconPosition="start"
                />
                <FloatingInput
                  id="adminPassword"
                  label="كلمة المرور"
                  type="password"
                  required
                  value={adminForm.password || ''}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  icon={<Lock className="w-4 h-4" />}
                  iconPosition="start"
                />
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">قالب الدور (اختياري)</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(['super_admin', 'manager', 'editor', 'support'] as AdminRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          adminForm.role === role 
                            ? 'bg-solar text-white border-solar shadow-sm' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {getRoleLabel(role)}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                    <span>تخصيص الصلاحيات يدوياً</span>
                    <span className="text-[10px] font-normal text-gray-400">({adminForm.permissions.length} مختارة)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {allPermissions.map((perm) => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-right ${
                          adminForm.permissions.includes(perm.id)
                            ? 'bg-solar/5 border-solar text-solar shadow-[0_0_15px_rgba(244,191,48,0.1)]'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          adminForm.permissions.includes(perm.id) ? 'bg-solar text-white' : 'bg-gray-50 text-gray-300'
                        }`}>
                          {adminForm.permissions.includes(perm.id) ? <UserCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold">{perm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-solar text-white py-3 rounded-xl font-bold hover:bg-solar/90 transition-all shadow-lg shadow-solar/20 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>إضافة المشرف</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingAdminId(null);
              }}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-carbon">تعديل بيانات المشرف</h3>
                <button onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAdminId(null);
                }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleEditAdmin} className="p-6 space-y-4">
                <FloatingInput
                  id="editAdminName"
                  label="الاسم الكامل"
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  icon={<User className="w-4 h-4" />}
                  iconPosition="start"
                />
                <FloatingInput
                  id="editAdminEmail"
                  label="البريد الإلكتروني"
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  icon={<Mail className="w-4 h-4" />}
                  iconPosition="start"
                />
                <FloatingInput
                  id="editAdminPassword"
                  label="كلمة المرور"
                  type="password"
                  required
                  value={adminForm.password || ''}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  icon={<Lock className="w-4 h-4" />}
                  iconPosition="start"
                />
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">قالب الدور (اختياري)</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(['super_admin', 'manager', 'editor', 'support'] as AdminRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          adminForm.role === role 
                            ? 'bg-solar text-white border-solar shadow-sm' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {getRoleLabel(role)}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                    <span>تخصيص الصلاحيات يدوياً</span>
                    <span className="text-[10px] font-normal text-gray-400">({adminForm.permissions.length} مختارة)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {allPermissions.map((perm) => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-right ${
                          adminForm.permissions.includes(perm.id)
                            ? 'bg-solar/5 border-solar text-solar shadow-[0_0_15px_rgba(244,191,48,0.1)]'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          adminForm.permissions.includes(perm.id) ? 'bg-solar text-white' : 'bg-gray-50 text-gray-300'
                        }`}>
                          {adminForm.permissions.includes(perm.id) ? <UserCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold">{perm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-solar text-white py-3 rounded-xl font-bold hover:bg-solar/90 transition-all shadow-lg shadow-solar/20 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  <span>حفظ التعديلات</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteAdminUser(deleteConfirmId);
          }
        }}
        title="هل أنت متأكد؟"
        message="سيتم حذف هذا المشرف نهائياً من النظام. لا يمكن التراجع عن هذا الإجراء."
        confirmText="تأكيد الحذف"
        type="danger"
      />
    </div>
  );
}

