import React, { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import {
  CreditCard,
  ShoppingCart,
  Users,
  Activity,
  TrendingUp,
  Download,
  Package,
  RefreshCw,
  Eye,
  BellRing
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-gold-lg border border-solar/20 min-w-[150px]">
        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 mt-1"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm font-medium text-slate-600">
                {entry.name}:
              </span>
            </div>
            <span className="text-sm font-bold text-carbon">
              {entry.name === "المبيعات"
                ? `${entry.value?.toLocaleString()} ر.ي`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const {
    orders,
    products,
    formatPrice,
    logActivity,
    visits,
    showToast,
  } = useStore();
  const [timeRange, setTimeRange] = useState("30d");
  const [chartView, setChartView] = useState<"sales" | "visits">("sales");
  const [isExporting, setIsExporting] = useState(false);

  const metrics = useMemo(() => {
    const now = new Date();
    const rangeDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    const filteredOrders = orders.filter((o) => new Date(o.date) >= startDate);
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const filteredVisits = visits.filter((v) => new Date(v.timestamp) >= startDate);
    const totalVisits = filteredVisits.length;

    const productSales: Record<string, { quantity: number; revenue: number }> = {};
    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!item?.product?.id) return;
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { quantity: 0, revenue: 0 };
        }
        productSales[item.product.id].quantity += (Number(item.quantity) || 0);
        productSales[item.product.id].revenue += (Number(item.product.price) || 0) * (Number(item.quantity) || 0);
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, stats]) => {
        const product = products.find((p) => p.id === id);
        return {
          id: id,
          name: product?.name || "منتج غير معروف",
          image: product?.image || "",
          quantity: stats.quantity,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const liveVisitors = new Set(
      visits.filter((v) => new Date(v.timestamp) >= fifteenMinutesAgo).map((v) => v.sessionId)
    ).size;

    return {
      totalRevenue,
      totalOrders,
      totalVisits,
      liveVisitors,
      topProducts,
    };
  }, [orders, visits, products, timeRange]);

  const chartData = useMemo(() => {
    const data: any[] = [];
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });

      const dayVisits = visits.filter((v) => new Date(v.timestamp).toDateString() === date.toDateString());
      const dayOrders = orders.filter((o) => new Date(o.date).toDateString() === date.toDateString());
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      data.push({
        name: dateStr,
        الزيارات: dayVisits.length,
        المبيعات: dayRevenue,
      });
    }
    return data;
  }, [visits, orders, timeRange]);

  const exportToCSV = () => {
    setIsExporting(true);
    logActivity("تصدير بيانات", "تم تصدير تقرير التقرير العام");

    const headers = ["Order ID", "Date", "Total", "Status"];
    const rows = orders.map((o) => [o.id, o.date, o.total, o.status]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setIsExporting(false);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-solar/10 rounded-full text-solar font-bold text-xs uppercase tracking-widest border border-solar/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-solar opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-solar"></span>
            </span>
            نظرة عامة ومبسطة
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-carbon tracking-tight drop-shadow-sm">
            أداء المتجر
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-lg leading-relaxed">
            متابعة شاملة لأداء متجرك، المبيعات، ومعدلات التحويل بأرقام واضحة تدعم قراراتك.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 z-10">
          <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { label: "7 أيام", value: "7d" },
              { label: "30 يوم", value: "30d" },
              { label: "90 يوم", value: "90d" },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  timeRange === range.value
                    ? "bg-carbon text-white shadow-lg scale-105"
                    : "text-slate-500 hover:text-carbon hover:bg-slate-100"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="group flex items-center gap-2 bg-gradient-to-r from-solar/90 to-solar px-6 py-3.5 rounded-2xl text-sm font-black text-carbon hover:scale-105 hover:shadow-gold-lg transition-all duration-300 disabled:opacity-50 border border-solar/50"
          >
            {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
            تنزيل التقرير
          </button>
        </div>
      </div>

      {/* Hero Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            label: "إجمالي الإيرادات",
            value: formatPrice(metrics.totalRevenue),
            icon: CreditCard,
            color: "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 border-emerald-100",
            desc: "مجموع قيمة المبيعات المكتملة",
          },
          {
            label: "إجمالي الطلبات",
            value: metrics.totalOrders,
            icon: ShoppingCart,
            color: "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 border-blue-100",
            desc: "عدد الطلبات خلال الفترة",
          },
          {
            label: "حركة الزوار",
            value: metrics.totalVisits.toLocaleString(),
            icon: Users,
            color: "bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 border-purple-100",
            desc: "مرات زيارة المتجر",
          },
          {
            label: "متواجدون الآن",
            value: metrics.liveVisitors,
            icon: Activity,
            color: "bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 border-rose-100",
            desc: "الزوار النشطون في هذه اللحظة",
          },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={stat.label}
            className="group relative bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:border-slate-200 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-100/50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-500 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-500">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-carbon tracking-tight drop-shadow-sm">{stat.value}</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-4">
                {stat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-solar/5 rounded-full blur-3xl -z-10 group-hover:bg-solar/10 transition-colors duration-700"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4 relative z-10">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-carbon flex items-center gap-3">
              <span className="p-2 bg-solar/10 text-solar rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </span>
              مؤشرات الأداء
            </h3>
            <p className="text-sm text-slate-400 font-medium max-w-sm">
              تتبع مسار مبيعاتك وزياراتك في رسم بياني موحد لسهولة فهم حركة متجرك.
            </p>
          </div>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setChartView("sales")}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${chartView === "sales" ? "bg-white text-carbon shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              المبيعات
            </button>
            <button
              onClick={() => setChartView("visits")}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${chartView === "visits" ? "bg-white text-carbon shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
            >
              الزيارات
            </button>
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5C76B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E5C76B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F1115" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F1115" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              {chartView === "sales" ? (
                <Area type="monotone" dataKey="المبيعات" stroke="#E5C76B" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" filter="drop-shadow(0px 4px 6px rgba(229,199,107,0.3))" />
              ) : (
                <Area type="monotone" dataKey="الزيارات" stroke="#0F1115" strokeWidth={5} fillOpacity={1} fill="url(#colorVisits)" filter="drop-shadow(0px 4px 6px rgba(15,17,21,0.2))" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 gap-8">
        {/* Top Products */}
        <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-carbon mb-2">المنتجات الأكثر مبيعاً</h3>
            <p className="text-sm text-slate-400 font-medium">المنتجات التي تحقق لك أعلى معدلات طلب.</p>
          </div>
          <div className="space-y-3 flex-1 flex flex-col">
            {metrics.topProducts.map((product, i) => (
              <div key={product.id} className="group flex items-center justify-between p-4 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="relative w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50 group-hover:border-solar/30 transition-colors">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400 absolute inset-0 m-auto" />
                    )}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-carbon text-solar text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-bold text-slate-700 block mb-1 group-hover:text-carbon transition-colors">
                      {product.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                      مباع: <span className="font-bold text-carbon">{product.quantity}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-emerald-600">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              </div>
            ))}
            {metrics.topProducts.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-3xl flex-1 flex items-center justify-center border border-dashed border-slate-200">
                لا توجد مبيعات في هذه الفترة
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
