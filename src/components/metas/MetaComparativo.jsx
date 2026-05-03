import { Button } from "@/components/ui/button";
import { Pencil, Target, TrendingUp, TrendingDown, User } from "lucide-react";
import MetaPerformanceChart from "./MetaPerformanceChart";
import MetaIndividualChart from "./MetaIndividualChart";
import MetaSummaryBar from "./MetaSummaryBar";

const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações Realizadas" },
  { key: "agendamentos_feitos", label: "Agendamentos Feitos" },
  { key: "abs_realizadas", label: "ABs Realizadas" },
  { key: "f_realizados", label: "F Realizados" },
  { key: "n_protocoladas", label: "Propostas Realizadas" },
  { key: "recs", label: "REC Realizadas" },
  { key: "pa", label: "PA Realizado" },
  { key: "cs", label: "CS Realizado" },
];

function calcRealized(data, key) {
  return data.reduce((sum, d) => sum + (Number(d[key]) || 0), 0);
}

export default function MetaComparativo({ data, metas, onEdit, showOwner, periodoLabel }) {
  if (metas.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 p-10 text-center">
        <Target className="w-14 h-14 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 font-semibold text-lg">
          {periodoLabel
            ? `Nenhuma meta definida para ${periodoLabel}`
            : "Nenhuma meta definida ainda"}
        </p>
        <p className="text-slate-500 text-sm mt-1">Clique em "Definir Meta" para começar a acompanhar sua performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {metas.map(meta => {
        // When showing aggregate view, filter records by meta owner
        const metaRecords = showOwner && meta.created_by
          ? data.filter(r => r.created_by === meta.created_by)
          : data;

        const metricsData = METRICS.map(m => ({
          ...m,
          metaVal: Number(meta[m.key]) || 0,
          realizado: Math.round(calcRealized(metaRecords, m.key) * 100) / 100,
        }));

        const ownerName = meta._owner_nome || "";

        return (
          <div key={meta.id} className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl md:rounded-2xl border border-slate-700/50 px-3 py-3 md:px-5 md:py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg" style={{ boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}>
                  <Target className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-lg">{meta.periodo_label || meta.periodo}</h3>
                  {showOwner && ownerName && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs text-cyan-400 font-medium">{ownerName}</span>
                    </div>
                  )}
                  {!showOwner && <p className="text-slate-500 text-xs">Acompanhamento de metas</p>}
                </div>
              </div>
              {onEdit && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(meta)} className="text-slate-400 hover:text-white hover:bg-white/10 h-7 md:h-8 gap-1 border border-slate-700 text-[10px] md:text-xs px-2 md:px-3">
                  <Pencil className="w-2.5 h-2.5 md:w-3 md:h-3" /> Editar
                </Button>
              )}
            </div>

            {/* Summary Bar */}
            <MetaSummaryBar meta={meta} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="lg:col-span-1">
                <MetaPerformanceChart metrics={metricsData} />
              </div>
              <div className="lg:col-span-2 grid grid-cols-4 gap-1.5 md:gap-3">
                {metricsData.map((m, idx) => (
                  <MetaIndividualChart
                    key={m.key}
                    label={m.label}
                    metaVal={m.metaVal}
                    realizado={m.realizado}
                    colorIdx={idx}
                  />
                ))}
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl md:rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-2 md:px-4 py-2 md:py-3 text-slate-400 font-semibold text-[10px] md:text-xs tracking-wider">INDICADOR</th>
                      <th className="text-center px-1.5 md:px-3 py-2 md:py-3 text-cyan-400 font-semibold text-[10px] md:text-xs tracking-wider">META</th>
                      <th className="text-center px-1.5 md:px-3 py-2 md:py-3 text-emerald-400 font-semibold text-[10px] md:text-xs tracking-wider">REAL.</th>
                      <th className="text-center px-1.5 md:px-3 py-2 md:py-3 text-slate-400 font-semibold text-[10px] md:text-xs tracking-wider">%</th>
                      <th className="text-center px-1.5 md:px-3 py-2 md:py-3 text-slate-400 font-semibold text-[10px] md:text-xs tracking-wider hidden md:table-cell">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsData.map((m, idx) => {
                      const pct = m.metaVal > 0 ? Math.round((m.realizado / m.metaVal) * 100) : (m.realizado > 0 ? 100 : 0);
                      const atingiu = pct >= 100;
                      const barWidth = Math.min(pct, 100);
                      const isCurrency = m.key === "pa" || m.key === "cs";

                      return (
                        <tr key={m.key} className={`border-b border-slate-800/50 ${idx % 2 === 0 ? "bg-slate-900/30" : ""}`}>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-white font-medium text-[11px] md:text-sm">{m.label}</td>
                          <td className="text-center px-1.5 md:px-3 py-2 md:py-3 text-cyan-300 font-semibold text-[11px] md:text-sm">
                            {isCurrency ? m.metaVal.toLocaleString("pt-BR") : m.metaVal}
                          </td>
                          <td className="text-center px-1.5 md:px-3 py-2 md:py-3 text-emerald-300 font-semibold text-[11px] md:text-sm">
                            {isCurrency ? m.realizado.toLocaleString("pt-BR") : m.realizado}
                          </td>
                          <td className="text-center px-1.5 md:px-3 py-2 md:py-3">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-[10px] md:text-xs font-bold ${atingiu ? "text-green-400" : pct >= 70 ? "text-amber-400" : "text-red-400"}`}>
                                {pct}%
                              </span>
                              <div className="w-10 md:w-20 h-1 md:h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${barWidth}%`,
                                    background: atingiu
                                      ? "linear-gradient(90deg, #00e676, #76ff03)"
                                      : pct >= 70
                                      ? "linear-gradient(90deg, #ffea00, #ff6d00)"
                                      : "linear-gradient(90deg, #ff1744, #ff6d00)",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-1.5 md:px-3 py-2 md:py-3 hidden md:table-cell">
                            {m.metaVal === 0 ? (
                              <span className="text-xs text-slate-600">—</span>
                            ) : atingiu ? (
                              <div className="flex items-center justify-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-xs font-bold text-green-400">Atingida</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-xs font-bold text-red-400">
                                  Falta {isCurrency ? (m.metaVal - m.realizado).toLocaleString("pt-BR") : (m.metaVal - m.realizado)}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}