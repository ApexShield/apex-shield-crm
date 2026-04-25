import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const NEON_COLORS = [
  "#00e5ff", // cyan neon
  "#76ff03", // green neon
  "#ff6d00", // orange neon
  "#d500f9", // purple neon
  "#ffea00", // yellow neon
  "#00e676", // emerald neon
  "#ff1744", // red neon
  "#2979ff", // blue neon
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-white font-semibold text-xs">{d.name}</p>
      <p className="text-slate-300 text-xs">Meta: <span className="text-cyan-400 font-bold">{d.meta.toLocaleString("pt-BR")}</span></p>
      <p className="text-slate-300 text-xs">Realizado: <span className="text-emerald-400 font-bold">{d.realizado.toLocaleString("pt-BR")}</span></p>
      <p className="text-slate-300 text-xs">Atingido: <span className={`font-bold ${d.pct >= 100 ? "text-green-400" : d.pct >= 70 ? "text-amber-400" : "text-red-400"}`}>{d.pct}%</span></p>
    </div>
  );
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, payload }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={10} fontWeight={600}>
      {payload.pct}%
    </text>
  );
}

export default function MetaPieChart({ data, metrics }) {
  const chartData = useMemo(() => {
    return metrics
      .map((m, i) => {
        const meta = Number(m.metaVal) || 0;
        const realizado = Number(m.realizado) || 0;
        if (meta === 0 && realizado === 0) return null;
        const pct = meta > 0 ? Math.round((realizado / meta) * 100) : (realizado > 0 ? 100 : 0);
        return {
          name: m.label,
          value: Math.max(realizado, 1),
          meta,
          realizado,
          pct,
          color: NEON_COLORS[i % NEON_COLORS.length],
        };
      })
      .filter(Boolean);
  }, [metrics]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-5 shadow-xl">
      <h3 className="text-sm font-bold text-slate-300 mb-3 text-center tracking-wide">PERFORMANCE GERAL</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={3}
            dataKey="value"
            label={CustomLabel}
            stroke="transparent"
          >
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.color}
                style={{ filter: `drop-shadow(0 0 6px ${entry.color}80)` }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {chartData.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
            <span className="text-[10px] text-slate-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}