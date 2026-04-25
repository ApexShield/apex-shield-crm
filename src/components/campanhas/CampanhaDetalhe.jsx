import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, MessageSquare, CheckCircle2, XCircle, Clock, Send, 
  Users, ArrowLeft, Loader2, Link as LinkIcon, Eye, Trash2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: envios = [], isLoading } = useQuery({
    queryKey: ["campanha-envios", campanha?.id],
    queryFn: () => base44.entities.CampanhaEnvio.filter({ campanha_id: campanha.id }, "-created_date", 5000),
    enabled: !!campanha?.id && open,
  });

  if (!campanha) return null;

  // Stats baseadas nos registros reais de envio
  const emailEnviados = envios.filter(e => e.canal === "email" && e.status === "enviado").length;
  const emailErro = envios.filter(e => e.canal === "email" && e.status === "erro").length;
  const emailTotal = envios.filter(e => e.canal === "email").length;

  const whatsEnviados = envios.filter(e => e.canal === "whatsapp" && e.status === "enviado").length;
  const whatsPendente = envios.filter(e => e.canal === "whatsapp" && e.status === "pendente").length;
  const whatsErro = envios.filter(e => e.canal === "whatsapp" && e.status === "erro").length;
  const whatsTotal = envios.filter(e => e.canal === "whatsapp").length;

  const totalDestinatarios = envios.length;
  const totalEnviados = emailEnviados + whatsEnviados;
  const totalErros = emailErro + whatsErro;
  const totalPendentes = whatsPendente;

  // Taxa baseada apenas em enviados confirmados vs total de destinatários
  const taxaEntrega = totalDestinatarios > 0 
    ? Math.round((totalEnviados / totalDestinatarios) * 100) 
    : 0;

  const enviosFiltrados = envios.filter(e => {
    if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
    if (filtroCanal !== "todos" && e.canal !== filtroCanal) return false;
    return true;
  });

  const handleDelete = async () => {
    setDeleting(true);
    // Delete envios first
    for (const envio of envios) {
      try { await base44.entities.CampanhaEnvio.delete(envio.id); } catch (e) {}
    }
    // Delete campanha
    await base44.entities.Campanha.delete(campanha.id);
    queryClient.invalidateQueries({ queryKey: ["campanhas"] });
    toast.success("Campanha excluída com sucesso");
    setDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (<>
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

          {/* Stats - Baseado nos registros reais */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
              <Users className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{totalDestinatarios}</p>
              <p className="text-[11px] text-slate-500">Destinatários</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-200 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{totalEnviados}</p>
              <p className="text-[11px] text-slate-500">Entregues</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-amber-200 text-center">
              <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-700">{totalPendentes}</p>
              <p className="text-[11px] text-slate-500">Pendentes</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-red-200 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-700">{totalErros}</p>
              <p className="text-[11px] text-slate-500">Com Erro</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-200 text-center">
              <Send className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-indigo-700">{taxaEntrega}%</p>
              <p className="text-[11px] text-slate-500">Taxa de Entrega</p>
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {emailTotal > 0 && (
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-indigo-700 text-sm">Email</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-green-600">{emailEnviados} entregue(s)</span>
                  {emailErro > 0 && <span className="text-red-600">{emailErro} erro(s)</span>}
                </div>
              </div>
            )}
            {whatsTotal > 0 && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-700 text-sm">WhatsApp</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-green-600">{whatsEnviados} enviado(s)</span>
                  {whatsPendente > 0 && <span className="text-amber-600">{whatsPendente} pendente(s)</span>}
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
              <option value="enviado">Entregues</option>
              <option value="pendente">Pendentes</option>
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
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {enviosFiltrados.map((envio) => {
                const st = statusEnvio[envio.status] || statusEnvio.pendente;
                const StIcon = st.icon;
                const isEmail = envio.canal === "email";

                const handleWhatsAppSend = async () => {
                  if (!envio.destino) return;
                  const tel = envio.destino.replace(/\D/g, '');
                  const telFormatado = tel.startsWith('55') ? tel : '55' + tel;
                  const msg = envio.mensagem_enviada || campanha.mensagem || '';
                  const url = `https://wa.me/${telFormatado}?text=${encodeURIComponent(msg)}`;
                  window.open(url, '_blank');
                  // Marcar como enviado
                  try {
                    await base44.entities.CampanhaEnvio.update(envio.id, { status: 'enviado' });
                    queryClient.invalidateQueries({ queryKey: ["campanha-envios", campanha.id] });
                    toast.success(`WhatsApp aberto para ${envio.cliente_nome || envio.destino}`);
                  } catch (e) {
                    console.error(e);
                  }
                  // Adicionar observação no cliente
                  if (envio.cliente_id) {
                    try {
                      const cliente = await base44.entities.Cliente.get(envio.cliente_id);
                      const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      const obsTexto = `PARTICIPOU DA CAMPANHA "${campanha.titulo}" (WHATSAPP) EM ${hoje}`;
                      const obsExistentes = cliente.observacoes || [];
                      await base44.entities.Cliente.update(envio.cliente_id, {
                        observacoes: [...obsExistentes, { data: hoje, texto: obsTexto }]
                      });
                    } catch (e) {
                      console.error("Erro ao adicionar observação:", e);
                    }
                  }
                };

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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isEmail && envio.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={handleWhatsAppSend}
                          className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Enviar
                        </Button>
                      )}
                      {!isEmail && envio.status === 'enviado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleWhatsAppSend}
                          className="h-7 px-2.5 text-xs border-green-300 text-green-700 hover:bg-green-50 gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Reenviar
                        </Button>
                      )}
                      <div className="flex items-center gap-1">
                        <StIcon className={`w-4 h-4 ${st.color}`} />
                        <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Campanha?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a campanha "{campanha.titulo}"? Esta ação não pode ser desfeita.
            Todos os registros de envio também serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}