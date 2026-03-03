import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell, LabelList } from "recharts";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const CustomLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6} fill="#374151" fontSize={10} fontWeight={600} textAnchor="middle">
      {value.toLocaleString("pt-BR")}
    </text>
  );
};

export default function DashboardCharts({ data }) {
  const weeklyChartData = useMemo(() => {
    const weeks = {};
    data.forEach(d => {
      const w = d.semana;
      if (!weeks[w]) weeks[w] = { semana: `S${w}`, ligacoes_realizadas: 0, agendamentos_feitos: 0, abs_realizadas: 0, f_realizados: 0, n_protocoladas: 0 };
      weeks[w].ligacoes_realizadas += (d.ligacoes_realizadas || 0);
      weeks[w].agendamentos_feitos += (d.agendamentos_feitos || 0);
      weeks[w].abs_realizadas += (d.abs_realizadas || 0);
      weeks[w].f_realizados += (d.f_realizados || 0);
      weeks[w].n_protocoladas += (d.n_protocoladas || 0);
    });
    return Object.values(weeks).sort((a, b) => parseInt(a.semana.replace("S","")) - parseInt(b.semana.replace("S","")));
  }, [data]);

  const conversionData = useMemo(() => {
    const totals = { lig_real: 0, lig_atend: 0, agend: 0, abs_real: 0, f_real: 0, n_prot: 0 };
    data.forEach(d => {
      totals.lig_real += (d.ligacoes_realizadas || 0);
      totals.lig_atend += (d.ligacoes_atendidas || 0);
      totals.agend += (d.agendamentos_feitos || 0);
      totals.abs_real += (d.abs_realizadas || 0);
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
      {/* Weekly Trend with data labels */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-800 mb-4">Evolução Semanal</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={weeklyChartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ligacoes_realizadas" name="Ligações" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }}>
              <LabelList dataKey="ligacoes_realizadas" position="top" style={{ fontSize: 10, fontWeight: 600, fill: "#6366f1" }} />
            </Line>
            <Line type="monotone" dataKey="agendamentos_feitos" name="Agendamentos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }}>
              <LabelList dataKey="agendamentos_feitos" position="top" style={{ fontSize: 10, fontWeight: 600, fill: "#10b981" }} />
            </Line>
            <Line type="monotone" dataKey="abs_realizadas" name="ABs Real." stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }}>
              <LabelList dataKey="abs_realizadas" position="bottom" style={{ fontSize: 10, fontWeight: 600, fill: "#f59e0b" }} />
            </Line>
            <Line type="monotone" dataKey="f_realizados" name="F Real." stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }}>
              <LabelList dataKey="f_realizados" position="bottom" style={{ fontSize: 10, fontWeight: 600, fill: "#ef4444" }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel bar chart with labels */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-800 mb-4">Funil de Conversão (Total)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={conversionData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
            <Tooltip />
            <Bar dataKey="value" name="Total" radius={[0, 6, 6, 0]}>
              {conversionData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
              <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly comparison bars with labels */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
        <h3 className="font-bold text-slate-800 mb-4">Comparativo Semanal</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={weeklyChartData} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ligacoes_realizadas" name="Ligações" fill="#6366f1" radius={[4, 4, 0, 0]}>
              <LabelList content={CustomLabel} />
            </Bar>
            <Bar dataKey="agendamentos_feitos" name="Agend." fill="#10b981" radius={[4, 4, 0, 0]}>
              <LabelList content={CustomLabel} />
            </Bar>
            <Bar dataKey="abs_realizadas" name="ABs" fill="#f59e0b" radius={[4, 4, 0, 0]}>
              <LabelList content={CustomLabel} />
            </Bar>
            <Bar dataKey="f_realizados" name="F Real." fill="#ef4444" radius={[4, 4, 0, 0]}>
              <LabelList content={CustomLabel} />
            </Bar>
            <Bar dataKey="n_protocoladas" name="N Prot." fill="#8b5cf6" radius={[4, 4, 0, 0]}>
              <LabelList content={CustomLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}