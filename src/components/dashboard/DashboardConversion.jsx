import { useMemo } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : null;

  const conversions = [
    { from: "Ligações Realizadas", fromVal: totals.lig_real, to: "Ligações Atendidas", toVal: totals.lig_atend, rate: pct(totals.lig_atend, totals.lig_real) },
    { from: "Ligações Atendidas", fromVal: totals.lig_atend, to: "Agendamentos", toVal: totals.agend, rate: pct(totals.agend, totals.lig_atend) },
    { from: "ABs Marcadas", fromVal: totals.abs_marc, to: "ABs Realizadas", toVal: totals.abs_real, rate: pct(totals.abs_real, totals.abs_marc) },
    { from: "F Agendados", fromVal: totals.f_agend, to: "F Realizados", toVal: totals.f_real, rate: pct(totals.f_real, totals.f_agend) },
    { from: "F Realizados", fromVal: totals.f_real, to: "N Protocoladas", toVal: totals.n_prot, rate: pct(totals.n_prot, totals.f_real) },
    { from: "Ligações Atendidas", fromVal: totals.lig_atend, to: "ABs Realizadas", toVal: totals.abs_real, rate: pct(totals.abs_real, totals.lig_atend) },
    { from: "ABs Realizadas", fromVal: totals.abs_real, to: "F Realizados", toVal: totals.f_real, rate: pct(totals.f_real, totals.abs_real) },
  ];

  const getColor = (v) => {
    const num = parseFloat(v);
    if (isNaN(num) || v === null) return { text: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" };
    if (num >= 50) return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (num >= 30) return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    return { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  };

  const getIcon = (v) => {
    const num = parseFloat(v);
    if (isNaN(num) || v === null) return <Minus className="w-4 h-4 text-slate-400" />;
    if (num >= 50) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (num >= 30) return <Minus className="w-4 h-4 text-amber-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-lg text-slate-800">Taxas de Conversão</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {conversions.map((c, idx) => {
          const colors = getColor(c.rate);
          return (
            <div
              key={idx}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {c.rate !== null ? `${c.rate}%` : "-"}
                </div>
                {getIcon(c.rate)}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">De</div>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">{c.from}</div>
                  <div className="text-xs text-slate-500 font-medium">{c.fromVal.toLocaleString("pt-BR")}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Para</div>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">{c.to}</div>
                  <div className="text-xs text-slate-500 font-medium">{c.toVal.toLocaleString("pt-BR")}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    parseFloat(c.rate) >= 50 ? "bg-emerald-500" :
                    parseFloat(c.rate) >= 30 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(parseFloat(c.rate) || 0, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}