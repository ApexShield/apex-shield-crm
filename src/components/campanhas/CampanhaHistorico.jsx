import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Send, Clock, CheckCircle2, AlertCircle, Loader2, ChevronRight } from "lucide-react";

const statusConfig = {
  rascunho: { label: "Rascunho", icon: Clock, bg: "bg-slate-100 text-slate-600" },
  enviando: { label: "Enviando...", icon: Loader2, bg: "bg-blue-100 text-blue-700" },
  concluida: { label: "Concluída", icon: CheckCircle2, bg: "bg-green-100 text-green-700" },
  erro: { label: "Erro", icon: AlertCircle, bg: "bg-red-100 text-red-700" },
};

const tipoConfig = {
  email: { label: "Email", icon: Mail, bg: "bg-indigo-100 text-indigo-700" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, bg: "bg-green-100 text-green-700" },
  ambos: { label: "Email + WhatsApp", icon: Send, bg: "bg-purple-100 text-purple-700" },
};

export default function CampanhaHistorico({ campanhas = [], onSelectCampanha }) {
  if (campanhas.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Send className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Nenhuma campanha enviada ainda</p>
        <p className="text-sm text-slate-400">Crie sua primeira campanha de divulgação!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campanhas.map(c => {
        const st = statusConfig[c.status] || statusConfig.rascunho;
        const tp = tipoConfig[c.tipo] || tipoConfig.email;
        const StIcon = st.icon;
        const TpIcon = tp.icon;

        return (
          <button
            key={c.id}
            onClick={() => onSelectCampanha?.(c)}
            className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{c.titulo}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {c.created_date && format(new Date(c.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={`${tp.bg} gap-1 text-[11px]`}>
                  <TpIcon className="w-3 h-3" />
                  {tp.label}
                </Badge>
                <Badge className={`${st.bg} gap-1 text-[11px]`}>
                  <StIcon className={`w-3 h-3 ${c.status === 'enviando' ? 'animate-spin' : ''}`} />
                  {st.label}
                </Badge>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              {c.emails_enviados > 0 && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-500" />
                  {c.emails_enviados} email(s)
                </span>
              )}
              {c.whatsapp_gerados > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-green-500" />
                  {c.whatsapp_gerados} WhatsApp
                </span>
              )}
              {c.total_destinatarios > 0 && (
                <span>Total: {c.total_destinatarios} destinatário(s)</span>
              )}
            </div>

            {c.link_conteudo && (
              <p className="text-xs text-indigo-500 mt-2 truncate max-w-full">
                🔗 {c.link_conteudo}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}