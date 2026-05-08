import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { SEGURADORAS } from "./tabelasReajuste";

const formatCurrency = (v) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-2xl max-w-xs">
      <p className="text-amber-400 font-bold text-sm mb-2">
        Idade: {label} anos
      </p>
      <div className="space-y-1.5">
        {payload
          .sort((a, b) => b.value - a.value)
          .map((entry) => {
            const seg = SEGURADORAS.find(s => s.id === entry.dataKey);
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-300">
                    {seg?.nome || entry.dataKey}
                  </span>
                  {seg?.destaque && (
                    <span className="text-[9px] bg-green-500/20 text-green-400 px-1 rounded">
                      IPCA
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-white">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function SimuladorGrafico({ projecoes, idadeInicial, valorInicial }) {
  if (!projecoes?.dados?.length) return null;

  // Marcadores de faixas importantes
  const marcos = [40, 50, 60, 65, 70];

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-sm">
              Projeção de Reajuste — Cobertura de Morte
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {idadeInicial} → {projecoes.dados[projecoes.dados.length - 1]?.idade} anos
          </span>
        </div>
      </div>
      <CardContent className="p-2 md:p-4">
        <div className="h-[350px] md:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={projecoes.dados}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                opacity={0.3}
              />
              <XAxis
                dataKey="idade"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                label={{ value: "Idade (anos)", position: "insideBottom", offset: -5, fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Linhas de referência para faixas etárias */}
              {marcos
                .filter(m => m > idadeInicial && m <= projecoes.dados[projecoes.dados.length - 1]?.idade)
                .map(m => (
                  <ReferenceLine
                    key={m}
                    x={m}
                    stroke="#475569"
                    strokeDasharray="4 4"
                    opacity={0.5}
                    label={{ value: `${m}`, position: "top", fill: "#64748b", fontSize: 10 }}
                  />
                ))
              }

              {/* MetLife PRIMEIRO — linha mais grossa e destaque */}
              <Line
                key="metlife"
                type="monotone"
                dataKey="metlife"
                name="MetLife"
                stroke="#00A651"
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, fill: "#00A651", stroke: "#fff", strokeWidth: 2 }}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />

              {/* Demais seguradoras */}
              {SEGURADORAS.filter(s => s.id !== "metlife").map((seg, idx) => (
                <Line
                  key={seg.id}
                  type="monotone"
                  dataKey={seg.id}
                  name={seg.nome}
                  stroke={seg.cor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: seg.cor, stroke: "#fff", strokeWidth: 1 }}
                  strokeDasharray={idx % 2 === 0 ? undefined : "6 3"}
                  animationDuration={2000 + (idx * 300)}
                  animationEasing="ease-in-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Label MetLife */}
        <div className="mt-3 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
          <div className="w-8 h-1 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-green-700 dark:text-green-400">
            MetLife — Reajuste apenas pelo IPCA ({projecoes.ipca}% a.a.) sem reenquadramento etário
          </span>
        </div>
      </CardContent>
    </Card>
  );
}