import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft, Phone, Mail, Clock, MessageCircle, MapPin, User, FileText, CheckCircle2, ArrowRight, Home, ChevronDown, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import FloatingInput from '../components/FloatingInput';

const MAX_MESSAGE_LENGTH = 500;
const PHONE_LENGTH = 9;

const MESSAGE_TYPES = [
  { id: 'sales', label: 'استفسار عن المبيعات' },
  { id: 'support', label: 'الدعم الفني' },
  { id: 'complaint', label: 'شكوى أو ملاحظة' },
  { id: 'suggestion', label: 'اقتراح' },
  { id: 'other', label: 'أخرى' }
];

export default function Contact() {
  const navigate = useNavigate();
  const { addTicket, user, settings } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone?.replace(/\D/g, '').slice(-9) || '',
    subject: MESSAGE_TYPES[0].label,
    message: ''
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== PHONE_LENGTH) {
      newErrors.phone = `رقم الهاتف يجب أن يكون ${PHONE_LENGTH} أرقام`;
    }
    
    if (!formData.message.trim()) newErrors.message = 'الرسالة مطلوبة';
    if (formData.message.length > MAX_MESSAGE_LENGTH) newErrors.message = 'الرسالة طويلة جداً';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    
    addTicket({
      customerId: formData.phone,
      customerName: formData.name,
      subject: formData.subject,
      message: formData.message,
      priority: 'medium'
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#10B981']
      });
    }, 1500);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH);
    setFormData({ ...formData, phone: value });
    if (errors.phone) setErrors({ ...errors, phone: '' });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
    setFormData({ ...formData, message: value });
    if (errors.message) setErrors({ ...errors, message: '' });
  };

  const contactMethods = [
    {
      icon: Phone,
      title: 'رقم الهاتف',
      value: settings.contactPhone || 'تواصل معنا',
      link: `tel:${settings.contactPhone}`,
      color: 'bg-emerald-50 text-emerald-600'
    },
    ...(settings.contactPhone2 ? [{
      icon: Phone,
      title: 'رقم الهاتف الإضافي',
      value: settings.contactPhone2,
      link: `tel:${settings.contactPhone2}`,
      color: 'bg-emerald-50 text-emerald-600'
    }] : []),
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      value: settings.contactEmail || 'support@horizon.com',
      link: `mailto:${settings.contactEmail || 'support@horizon.com'}`,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Clock,
      title: 'ساعات العمل',
      value: '9:00 ص - 10:00 م',
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50/50 pb-20"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-carbon" />
            </button>
            <h1 className="text-lg font-black text-carbon">تواصل معنا</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
            <div className="mb-6">
              <h2 className="text-xl font-black text-carbon mb-2">معلومات التواصل</h2>
              <p className="text-sm text-slate-500 font-medium">نحن هنا لمساعدتك والإجابة على جميع استفساراتك</p>
            </div>

            {contactMethods.map((method, idx) => (
              <motion.a
                key={idx}
                href={method.link}
                target={method.link ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group ${!method.link && 'pointer-events-none'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${method.color}`}>
                  <method.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{method.title}</p>
                  <p className="text-sm font-black text-carbon group-hover:text-solar transition-colors">{method.value}</p>
                </div>
              </motion.a>
            ))}

            <div className="p-6 rounded-3xl bg-carbon text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-black mb-2">هل لديك سؤال سريع؟</h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">تواصل معنا عبر الواتساب للحصول على رد فوري خلال دقائق.</p>
                <a 
                  href={`https://wa.me/${settings.socialMedia?.whatsapp || settings.contactPhone}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-solar text-carbon rounded-xl text-xs font-black hover:scale-105 transition-all"
                >
                  ابدأ المحادثة
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
              <MessageCircle className="absolute -bottom-4 -left-4 w-24 h-24 text-white/5 -rotate-12" />
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div 
                  key="contact-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-carbon via-solar to-solar" />
                  
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-carbon mb-2">أرسل لنا رسالة</h2>
                    <p className="text-sm text-slate-500 font-medium">املأ النموذج أدناه وسنقوم بالرد عليك في أقرب وقت ممكن</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <FloatingInput 
                          id="name"
                          label="الاسم الكامل"
                          required
                          type="text" 
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({...formData, name: e.target.value});
                            if (errors.name) setErrors({ ...errors, name: '' });
                          }}
                          error={errors.name}
                          icon={<User className="w-5 h-5" />}
                          iconPosition="end"
                        />
                      </div>
                      <div>
                        <FloatingInput 
                          id="phone"
                          label="رقم الجوال (9 أرقام)"
                          required
                          type="tel" 
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          error={errors.phone}
                          dir="ltr"
                          className="text-left"
                          icon={<Phone className="w-5 h-5" />}
                          iconPosition="start"
                          maxLength={PHONE_LENGTH}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative group">
                        <div className={`
                          relative flex items-center h-14 bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200
                          ${errors.subject ? 'border-red-400' : 'border-slate-200 focus-within:border-solar focus-within:ring-1 focus-within:ring-solar'}
                        `}>
                          <div className="flex-1 h-full flex flex-col justify-center px-4">
                            <select
                              id="subject"
                              value={formData.subject}
                              onChange={(e) => setFormData({...formData, subject: e.target.value})}
                              className="w-full h-full bg-transparent outline-none text-carbon font-semibold text-sm sm:text-base pt-5 pb-1 appearance-none cursor-pointer"
                            >
                              {MESSAGE_TYPES.map(type => (
                                <option key={type.id} value={type.label}>{type.label}</option>
                              ))}
                            </select>
                            <label className="absolute pointer-events-none top-1.5 right-4 text-[10px] sm:text-xs font-bold text-slate-500">
                              نوع الرسالة
                            </label>
                          </div>
                          <div className="px-4 text-slate-400">
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <FloatingInput 
                        id="message"
                        label="الرسالة"
                        required
                        isTextArea
                        containerClassName="min-h-[160px]"
                        value={formData.message}
                        onChange={handleMessageChange}
                        error={errors.message}
                        maxLength={MAX_MESSAGE_LENGTH}
                      />
                      <div className={`absolute bottom-2 left-4 text-[10px] font-bold ${formData.message.length >= MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                        {formData.message.length} / {MAX_MESSAGE_LENGTH}
                      </div>
                    </div>

                    {Object.keys(errors).length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        يرجى التأكد من صحة جميع الحقول المطلوبة
                      </motion.div>
                    )}

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-carbon text-white h-16 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-70 shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <>
                          إرسال الرسالة
                          <Send className="w-5 h-5 -rotate-45" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-16 shadow-xl shadow-slate-200/40 border border-slate-100 text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-emerald-500" />
                  
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner"
                  >
                    <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12" />
                  </motion.div>

                  <h2 className="text-xl sm:text-3xl font-black text-carbon mb-3 sm:mb-4">تم إرسال رسالتك بنجاح!</h2>
                  <p className="text-xs sm:text-base text-slate-500 font-medium mb-8 sm:mb-10 leading-relaxed max-w-md mx-auto px-2">
                    شكراً لتواصلك معنا. لقد استلمنا رسالتك وسيقوم فريق الدعم الفني بالرد عليك في أقرب وقت ممكن عبر بريدك الإلكتروني أو رقم الجوال.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <button 
                      onClick={() => navigate('/')}
                      className="w-full sm:w-auto px-8 h-12 sm:h-14 bg-carbon text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                      <Home className="w-4 h-4" />
                      العودة للرئيسية
                    </button>
                    <button 
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: user?.name || '',
                          phone: user?.phone || '',
                          subject: '',
                          message: ''
                        });
                      }}
                      className="w-full sm:w-auto px-8 h-12 sm:h-14 bg-slate-50 text-slate-600 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95"
                    >
                      إرسال رسالة أخرى
                    </button>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50" />
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-solar/10 rounded-full blur-3xl opacity-50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
