import { Button } from "@/components/ui/button";
import { Pencil, Target, TrendingUp, TrendingDown } from "lucide-react";

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
  { key: "pa", label: "PA (Prêmio Anual)" },
  { key: "cs", label: "CS (Capital Segurado)" },
];

function calcRealized(data, key) {
  return data.reduce((sum, d) => sum + (Number(d[key]) || 0), 0);
}

export default function MetaComparativo({ data, metas, onEdit }) {
  if (metas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Nenhuma meta definida ainda.</p>
        <p className="text-slate-400 text-sm mt-1">Clique em "Definir Meta" para começar a acompanhar sua performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metas.map(meta => {
        return (
          <div key={meta.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white" />
                <h3 className="font-bold text-white">{meta.periodo}</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onEdit(meta)} className="text-white hover:bg-white/20 h-7 gap-1">
                <Pencil className="w-3 h-3" /> Editar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-slate-600 font-semibold">Indicador</th>
                    <th className="text-center px-3 py-2 text-emerald-600 font-semibold">Meta</th>
                    <th className="text-center px-3 py-2 text-indigo-600 font-semibold">Realizado</th>
                    <th className="text-center px-3 py-2 text-slate-600 font-semibold">%</th>
                    <th className="text-center px-3 py-2 text-slate-600 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((m, idx) => {
                    const metaVal = Number(meta[m.key]) || 0;
                    const realizado = Math.round(calcRealized(data, m.key) * 100) / 100;
                    const pct = metaVal > 0 ? Math.round((realizado / metaVal) * 100) : (realizado > 0 ? 100 : 0);
                    const atingiu = pct >= 100;
                    const barWidth = Math.min(pct, 100);

                    return (
                      <tr key={m.key} className={idx % 2 === 0 ? "" : "bg-slate-50/50"}>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">{m.label}</td>
                        <td className="text-center px-3 py-2.5 text-emerald-700 font-semibold">
                          {(m.key === "pa" || m.key === "cs") ? metaVal.toLocaleString("pt-BR") : metaVal}
                        </td>
                        <td className="text-center px-3 py-2.5 text-indigo-700 font-semibold">
                          {(m.key === "pa" || m.key === "cs") ? realizado.toLocaleString("pt-BR") : realizado}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-xs font-bold ${atingiu ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                              {pct}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${atingiu ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-3 py-2.5">
                          {metaVal === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : atingiu ? (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">Atingida</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-red-500">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">Falta {(m.key === "pa" || m.key === "cs") ? (metaVal - realizado).toLocaleString("pt-BR") : (metaVal - realizado)}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}