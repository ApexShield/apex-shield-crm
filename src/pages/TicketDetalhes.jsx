import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, Clock, User, Calendar, Tag, 
  MessageSquare, Send, Mail, Phone, MessageCircle, 
  Users, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors = {
  novo: "bg-blue-100 text-blue-700 border-blue-200",
  em_andamento: "bg-amber-100 text-amber-700 border-amber-200",
  aguardando: "bg-purple-100 text-purple-700 border-purple-200",
  concluido: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

const statusLabels = {
  novo: "Novo",
  em_andamento: "Em Andamento",
  aguardando: "Aguardando",
  concluido: "Concluído"
};

const prioridadeColors = {
  baixa: "bg-slate-100 text-slate-700",
  media: "bg-yellow-100 text-yellow-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700"
};

const prioridadeLabels = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente"
};

const tipoIcons = {
  email: Mail,
  telefone: Phone,
  whatsapp: MessageCircle,
  presencial: Users,
  sistema: MessageSquare
};

export default function TicketDetalhes() {
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get("id");

  const [novaMensagem, setNovaMensagem] = useState("");
  const [tipoInteracao, setTipoInteracao] = useState("sistema");

  const queryClient = useQueryClient();

  const { data: ticket, isLoading: loadingTicket } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const tickets = await base44.entities.Ticket.filter({ id: ticketId });
      return tickets[0];
    },
    enabled: !!ticketId
  });

  const { data: interacoes = [], isLoading: loadingInteracoes } = useQuery({
    queryKey: ["interacoes", ticketId],
    queryFn: () => base44.entities.Interacao.filter({ ticket_id: ticketId }, "created_date", 100),
    enabled: !!ticketId
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const updateTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.Ticket.update(ticketId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
  });

  const createInteracaoMutation = useMutation({
    mutationFn: (data) => base44.entities.Interacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interacoes", ticketId] });
      setNovaMensagem("");
    }
  });

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim()) return;
    createInteracaoMutation.mutate({
      ticket_id: ticketId,
      cliente_id: ticket?.cliente_id,
      tipo: tipoInteracao,
      mensagem: novaMensagem,
      autor: currentUser?.full_name || currentUser?.email || "Atendente"
    });
  };

  if (loadingTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-400" />
        <p className="text-slate-600">Ticket não encontrado</p>
        <Link to={createPageUrl("Tickets")}>
          <Button variant="outline">Voltar aos Tickets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link to={createPageUrl("Tickets")}>
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{ticket.titulo}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className={`${statusColors[ticket.status]} border`}>
                  {statusLabels[ticket.status]}
                </Badge>
                <Badge className={prioridadeColors[ticket.prioridade]}>
                  {prioridadeLabels[ticket.prioridade]}
                </Badge>
              </div>
            </div>
            
            <Select
              value={ticket.status}
              onValueChange={(value) => updateTicketMutation.mutate({ status: value })}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Alterar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {ticket.descricao && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 whitespace-pre-wrap">{ticket.descricao}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Interactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Histórico de Interações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* New Message Form */}
                  <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                    <Textarea
                      placeholder="Adicionar uma nova interação..."
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      rows={3}
                      className="bg-white"
                    />
                    <div className="flex items-center justify-between">
                      <Select value={tipoInteracao} onValueChange={setTipoInteracao}>
                        <SelectTrigger className="w-[140px] bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sistema">Sistema</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="telefone">Telefone</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="presencial">Presencial</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleEnviarMensagem}
                        disabled={!novaMensagem.trim() || createInteracaoMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {createInteracaoMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Interactions List */}
                  <div className="space-y-4 mt-6">
                    <AnimatePresence>
                      {interacoes.map((interacao, index) => {
                        const TipoIcon = tipoIcons[interacao.tipo] || MessageSquare;
                        return (
                          <motion.div
                            key={interacao.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <TipoIcon className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-800 text-sm">
                                  {interacao.autor || "Sistema"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {format(new Date(interacao.created_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">
                                {interacao.mensagem}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {interacoes.length === 0 && (
                      <p className="text-center text-slate-500 py-6">
                        Nenhuma interação registrada
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Cliente</p>
                      <p className="font-medium text-slate-800">{ticket.cliente_nome || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Categoria</p>
                      <p className="font-medium text-slate-800 capitalize">
                        {ticket.categoria?.replace("_", " ") || "—"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Criado em</p>
                      <p className="font-medium text-slate-800">
                        {format(new Date(ticket.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {ticket.data_limite && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Data Limite</p>
                        <p className="font-medium text-slate-800">
                          {format(new Date(ticket.data_limite), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {ticket.responsavel && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Responsável</p>
                        <p className="font-medium text-slate-800">{ticket.responsavel}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {ticket.status === "concluido" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 p-4 bg-emerald-50 rounded-xl text-emerald-700"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Ticket concluído</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}