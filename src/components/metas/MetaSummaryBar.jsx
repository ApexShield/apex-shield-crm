import { Target } from "lucide-react";

const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações", short: "Lig" },
  { key: "agendamentos_feitos", label: "Agendamentos", short: "Agend" },
  { key: "abs_realizadas", label: "ABs", short: "ABs" },
  { key: "f_realizados", label: "Fechamentos", short: "F" },
  { key: "n_protocoladas", label: "Propostas", short: "Prop" },
  { key: "recs", label: "RECs", short: "REC" },
  { key: "pa", label: "PA", short: "PA", currency: true },
  { key: "cs", label: "CS", short: "CS", currency: true },
];

export default function MetaSummaryBar({ meta }) {
  if (!meta) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl border border-slate-700/50 px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-cyan-400 tracking-wide">
          METAS DEFINIDAS — {meta.periodo_label || meta.periodo}
        </span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {METRICS.map(m => {
          const val = Number(meta[m.key]) || 0;
          return (
            <div key={m.key} className="text-center">
              <p className="text-[10px] text-slate-500 font-semibold">{m.short}</p>
              <p className="text-sm font-black text-white">
                {m.currency ? val.toLocaleString("pt-BR") : val}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}