import { useMemo } from "react";
import { DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, isValid } from "date-fns";

const fmtCurrency = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ResumoMesAtual({ comissoes }) {
  const stats = useMemo(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    let totalMes = 0;
    let ativas = 0;
    let expirandoEsteMes = 0;

    comissoes.forEach(c => {
      if (c.status !== "ativa") return;
      const adesao = parseISO(c.data_adesao);
      const expiracao = parseISO(c.data_expiracao);
      if (!isValid(adesao) || !isValid(expiracao)) return;

      // Verifica se a comissão está ativa no mês atual
      if (hoje >= adesao && hoje <= expiracao) {
        totalMes += c.valor_comissao || 0;
        ativas++;
      }

      // Verifica se expira neste mês
      if (isWithinInterval(expiracao, { start: inicioMes, end: fimMes })) {
        expirandoEsteMes++;
      }
    });

    return { totalMes, ativas, expirandoEsteMes };
  }, [comissoes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Total a Receber (Mês Atual)</p>
            <p className="text-2xl font-black text-emerald-400">{fmtCurrency(stats.totalMes)}</p>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl border border-cyan-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/30 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Comissões Ativas</p>
            <p className="text-2xl font-black text-cyan-400">{stats.ativas}</p>
          </div>
        </div>
      </div>
      <div className={`bg-gradient-to-br rounded-xl border p-4 ${
        stats.expirandoEsteMes > 0
          ? "from-amber-500/20 to-amber-600/20 border-amber-500/30"
          : "from-slate-500/20 to-slate-600/20 border-slate-500/30"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            stats.expirandoEsteMes > 0 ? "bg-amber-500/30" : "bg-slate-500/30"
          }`}>
            {stats.expirandoEsteMes > 0
              ? <AlertTriangle className="w-5 h-5 text-amber-400" />
              : <TrendingUp className="w-5 h-5 text-slate-400" />
            }
          </div>
          <div>
            <p className="text-white/60 text-xs">Expirando Este Mês</p>
            <p className={`text-2xl font-black ${stats.expirandoEsteMes > 0 ? "text-amber-400" : "text-slate-400"}`}>
              {stats.expirandoEsteMes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}