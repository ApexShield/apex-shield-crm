import { useMemo } from "react";

const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações realizadas" },
  { key: "ligacoes_atendidas", label: "Ligações atendidas" },
  { key: "agendamentos_feitos", label: "Agendamentos feitos" },
  { key: "abs_marcadas", label: "ABs marcadas" },
  { key: "abs_realizadas", label: "ABs realizadas" },
  { key: "f_agendados", label: "F agendados" },
  { key: "f_realizados", label: "F realizados" },
  { key: "n_protocoladas", label: "N protocoladas" },
  { key: "recs", label: "RECS" },
  { key: "pa", label: "PA", isCurrency: true },
  { key: "cs", label: "CS", isCurrency: true },
];

export default function DashboardWeeklyTable({ data, maxWeeks }) {
  const weeklyData = useMemo(() => {
    const weeks = {};
    data.forEach(d => {
      const w = d.semana;
      if (!weeks[w]) {
        weeks[w] = {};
        METRICS.forEach(m => { weeks[w][m.key] = 0; });
      }
      METRICS.forEach(m => { weeks[w][m.key] += (d[m.key] || 0); });
    });
    return weeks;
  }, [data]);

  const weekNumbers = Array.from({ length: maxWeeks }, (_, i) => i + 1);
  const displayWeeks = weekNumbers.filter(w => weeklyData[w]);

  if (displayWeeks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        Nenhum dado semanal disponível
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Funil Semanal Detalhado</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[160px]">
                Indicador
              </th>
              {displayWeeks.map(w => (
                <th key={w} className="text-center px-3 py-3 font-semibold text-slate-600 min-w-[80px]">
                  Sem {w}
                </th>
              ))}
              <th className="text-center px-3 py-3 font-bold text-indigo-700 min-w-[80px] bg-indigo-50">TOTAL</th>
              <th className="text-center px-3 py-3 font-bold text-indigo-700 min-w-[80px] bg-indigo-50">MÉDIA</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, idx) => {
              const total = displayWeeks.reduce((s, w) => s + (weeklyData[w]?.[m.key] || 0), 0);
              const avg = displayWeeks.length > 0 ? total / displayWeeks.length : 0;
              const fmt = (v) => m.isCurrency ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : v.toLocaleString("pt-BR");

              return (
                <tr key={m.key} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className={`px-4 py-2.5 font-medium text-slate-700 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    {m.label}
                  </td>
                  {displayWeeks.map(w => (
                    <td key={w} className="text-center px-3 py-2.5 text-slate-600">
                      {fmt(weeklyData[w]?.[m.key] || 0)}
                    </td>
                  ))}
                  <td className="text-center px-3 py-2.5 font-bold text-indigo-700 bg-indigo-50/50">
                    {fmt(total)}
                  </td>
                  <td className="text-center px-3 py-2.5 font-semibold text-indigo-600 bg-indigo-50/50">
                    {fmt(Math.round(avg * 100) / 100)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}