import { motion } from "framer-motion";
import { Phone, PhoneIncoming, CalendarCheck, MapPin, CheckCircle2, FileText, DollarSign, Shield } from "lucide-react";

const KPI_CONFIG = [
  { key: "ligacoes_realizadas", label: "Ligações Realizadas", icon: Phone, color: "from-blue-500 to-blue-600" },
  { key: "ligacoes_atendidas", label: "Ligações Atendidas", icon: PhoneIncoming, color: "from-cyan-500 to-cyan-600" },
  { key: "agendamentos_feitos", label: "Agendamentos", icon: CalendarCheck, color: "from-green-500 to-green-600" },
  { key: "abs_realizadas", label: "ABs Realizadas", icon: MapPin, color: "from-purple-500 to-purple-600" },
  { key: "f_realizados", label: "F Realizados", icon: CheckCircle2, color: "from-orange-500 to-orange-600" },
  { key: "n_protocoladas", label: "N Protocoladas", icon: FileText, color: "from-red-500 to-red-600" },
  { key: "recs", label: "RECS", icon: Shield, color: "from-indigo-500 to-indigo-600" },
  { key: "pa", label: "PA (Prêmio Anual)", icon: DollarSign, color: "from-emerald-500 to-emerald-600", isCurrency: true },
];

function sumMetric(data, key) {
  return data.reduce((sum, d) => sum + (d[key] || 0), 0);
}

function formatValue(val, isCurrency) {
  if (isCurrency) return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  return val.toLocaleString("pt-BR");
}

export default function DashboardKPICards({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {KPI_CONFIG.map((kpi, idx) => {
        const Icon = kpi.icon;
        const total = sumMetric(data, kpi.key);
        const weeksWithData = [...new Set(data.map(d => d.semana))].length;
        const avg = weeksWithData > 0 ? total / weeksWithData : 0;

        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{formatValue(total, kpi.isCurrency)}</div>
            <div className="text-xs text-slate-400 mt-1">
              Média/sem: {formatValue(Math.round(avg * 100) / 100, kpi.isCurrency)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}