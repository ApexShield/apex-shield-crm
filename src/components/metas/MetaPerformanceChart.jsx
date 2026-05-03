import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useMemo } from "react";

const NEON_COLORS = [
  "#00e5ff", "#76ff03", "#ff6d00", "#d500f9",
  "#ffea00", "#00e676", "#ff1744", "#2979ff",
];

function getBarColor(pct) {
  if (pct >= 100) return "#00e676";
  if (pct >= 70) return "#ffea00";
  return "#ff1744";
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isCurrency = d.key === "pa" || d.key === "cs";
  const fmt = (v) => isCurrency ? v.toLocaleString("pt-BR") : v.toLocaleString("pt-BR");
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-white font-semibold text-xs">{d.label}</p>
      <p className="text-slate-300 text-xs">Meta: <span className="text-cyan-400 font-bold">{fmt(d.meta)}</span></p>
      <p className="text-slate-300 text-xs">Realizado: <span className="text-emerald-400 font-bold">{fmt(d.realizado)}</span></p>
      <p className="text-slate-300 text-xs">Atingimento: <span className={`font-bold ${d.pct >= 100 ? "text-green-400" : d.pct >= 70 ? "text-amber-400" : "text-red-400"}`}>{d.pct}%</span></p>
    </div>
  );
}

export default function MetaPerformanceChart({ metrics }) {
  const chartData = useMemo(() => {
    return metrics
      .filter(m => m.metaVal > 0 || m.realizado > 0)
      .map((m, i) => ({
        label: m.label.replace("Realizad", "").replace("as", "").replace("os", "").trim(),
        fullLabel: m.label,
        key: m.key,
        meta: m.metaVal,
        realizado: m.realizado,
        pct: m.metaVal > 0 ? Math.round((m.realizado / m.metaVal) * 100) : (m.realizado > 0 ? 100 : 0),
        color: NEON_COLORS[i % NEON_COLORS.length],
      }));
  }, [metrics]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-5 shadow-xl">
      <h3 className="text-sm font-bold text-slate-300 mb-4 text-center tracking-wide">PERFORMANCE GERAL — % ATINGIMENTO</h3>
      <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 42)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, (max) => Math.max(max, 110)]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#475569" }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="fullLabel"
            width={130}
            tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: "#475569" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <ReferenceLine x={100} stroke="#00e676" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "100%", fill: "#00e676", fontSize: 10, position: "top" }} />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={24}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getBarColor(entry.pct)} style={{ filter: `drop-shadow(0 0 4px ${getBarColor(entry.pct)}60)` }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}