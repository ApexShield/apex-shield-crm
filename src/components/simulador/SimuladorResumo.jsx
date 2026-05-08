import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, ArrowUpRight, Shield } from "lucide-react";
import { SEGURADORAS } from "./tabelasReajuste";

const fmt = (v) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : "—";

export default function SimuladorResumo({ projecoes, idadeInicial, valorInicial }) {
  if (!projecoes?.dados?.length) return null;

  const ultimoPonto = projecoes.dados[projecoes.dados.length - 1];
  const idadeFinal = ultimoPonto.idade;

  // Calcular totais acumulados pagos ao longo dos anos (soma de todos os anos)
  const totaisPagos = {};
  SEGURADORAS.forEach(seg => {
    totaisPagos[seg.id] = projecoes.dados.reduce((sum, p) => sum + (p[seg.id] || 0), 0);
  });

  // Economia da MetLife vs cada seguradora
  const metlifeTotal = totaisPagos["metlife"];
  const metlifeFinal = ultimoPonto["metlife"];

  // Marcos de 10, 20, 30 anos
  const marcos = [10, 20, 30].filter(m => m <= projecoes.anosProjecao);

  return (
    <div className="space-y-4">
      {/* Cards de resumo dos marcos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {marcos.map(anos => {
          const ponto = projecoes.dados.find(p => p.ano === anos);
          if (!ponto) return null;

          return (
            <Card key={anos} className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Em {anos} anos
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Idade {ponto.idade}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {SEGURADORAS.map(seg => {
                    const val = ponto[seg.id];
                    const aumento = ((val / valorInicial - 1) * 100).toFixed(0);
                    return (
                      <div key={seg.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: seg.cor }}
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {seg.nome}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {fmt(val)}
                          </span>
                          <span className={`text-[9px] ml-1 ${seg.destaque ? 'text-green-600' : 'text-red-500'}`}>
                            +{aumento}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela de economia da MetLife */}
      <Card className="border-green-200 dark:border-green-800 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">
            Economia com a MetLife vs Concorrentes
          </span>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Seguradora
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Valor Final ({idadeFinal} anos)
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Total Acumulado
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Economia MetLife
                  </th>
                </tr>
              </thead>
              <tbody>
                {SEGURADORAS.map(seg => {
                  const valorFinal = ultimoPonto[seg.id];
                  const total = totaisPagos[seg.id];
                  const economia = total - metlifeTotal;

                  return (
                    <tr
                      key={seg.id}
                      className={`border-b border-slate-100 dark:border-slate-800 ${
                        seg.destaque ? "bg-green-50/50 dark:bg-green-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: seg.cor }}
                          />
                          <span className={`text-xs font-semibold ${seg.destaque ? "text-green-700 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {seg.nome}
                          </span>
                          {seg.destaque && (
                            <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                              IPCA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {fmt(valorFinal)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {fmt(total)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {seg.destaque ? (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            Referência
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                              +{fmt(economia)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}