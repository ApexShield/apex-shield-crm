import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const FUNIL_STAGES = [
  { label: "Cotações", color: "#8e44ad" },
  { label: "Propostas em andamento", color: "#e74c3c" },
  { label: "Assinatura pendente", color: "#3498db" },
  { label: "Propostas finalizadas", color: "#95c45d" },
  { label: "Propostas transmitidas", color: "#f39c12" }
];

export default function FunilVendas({ clientes }) {
  const data = useMemo(() => {
    const counts = {
      "Cotações": 0,
      "Propostas em andamento": 0,
      "Assinatura pendente": 0,
      "Propostas finalizadas": 0,
      "Propostas transmitidas": 0
    };

    clientes.forEach(cliente => {
      switch(cliente.status) {
        case "Novo":
        case "AB Fone":
          counts["Cotações"]++;
          break;
        case "AB Visita":
        case "AB Fechamento":
        case "Delay":
          counts["Propostas em andamento"]++;
          break;
        case "Análise":
          counts["Assinatura pendente"]++;
          break;
        case "Venda Feita":
          counts["Propostas finalizadas"]++;
          break;
        case "Entrega de Apólice":
        case "Encerrado":
          counts["Propostas transmitidas"]++;
          break;
      }
    });

    return FUNIL_STAGES.map(stage => ({
      name: stage.label,
      value: counts[stage.label],
      color: stage.color
    })).filter(item => item.value > 0);
  }, [clientes]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">Funil de venda</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ value }) => value}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend 
            wrapperStyle={{ fontSize: '10px' }}
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}