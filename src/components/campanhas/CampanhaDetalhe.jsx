import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, MessageSquare, CheckCircle2, XCircle, Clock, Send, 
  Users, ArrowLeft, Loader2, Link as LinkIcon, Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusEnvio = {
  enviado: { label: "Enviado", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  erro: { label: "Erro", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
};

export default function CampanhaDetalhe({ campanha, open, onClose }) {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState("todos");

  const { data: envios = [], isLoading } = useQuery({
    queryKey: ["campanha-envios", campanha?.id],
    queryFn: () => base44.entities.CampanhaEnvio.filter({ campanha_id: campanha.id }, "-created_date", 5000),
    enabled: !!campanha?.id && open,
  });

  if (!campanha) return null;

  const emailsEnviados = envios.filter(e => e.canal === "email" && e.status === "enviado").length;
  const emailsErro = envios.filter(e => e.canal === "email" && e.status === "erro").length;
  const whatsEnviados = envios.filter(e => e.canal === "whatsapp" && e.status === "enviado").length;
  const whatsErro = envios.filter(e => e.canal === "whatsapp" && e.status === "erro").length;

  const enviosFiltrados = envios.filter(e => {
    if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
    if (filtroCanal !== "todos" && e.canal !== filtroCanal) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Campanha
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Campaign info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h2 className="font-bold text-slate-800 text-lg">{campanha.titulo}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Criada em {campanha.created_date && format(new Date(campanha.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {campanha.link_conteudo && (
              <a href={campanha.link_conteudo} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> {campanha.link_conteudo}
              </a>
            )}
            <div className="mt-3 bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold mb-1">Mensagem:</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{campanha.mensagem}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
              <Users className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{campanha.total_destinatarios || envios.length}</p>
              <p className="text-[11px] text-slate-500">Total Destinatários</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-200 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{emailsEnviados + whatsEnviados}</p>
              <p className="text-[11px] text-slate-500">Enviados com Sucesso</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-red-200 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-700">{emailsErro + whatsErro}</p>
              <p className="text-[11px] text-slate-500">Com Erro</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-200 text-center">
              <Send className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-indigo-700">
                {campanha.total_destinatarios > 0 
                  ? Math.round(((emailsEnviados + whatsEnviados) / campanha.total_destinatarios) * 100) 
                  : 0}%
              </p>
              <p className="text-[11px] text-slate-500">Taxa de Entrega</p>
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {(campanha.tipo === "email" || campanha.tipo === "ambos") && (
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-indigo-700 text-sm">Email</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">{emailsEnviados} enviado(s)</span>
                  {emailsErro > 0 && <span className="text-red-600">{emailsErro} erro(s)</span>}
                </div>
              </div>
            )}
            {(campanha.tipo === "whatsapp" || campanha.tipo === "ambos") && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-700 text-sm">WhatsApp</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">{whatsEnviados} enviado(s)</span>
                  {whatsErro > 0 && <span className="text-red-600">{whatsErro} erro(s)</span>}
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select 
              value={filtroStatus} 
              onChange={e => setFiltroStatus(e.target.value)}
              className="text-xs border rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="todos">Todos os status</option>
              <option value="enviado">Enviados</option>
              <option value="erro">Com erro</option>
            </select>
            <select 
              value={filtroCanal} 
              onChange={e => setFiltroCanal(e.target.value)}
              className="text-xs border rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="todos">Todos os canais</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <span className="text-xs text-slate-400 self-center ml-auto">
              {enviosFiltrados.length} registro(s)
            </span>
          </div>

          {/* Envios list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : envios.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum registro de envio encontrado para esta campanha.
              <br />
              <span className="text-xs">(Registros só aparecem para campanhas criadas a partir de agora)</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {enviosFiltrados.map((envio) => {
                const st = statusEnvio[envio.status] || statusEnvio.pendente;
                const StIcon = st.icon;
                const isEmail = envio.canal === "email";

                return (
                  <div key={envio.id} className={`flex items-center gap-3 p-3 rounded-lg border ${st.bg} border-slate-200`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEmail ? 'bg-indigo-100' : 'bg-green-100'}`}>
                      {isEmail ? <Mail className="w-4 h-4 text-indigo-600" /> : <MessageSquare className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{envio.cliente_nome || 'Cliente'}</p>
                      <p className="text-xs text-slate-500 truncate">{envio.destino}</p>
                      {envio.erro_detalhe && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{envio.erro_detalhe}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StIcon className={`w-4 h-4 ${st.color}`} />
                      <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button variant="outline" onClick={onClose} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}