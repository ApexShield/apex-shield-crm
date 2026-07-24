import { useMemo } from "react";
import { DollarSign, Users, TrendingUp, AlertTriangle, TrendingDown } from "lucide-react";
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
    let totalNegativos = 0;

    comissoes.forEach(c => {
      const isPagUnico = c.tipo_comissao === "Bônus" || c.tipo_comissao === "Angariação";

      if (c.tipo_comissao === "Inadimplência") {
        if (c.mes_inadimplencia) {
          const [ano, mesNum] = c.mes_inadimplencia.split("-").map(Number);
          if (inicioMes.getFullYear() === ano && inicioMes.getMonth() === mesNum - 1) {
            totalNegativos += c.valor_comissao || 0;
          }
        }
        return;
      }

      if (c.tipo_comissao === "Cancelamento") {
        const dataCancelamento = c.data_cancelamento ? parseISO(c.data_cancelamento) : parseISO(c.data_adesao);
        if (isValid(dataCancelamento) && isWithinInterval(dataCancelamento, { start: inicioMes, end: fimMes })) {
          totalNegativos += c.valor_comissao || 0;
        }
        return;
      }

      if (isPagUnico) {
        if (c.status === "pago" || c.status === "ativa") {
          const adesao = parseISO(c.data_adesao);
          if (isValid(adesao) && isWithinInterval(adesao, { start: inicioMes, end: fimMes })) {
            totalMes += c.valor_comissao || 0;
            ativas++;
          }
        }
        return;
      }

      if (c.status !== "ativa" && c.status !== "renovada") return;
      const adesao = parseISO(c.data_adesao);
      const expiracao = parseISO(c.data_expiracao);
      if (!isValid(adesao) || !isValid(expiracao)) return;

      if (hoje >= adesao && hoje <= expiracao) {
        totalMes += c.valor_comissao || 0;
        ativas++;
      }

      if (isWithinInterval(expiracao, { start: inicioMes, end: fimMes })) {
        expirandoEsteMes++;
      }
    });

    return { totalMes, ativas, expirandoEsteMes, totalNegativos, saldo: totalMes - totalNegativos };
  }, [comissoes]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Receita Bruta (Mês)</p>
            <p className="text-2xl font-black text-emerald-400">{fmtCurrency(stats.totalMes)}</p>
          </div>
        </div>
      </div>
      <div className={`bg-gradient-to-br rounded-xl border p-4 ${stats.totalNegativos > 0 ? "from-red-500/20 to-red-600/20 border-red-500/30" : "from-slate-500/20 to-slate-600/20 border-slate-500/30"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.totalNegativos > 0 ? "bg-red-500/30" : "bg-slate-500/30"}`}>
            <TrendingDown className={`w-5 h-5 ${stats.totalNegativos > 0 ? "text-red-400" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="text-white/60 text-xs">Perdas (Mês)</p>
            <p className={`text-2xl font-black ${stats.totalNegativos > 0 ? "text-red-400" : "text-slate-400"}`}>{fmtCurrency(stats.totalNegativos)}</p>
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
      <div className={`bg-gradient-to-br rounded-xl border p-4 ${stats.expirandoEsteMes > 0 ? "from-amber-500/20 to-amber-600/20 border-amber-500/30" : "from-slate-500/20 to-slate-600/20 border-slate-500/30"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.expirandoEsteMes > 0 ? "bg-amber-500/30" : "bg-slate-500/30"}`}>
            {stats.expirandoEsteMes > 0 ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <TrendingUp className="w-5 h-5 text-slate-400" />}
          </div>
          <div>
            <p className="text-white/60 text-xs">Expirando Este Mês</p>
            <p className={`text-2xl font-black ${stats.expirandoEsteMes > 0 ? "text-amber-400" : "text-slate-400"}`}>{stats.expirandoEsteMes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}