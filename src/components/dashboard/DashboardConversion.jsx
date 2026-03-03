import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

export default function DashboardConversion({ data }) {
  const totals = useMemo(() => {
    const t = { lig_real: 0, lig_atend: 0, agend: 0, abs_marc: 0, abs_real: 0, f_agend: 0, f_real: 0, n_prot: 0 };
    data.forEach(d => {
      t.lig_real += (d.ligacoes_realizadas || 0);
      t.lig_atend += (d.ligacoes_atendidas || 0);
      t.agend += (d.agendamentos_feitos || 0);
      t.abs_marc += (d.abs_marcadas || 0);
      t.abs_real += (d.abs_realizadas || 0);
      t.f_agend += (d.f_agendados || 0);
      t.f_real += (d.f_realizados || 0);
      t.n_prot += (d.n_protocoladas || 0);
    });
    return t;
  }, [data]);

  const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) + "%" : "-";
  const getColor = (v) => {
    const num = parseFloat(v);
    if (isNaN(num)) return "text-slate-400";
    if (num >= 50) return "text-green-600";
    if (num >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const conversions = [
    { from: "Lig. Realizadas", to: "Lig. Atendidas", rate: pct(totals.lig_atend, totals.lig_real) },
    { from: "Lig. Atendidas", to: "Agendamentos", rate: pct(totals.agend, totals.lig_atend) },
    { from: "ABs Marcadas", to: "ABs Realizadas", rate: pct(totals.abs_real, totals.abs_marc) },
    { from: "F Agendados", to: "F Realizados", rate: pct(totals.f_real, totals.f_agend) },
    { from: "F Realizados", to: "N Protocoladas", rate: pct(totals.n_prot, totals.f_real) },
    { from: "Lig. Atendidas", to: "ABs Realizadas", rate: pct(totals.abs_real, totals.lig_atend) },
    { from: "ABs Realizadas", to: "F Realizados", rate: pct(totals.f_real, totals.abs_real) },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-800 mb-4">Taxas de Conversão</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {conversions.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-medium">{c.from}</div>
            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <div className="text-xs text-slate-600 font-medium">{c.to}</div>
            <div className={`ml-auto text-sm font-bold ${getColor(c.rate)}`}>{c.rate}</div>
          </div>
        ))}
      </div>
    </div>
  );
}