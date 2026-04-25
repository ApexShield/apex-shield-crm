import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const NEON_PAIRS = [
  { done: "#00e5ff", remain: "#1e293b" },
  { done: "#76ff03", remain: "#1e293b" },
  { done: "#ff6d00", remain: "#1e293b" },
  { done: "#d500f9", remain: "#1e293b" },
  { done: "#ffea00", remain: "#1e293b" },
  { done: "#00e676", remain: "#1e293b" },
  { done: "#ff1744", remain: "#1e293b" },
  { done: "#2979ff", remain: "#1e293b" },
];

export default function MetaIndividualChart({ label, metaVal, realizado, colorIdx }) {
  const pct = metaVal > 0 ? Math.min(Math.round((realizado / metaVal) * 100), 100) : (realizado > 0 ? 100 : 0);
  const fullPct = metaVal > 0 ? Math.round((realizado / metaVal) * 100) : (realizado > 0 ? 100 : 0);
  const colors = NEON_PAIRS[colorIdx % NEON_PAIRS.length];
  const atingiu = fullPct >= 100;

  const data = [
    { name: "Realizado", value: pct },
    { name: "Falta", value: 100 - pct },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-3 flex flex-col items-center shadow-lg">
      <p className="text-[11px] font-bold text-slate-400 tracking-wide text-center mb-1 truncate w-full">{label}</p>
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={40}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={colors.done} style={{ filter: `drop-shadow(0 0 8px ${colors.done}90)` }} />
              <Cell fill={colors.remain} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black ${atingiu ? "text-green-400" : "text-white"}`}>{fullPct}%</span>
        </div>
      </div>
      <div className="mt-1 text-center">
        <p className="text-[10px] text-slate-500">
          <span className="font-bold" style={{ color: colors.done }}>{realizado.toLocaleString("pt-BR")}</span>
          {" / "}
          <span className="text-slate-400">{metaVal.toLocaleString("pt-BR")}</span>
        </p>
      </div>
    </div>
  );
}