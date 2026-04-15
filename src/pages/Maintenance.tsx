import React from 'react';
import { Settings, Clock, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import Logo from '../components/Logo';

interface MaintenanceProps {
  onBypass?: () => void;
}

export default function Maintenance({ onBypass }: MaintenanceProps) {
  const { settings } = useStore();

  const [showVerify, setShowVerify] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '1234') {
      onBypass?.();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-carbon flex flex-col items-center justify-center p-6 text-center relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-solar/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="max-w-lg w-full bg-white/5 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-8 sm:p-12 border border-white/10 relative z-10"
      >
        <div className="flex justify-center mb-10">
          <Logo variant="light" className="h-14 sm:h-16 drop-shadow-lg" />
        </div>

        {!showVerify ? (
          <>
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-solar/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-gradient-to-br from-solar to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-solar/30">
                <Settings className="w-12 h-12 text-white animate-[spin_4s_linear_infinite]" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              نحن نتطور من أجلك!
            </h1>
            
            <p className="text-gray-300 mb-10 leading-relaxed text-lg">
              {settings.maintenanceMessage || 'المتجر حالياً في وضع الصيانة لإضافة ميزات جديدة وتحسين تجربة التسوق. سنعود إليكم قريباً جداً بحلة جديدة!'}
            </p>

            <div className="space-y-6 border-t border-white/10 pt-8">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-400 font-medium">
                <Clock className="w-5 h-5 text-solar" />
                <span>الوقت المتوقع للعودة: قريباً جداً</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">للتواصل العاجل</p>
                <div className="flex justify-center gap-4">
                  <a href={`mailto:${settings.contactEmail}`} className="p-3 bg-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-solar/20 border border-white/5 hover:border-solar/30 transition-all">
                    <Mail className="w-5 h-5" />
                  </a>
                  <a href={`tel:${settings.contactPhone}`} className="p-3 bg-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-solar/20 border border-white/5 hover:border-solar/30 transition-all">
                    <Phone className="w-5 h-5" />
                  </a>
                  {settings.contactPhone2 && (
                    <a href={`tel:${settings.contactPhone2}`} className="p-3 bg-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-solar/20 border border-white/5 hover:border-solar/30 transition-all">
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4">
            <h2 className="text-xl font-bold text-white mb-6">تحقق المطور</h2>
            <form onSubmit={handleVerify} className="space-y-6">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="أدخل رمز التحقق (1234)"
                className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-4 px-6 text-center text-2xl text-white focus:outline-none focus:ring-2 focus:ring-solar/50 transition-all`}
                maxLength={4}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowVerify(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-solar hover:bg-solar/80 text-white font-bold rounded-xl transition-all"
                >
                  تحقق
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Skip Button */}
      {onBypass && !showVerify && (
        <button
          onClick={() => setShowVerify(true)}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-full transition-all backdrop-blur-md text-sm font-bold group relative z-10"
        >
          <span>تخطي وضع الصيانة (للمعاينة)</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>
      )}

      <p className="mt-8 text-gray-500 text-sm relative z-10">
        &copy; {new Date().getFullYear()} {settings.storeName}. جميع الحقوق محفوظة.
      </p>
    </div>
  );
}
