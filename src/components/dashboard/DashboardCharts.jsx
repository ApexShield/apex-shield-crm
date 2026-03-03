import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardCharts({ data }) {
  const weeklyChartData = useMemo(() => {
    const weeks = {};
    data.forEach(d => {
      const w = d.semana;
      if (!weeks[w]) weeks[w] = { semana: `Sem ${w}`, ligacoes_realizadas: 0, agendamentos_feitos: 0, abs_realizadas: 0, f_realizados: 0, n_protocoladas: 0 };
      weeks[w].ligacoes_realizadas += (d.ligacoes_realizadas || 0);
      weeks[w].agendamentos_feitos += (d.agendamentos_feitos || 0);
      weeks[w].abs_realizadas += (d.abs_realizadas || 0);
      weeks[w].f_realizados += (d.f_realizados || 0);
      weeks[w].n_protocoladas += (d.n_protocoladas || 0);
    });
    return Object.values(weeks).sort((a, b) => parseInt(a.semana.split(" ")[1]) - parseInt(b.semana.split(" ")[1]));
  }, [data]);

  const conversionData = useMemo(() => {
    const totals = { lig_real: 0, lig_atend: 0, agend: 0, abs_marc: 0, abs_real: 0, f_agend: 0, f_real: 0, n_prot: 0 };
    data.forEach(d => {
      totals.lig_real += (d.ligacoes_realizadas || 0);
      totals.lig_atend += (d.ligacoes_atendidas || 0);
      totals.agend += (d.agendamentos_feitos || 0);
      totals.abs_marc += (d.abs_marcadas || 0);
      totals.abs_real += (d.abs_realizadas || 0);
      totals.f_agend += (d.f_agendados || 0);
      totals.f_real += (d.f_realizados || 0);
      totals.n_prot += (d.n_protocoladas || 0);
    });
    return [
      { name: "Lig. Realizadas", value: totals.lig_real },
      { name: "Lig. Atendidas", value: totals.lig_atend },
      { name: "Agendamentos", value: totals.agend },
      { name: "ABs Realizadas", value: totals.abs_real },
      { name: "F Realizados", value: totals.f_real },
      { name: "N Protocoladas", value: totals.n_prot },
    ];
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Weekly Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-800 mb-4">Evolução Semanal</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weeklyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ligacoes_realizadas" name="Ligações" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="agendamentos_feitos" name="Agendamentos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="abs_realizadas" name="ABs Real." stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="f_realizados" name="F Real." stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-800 mb-4">Funil de Conversão (Total)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={conversionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
            <Tooltip />
            <Bar dataKey="value" name="Total" radius={[0, 6, 6, 0]}>
              {conversionData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly comparison bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
        <h3 className="font-bold text-slate-800 mb-4">Comparativo Semanal</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weeklyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ligacoes_realizadas" name="Ligações" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="agendamentos_feitos" name="Agend." fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="abs_realizadas" name="ABs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="f_realizados" name="F Real." fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="n_protocoladas" name="N Prot." fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}