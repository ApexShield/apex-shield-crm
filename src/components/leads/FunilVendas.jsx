import { useMemo } from "react";
import { Archive } from "lucide-react";

const FUNNEL_STAGES = [
  { key: "Novo", label: "Novo", color: "#00ff88", glow: "0 0 12px #00ff8855" },
  { key: "AB Fone", label: "AB Fone", color: "#00d4ff", glow: "0 0 12px #00d4ff55" },
  { key: "AB Visita", label: "AB Visita", color: "#a78bfa", glow: "0 0 12px #a78bfa55" },
  { key: "AB Fechamento", label: "AB Fechamento", color: "#f472b6", glow: "0 0 12px #f472b655" },
  { key: "Delay", label: "Delay", color: "#fbbf24", glow: "0 0 12px #fbbf2455" },
  { key: "Análise", label: "Análise", color: "#fb923c", glow: "0 0 12px #fb923c55" },
  { key: "Venda Feita", label: "Venda Feita", color: "#34d399", glow: "0 0 12px #34d39955" },
  { key: "Entrega de Apólice", label: "Entrega Apólice", color: "#22d3ee", glow: "0 0 12px #22d3ee55" },
];

export default function FunilVendas({ clientes }) {
  const { stages, encerradoCount } = useMemo(() => {
    const counts = {};
    let enc = 0;
    FUNNEL_STAGES.forEach(s => { counts[s.key] = 0; });
    clientes.forEach(c => {
      if (c.status === "Encerrado") enc++;
      else if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return {
      stages: FUNNEL_STAGES.map(s => ({ ...s, count: counts[s.key] })),
      encerradoCount: enc
    };
  }, [clientes]);

  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded-xl border border-slate-700/50 p-4">
      <h3 className="text-sm font-bold text-white mb-3 text-center tracking-wide">
        ⚡ Funil de Vendas
      </h3>

      {/* Funnel triangle */}
      <div className="flex flex-col items-center gap-0.5">
        {stages.map((stage, i) => {
          const widthPct = 100 - (i * (70 / (stages.length - 1 || 1)));
          const pct = total > 0 ? ((stage.count / total) * 100).toFixed(1) : "0.0";

          return (
            <div key={stage.key} className="w-full flex justify-center" style={{ maxWidth: `${widthPct}%` }}>
              <div
                className="w-full relative flex items-center justify-between px-3 py-1.5 transition-all hover:scale-[1.02]"
                style={{
                  background: `${stage.color}18`,
                  borderLeft: `3px solid ${stage.color}`,
                  borderRight: `3px solid ${stage.color}`,
                  borderTop: i === 0 ? `2px solid ${stage.color}` : "none",
                  borderBottom: i === stages.length - 1 ? `2px solid ${stage.color}` : "none",
                  boxShadow: stage.glow,
                  borderRadius: i === 0 ? "8px 8px 0 0" : i === stages.length - 1 ? "0 0 8px 8px" : "0",
                }}
              >
                <span className="text-[11px] font-bold truncate" style={{ color: stage.color }}>
                  {stage.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm tabular-nums">{stage.count}</span>
                  <span className="text-[10px] font-medium" style={{ color: `${stage.color}aa` }}>
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Encerrado - arquivo morto */}
      <div className="mt-3 pt-2 border-t border-slate-700/40">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-600/30">
          <div className="flex items-center gap-1.5">
            <Archive className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-400">Encerrado</span>
          </div>
          <span className="text-slate-300 font-bold text-sm">{encerradoCount}</span>
        </div>
      </div>

      {/* Total */}
      <div className="mt-2 text-center">
        <span className="text-[10px] text-slate-500">Total no funil: <strong className="text-slate-300">{total}</strong></span>
      </div>
    </div>
  );
}