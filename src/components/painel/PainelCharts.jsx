import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

export default function PainelCharts({ compromissos, clientes, dataInicio, dataFim }) {
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.split("T")[0];
    return d >= dataInicio && d <= dataFim;
  };

  const abordagens = compromissos.filter(c =>
    c.tipo === "agendado" &&
    (c.status_origem === "AB Visita" || c.status_origem === "AB Fone" || !c.status_origem) &&
    inRange(c.data_inicio)
  ).length;

  const fechamentos = compromissos.filter(c =>
    (c.tipo === "agendado" || c.tipo === "reuniao_realizada") &&
    c.status_origem === "AB Fechamento" &&
    inRange(c.data_inicio)
  ).length;

  const parseCurrency = (val) => {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  };

  const propostasFechadas = clientes.filter(c => c.status === "Venda Feita" && c.dados_apolice).length;

  // Calcular PA total
  const paTotal = clientes
    .filter(c => c.status === "Venda Feita" && c.dados_apolice)
    .reduce((sum, c) => sum + parseCurrency(c.dados_apolice?.total_premio_iof), 0);

  const barData = [
    { name: "Abordagens", valor: abordagens, fill: "#3b82f6" },
    { name: "Fechamentos", valor: fechamentos, fill: "#f59e0b" },
    { name: "Propostas", valor: propostasFechadas, fill: "#10b981" }
  ];

  const pieData = [
    { name: "Abordagens", value: abordagens },
    { name: "Fechamentos", value: fechamentos },
    { name: "Propostas Fechadas", value: propostasFechadas }
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gráfico de Barras - Reuniões */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
        <h3 className="text-white font-bold text-sm mb-3">Quantidade de Reuniões</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} />
              <YAxis tick={{ fill: "#e2e8f0", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff" }}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico PA */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
        <h3 className="text-white font-bold text-sm mb-1">Prêmio Anual (P.A.)</h3>
        <div className="text-center mb-2">
          <span className="text-3xl font-black text-green-400">
            R$ {paTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <p className="text-white/60 text-xs mt-1">{propostasFechadas} proposta(s) fechada(s)</p>
        </div>
        {pieData.length > 0 ? (
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ color: "#e2e8f0", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/50 text-xs text-center py-8">Sem dados para exibir</p>
        )}
      </div>
    </div>
  );
}