import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const STATUS_COLORS = {
  "Novo": "#800080",
  "AB Fone": "#FF69B4",
  "AB Visita": "#87CEEB",
  "AB Fechamento": "#FFD700",
  "Delay": "#00FFFF",
  "Análise": "#A52A2A",
  "Venda Feita": "#228B22",
  "Entrega de Apólice": "#C8A2C8",
  "Encerrado": "#696969"
};

export default function FunilVendas({ clientes }) {
  const data = useMemo(() => {
    const counts = {};
    
    Object.keys(STATUS_COLORS).forEach(status => {
      counts[status] = 0;
    });

    clientes.forEach(cliente => {
      if (counts[cliente.status] !== undefined) {
        counts[cliente.status]++;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name]
      }))
      .filter(item => item.value > 0);
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