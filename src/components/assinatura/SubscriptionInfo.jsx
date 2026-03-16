import { CalendarClock, Calendar, RefreshCw } from "lucide-react";

export default function SubscriptionInfo({ subInfo }) {
  if (!subInfo?.active) return null;

  const adesao = new Date(subInfo.created * 1000);
  const renovacao = new Date(subInfo.current_period_end * 1000);
  const agora = new Date();
  const diasRestantes = Math.max(0, Math.ceil((renovacao - agora) / (1000 * 60 * 60 * 24)));

  const formatDate = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const intervaloLabel = subInfo.interval === "year" ? "Anual" : "Mensal";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Data de Adesão</p>
          <p className="text-sm font-bold text-slate-800">{formatDate(adesao)}</p>
          <p className="text-xs text-slate-400">Plano {intervaloLabel}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Próxima Renovação</p>
          <p className="text-sm font-bold text-slate-800">{formatDate(renovacao)}</p>
          <p className="text-xs text-amber-600 font-medium">
            {diasRestantes === 0 ? "Hoje" : `Faltam ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Status</p>
          <p className="text-sm font-bold text-emerald-700">Ativa</p>
          {subInfo.cancel_at_period_end && (
            <p className="text-xs text-red-500 font-medium">Cancelamento ao final do período</p>
          )}
        </div>
      </div>
    </div>
  );
}