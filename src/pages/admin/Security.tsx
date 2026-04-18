import React, { useState } from 'react';
import { 
  Shield, UserPlus, Trash2, UserCheck, UserX, User, Lock, X, Edit2, 
  ChevronDown, ChevronUp, Settings2 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUser, AdminRole, AdminPermission } from '../../types';
import { FloatingInput } from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function Security() {
  const { 
    adminUsers, addAdminUser, updateAdminUser, deleteAdminUser, showToast
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [adminForm, setAdminForm] = useState<Omit<AdminUser, 'id'>>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+967',
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

    // Prevent duplicate phone numbers
    const phoneExists = adminUsers.some(a => 
      a.phone?.replace(/\D/g, '') === adminForm.phone?.replace(/\D/g, '') && 
      a.countryCode === adminForm.countryCode
    );

    if (phoneExists) {
      showToast('هذا الرقم مسجل مسبقاً لمشرف آخر. يرجى استخدام رقم مختلف أو تعديل الحساب الحالي.', 'error');
      return;
    }

    addAdminUser(adminForm);
    setIsAddModalOpen(false);
    setAdminForm({ 
      name: '', 
      email: '', 
      phone: '',
      countryCode: '+967',
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
        phone: '',
        countryCode: '+967',
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
      phone: admin.phone || '',
      countryCode: admin.countryCode || '+967',
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
                  <p className="text-xs text-gray-400">
                    {admin.phone ? `${admin.countryCode || ''} ${admin.phone}` : admin.email}
                  </p>
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setShowAdvanced(false);
              }}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] sm:max-h-none flex flex-col overflow-hidden"
            >
              {/* Mobile Handle */}
              <div className="sm:hidden w-full flex justify-center p-3">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-carbon">إضافة مشرف جديد</h3>
                  <p className="text-xs text-gray-400 mt-0.5">قم بتعيين صلاحيات الفريق</p>
                </div>
                <button onClick={() => {
                  setIsAddModalOpen(false);
                  setShowAdvanced(false);
                }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar pb-24 sm:pb-6">
                <form id="add-admin-form" onSubmit={handleAddAdmin} className="space-y-6">
                  {/* Basic Info Group */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">المعلومات الأساسية</span>
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
                      id="adminPhone"
                      label="رقم الهاتف"
                      type="tel"
                      required
                      value={adminForm.phone || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="77x xxx xxx"
                      dir="ltr"
                      className="tracking-widest text-left"
                      startElement={
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold px-4 border-r border-slate-200">
                          <select 
                            value={adminForm.countryCode}
                            onChange={(e) => setAdminForm({ ...adminForm, countryCode: e.target.value })}
                            className="bg-transparent border-none outline-none text-[10px] cursor-pointer appearance-none text-center"
                          >
                            <option value="+967">🇾🇪 +967</option>
                          </select>
                        </div>
                      }
                    />

                    <FloatingInput
                      id="adminPassword"
                      label="كلمة المرور"
                      type="text"
                      required
                      value={adminForm.password || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      icon={<Lock className="w-4 h-4" />}
                      iconPosition="start"
                      placeholder="اتركها كما هي إذا لم ترد التغيير"
                    />
                  </div>

                  {/* Role Template Group */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">اختيار قالب الدور</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['super_admin', 'manager', 'editor', 'support'] as AdminRole[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleChange(role)}
                          className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all text-right ${
                            adminForm.role === role 
                              ? 'bg-solar border-solar text-white shadow-lg shadow-solar/20' 
                              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-xs font-black">{getRoleLabel(role)}</span>
                          <span className={`text-[9px] mt-1 ${adminForm.role === role ? 'text-white/80' : 'text-gray-400'}`}>التحكم الافتراضي</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Permissions Toggle */}
                  <div className="border-t border-gray-50 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <Settings2 className="w-4 h-4 text-solar" />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold block text-carbon">الصلاحيات المتقدمة</span>
                          <span className="text-[10px] text-gray-500">تحكم بكلمة صلاحية على حدة</span>
                        </div>
                      </div>
                      {showAdvanced ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {allPermissions.map((perm) => (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-right ${
                                  adminForm.permissions.includes(perm.id)
                                    ? 'bg-solar/5 border-solar text-solar'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  adminForm.permissions.includes(perm.id) ? 'bg-solar text-white' : 'bg-gray-50 text-gray-300'
                                }`}>
                                  {adminForm.permissions.includes(perm.id) ? <UserCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                </div>
                                <span className="text-[10px] font-bold">{perm.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>

              {/* Sticky Footer Button */}
              <div className="p-6 bg-white border-t border-gray-50 sticky bottom-0 z-20">
                <button
                  form="add-admin-form"
                  type="submit"
                  className="w-full bg-solar text-white h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-solar/90 transition-all shadow-xl shadow-solar/20 active:scale-[0.98]"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>إضافة المشرف الجديد</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Edit Admin Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingAdminId(null);
                setShowAdvanced(false);
              }}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] sm:max-h-none flex flex-col overflow-hidden"
            >
              {/* Mobile Handle */}
              <div className="sm:hidden w-full flex justify-center p-3">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-carbon">تعديل بيانات المشرف</h3>
                  <p className="text-xs text-gray-400 mt-0.5">تحديث صلاحيات الحساب</p>
                </div>
                <button onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAdminId(null);
                  setShowAdvanced(false);
                }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar pb-24 sm:pb-6">
                <form id="edit-admin-form" onSubmit={handleEditAdmin} className="space-y-6">
                  {/* Basic Info Group */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">المعلومات الأساسية</span>
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
                      id="editAdminPhone"
                      label="رقم الهاتف"
                      type="tel"
                      required
                      value={adminForm.phone || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="77x xxx xxx"
                      dir="ltr"
                      className="tracking-widest text-left"
                      startElement={
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold px-4 border-r border-slate-200">
                          <select 
                            value={adminForm.countryCode}
                            onChange={(e) => setAdminForm({ ...adminForm, countryCode: e.target.value })}
                            className="bg-transparent border-none outline-none text-[10px] cursor-pointer appearance-none text-center"
                          >
                            <option value="+967">🇾🇪 +967</option>
                          </select>
                        </div>
                      }
                    />

                    <div className="space-y-1">
                      <FloatingInput
                        id="editAdminPassword"
                        label="كلمة المرور (لا يمكن تغييرها من هنا)"
                        type="password"
                        readOnly
                        value="••••••••••••••"
                        onChange={() => {}}
                        icon={<Lock className="w-4 h-4 text-gray-300" />}
                        iconPosition="start"
                      />
                      <p className="text-[9px] text-gray-400 px-1 text-right">لأسباب أمنية، لا يمكن تغيير كلمة مرور المشرف بعد إنشائها. إذا نسيها، عليه إنشائها كحساب جديد أو تغييرها من ملفه.</p>
                    </div>
                  </div>

                  {/* Role Template Group */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">تغيير قالب الدور</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['super_admin', 'manager', 'editor', 'support'] as AdminRole[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleChange(role)}
                          className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all text-right ${
                            adminForm.role === role 
                              ? 'bg-solar border-solar text-white shadow-lg shadow-solar/20' 
                              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-xs font-black">{getRoleLabel(role)}</span>
                          <span className={`text-[9px] mt-1 ${adminForm.role === role ? 'text-white/80' : 'text-gray-400'}`}>التحكم الحالي</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Permissions Toggle */}
                  <div className="border-t border-gray-50 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <Settings2 className="w-4 h-4 text-solar" />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold block text-carbon">الصلاحيات المتقدمة</span>
                          <span className="text-[10px] text-gray-500">تحويل يدوي للصلاحيات</span>
                        </div>
                      </div>
                      {showAdvanced ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {allPermissions.map((perm) => (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-right ${
                                  adminForm.permissions.includes(perm.id)
                                    ? 'bg-solar/5 border-solar text-solar'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  adminForm.permissions.includes(perm.id) ? 'bg-solar text-white' : 'bg-gray-50 text-gray-300'
                                }`}>
                                  {adminForm.permissions.includes(perm.id) ? <UserCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                </div>
                                <span className="text-[10px] font-bold">{perm.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>

              {/* Sticky Footer Button */}
              <div className="p-6 bg-white border-t border-gray-50 sticky bottom-0 z-20">
                <button
                  form="edit-admin-form"
                  type="submit"
                  className="w-full bg-solar text-white h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-solar/90 transition-all shadow-xl shadow-solar/20 active:scale-[0.98]"
                >
                  <Edit2 className="w-5 h-5" />
                  <span>حفظ التعديلات الحالية</span>
                </button>
              </div>
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

