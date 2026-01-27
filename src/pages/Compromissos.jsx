import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Trash2, Clock, CheckCircle2, AlertCircle, CalendarDays } from "lucide-react";

const COLORS = [
  { value: "#0891b2", label: "Azul Pavão", tipo: "agendado" },
  { value: "#fbbf24", label: "Amarelo Banana", tipo: "delay" },
  { value: "#8b5cf6", label: "Mirtilo", tipo: "reuniao_realizada" },
  { value: "#10b981", label: "Manjericão", tipo: "venda_feita" },
  { value: "#f97316", label: "Tangerina", tipo: "pessoal" },
  { value: "#ec4899", label: "Flamingo", tipo: "avanti" }
];
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Compromissos() {
  const [showDialog, setShowDialog] = useState(false);
  const getDefaultDates = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 3600000); // +1 hora
    return {
      data_inicio: now.toISOString(),
      data_fim: endTime.toISOString()
    };
  };

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    ...getDefaultDates(),
    cor: "#0891b2",
    tipo: "agendado",
    modalidade: "",
    meeting_link: "",
    email_participante: ""
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Verificar conexão com Google Calendar
  React.useEffect(() => {
    const verificarConexao = async () => {
      try {
        const response = await base44.functions.invoke('verificarConexaoCalendar');
        setGoogleConnected(response.data?.connected || false);
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setGoogleConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    if (user) {
      verificarConexao();
    }
  }, [user]);

  const handleConnectGoogleCalendar = async () => {
    try {
      const response = await base44.functions.invoke('verificarConexaoCalendar');
      
      if (response.data?.connected) {
        alert('✅ Google Calendar já está conectado!');
        setGoogleConnected(true);
      } else if (response.data?.needsAuth) {
        if (confirm('📅 Para usar a integração com Google Calendar, você precisa autorizar o acesso.\n\n✅ Clique em OK para ir para a página de Integrações')) {
          window.open('https://app.base44.com/dashboard/integrations', '_blank');
        }
      } else {
        alert('⚠️ ' + (response.data?.message || 'Erro ao conectar com Google Calendar'));
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      alert('❌ Erro ao conectar com Google Calendar.\n\nPor favor, autorize a integração em:\nDashboard → Integrações → Google Calendar');
    }
  };

  const { data: allClientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list()
  });

  // Filtrar clientes do usuário
  const clientes = useMemo(() => {
    if (!user || !allClientes.length) return [];
    
    if (user.role === "admin") {
      return allClientes.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    }
    
    const meusClientes = allClientes.filter(c => c.created_by === user.email);
    return meusClientes.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [allClientes, user]);

  // Buscar eventos do Google Calendar
  const { data: compromissos = [], isLoading } = useQuery({
    queryKey: ['compromissos-google'],
    queryFn: async () => {
      try {
        const hoje = new Date();
        const umMesAtras = new Date(hoje);
        umMesAtras.setMonth(hoje.getMonth() - 1);
        const umMesFrente = new Date(hoje);
        umMesFrente.setMonth(hoje.getMonth() + 1);
        
        const response = await base44.functions.invoke('listarEventosCalendar', {
          dataInicio: umMesAtras.toISOString(),
          dataFim: umMesFrente.toISOString()
        });
        
        return response.data?.eventos || [];
      } catch (error) {
        console.error('Erro ao buscar compromissos:', error);
        return [];
      }
    },
    enabled: !!user
  });

  const criarCompromissoMutation = useMutation({
    mutationFn: async (data) => {
      const eventData = {
        summary: data.titulo,
        description: data.descricao || '',
        start: {
          dateTime: data.data_inicio
        },
        end: {
          dateTime: data.data_fim
        },
        location: data.modalidade === 'presencial' ? (data.endereco || '') : 'Online'
      };

      // Adicionar participante se fornecido
      if (data.email_participante) {
        eventData.attendees = [{ email: data.email_participante }];
      }

      return await base44.functions.invoke('criarEventoCalendar', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos-google'] });
      setShowDialog(false);
      resetForm();
      alert('✅ Compromisso criado com sucesso no Google Calendar!');
    },
    onError: (error) => {
      console.error('Erro ao criar compromisso:', error);
      alert('❌ Erro ao criar compromisso. Tente novamente.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!googleConnected) {
      alert('⚠️ Você precisa conectar o Google Calendar antes de criar compromissos.\n\nClique no botão "Conectar Google Calendar" no topo da página.');
      return;
    }
    
    criarCompromissoMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      ...getDefaultDates(),
      cor: "#0891b2",
      tipo: "agendado",
      modalidade: "",
      meeting_link: "",
      email_participante: ""
    });
  };

  // Agrupar compromissos por data
  const compromissosAgrupados = useMemo(() => {
    const grupos = {};
    compromissos.forEach(comp => {
      const data = format(parseISO(comp.data_inicio), "yyyy-MM-dd");
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(comp);
    });
    return grupos;
  }, [compromissos]);

  const datasOrdenadas = Object.keys(compromissosAgrupados).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">Compromissos</h1>
                <p className="text-purple-300">Sincronizado com Google Calendar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!checkingConnection && (
                googleConnected ? (
                  <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-100 text-sm font-medium">📅 Google Calendar Conectado</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectGoogleCalendar}
                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 font-bold"
                  >
                    🔗 Conectar Google Calendar
                  </Button>
                )
              )}
              <Button 
                onClick={() => setShowDialog(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Compromisso
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Compromissos */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Carregando compromissos...</p>
          </div>
        ) : compromissos.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum compromisso encontrado</h3>
              <p className="text-gray-300 mb-6">
                Crie seu primeiro compromisso clicando no botão acima.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {datasOrdenadas.map((data, index) => (
              <motion.div
                key={data}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    {format(parseISO(data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h2>
                </div>
                <div className="space-y-3">
                  {compromissosAgrupados[data].map((comp) => (
                    <Card 
                      key={comp.id} 
                      className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                      onClick={() => {
                        if (comp.htmlLink) {
                          window.open(comp.htmlLink, '_blank');
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">
                              {comp.titulo}
                            </h3>
                            {comp.descricao && (
                              <p className="text-sm text-gray-300 mb-2">{comp.descricao}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-purple-300">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(parseISO(comp.data_inicio), "HH:mm", { locale: ptBR })}
                                {' → '}
                                {format(parseISO(comp.data_fim), "HH:mm", { locale: ptBR })}
                              </div>
                              {comp.origem && (
                                <div className="text-xs bg-blue-500/20 px-2 py-1 rounded">
                                  📅 {comp.origem}
                                </div>
                              )}
                            </div>
                            {comp.meeting_link && (
                              <a 
                                href={comp.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 mt-2 bg-blue-500/20 px-3 py-1 rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                              >
                                🎥 Entrar na reunião
                              </a>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-purple-400" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              ➕ Novo Compromisso
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white">Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white">Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => {
                  const selectedColor = COLORS.find(c => c.tipo === value);
                  setFormData({ 
                    ...formData, 
                    tipo: value,
                    cor: selectedColor ? selectedColor.value : formData.cor
                  });
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                  <SelectItem value="reuniao_realizada">Reunião Realizada</SelectItem>
                  <SelectItem value="venda_feita">Venda Feita</SelectItem>
                  <SelectItem value="pessoal">Compromisso Pessoal</SelectItem>
                  <SelectItem value="avanti">Compromisso da Avanti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Modalidade</Label>
              <Select
                value={formData.modalidade}
                onValueChange={(value) => setFormData({ ...formData, modalidade: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">📍 Presencial</SelectItem>
                  <SelectItem value="online">💻 Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Cliente (opcional)</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => {
                  const cliente = clientes.find(c => c.id === value);
                  setFormData({
                    ...formData,
                    cliente_id: value,
                    cliente_nome: cliente?.nome || "",
                    email_participante: cliente?.email || ""
                  });
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Email do Participante (opcional)</Label>
              <Input
                type="email"
                value={formData.email_participante}
                onChange={(e) => setFormData({ ...formData, email_participante: e.target.value })}
                placeholder="participante@email.com"
                className="bg-white/10 border-white/20 text-white"
              />
              <p className="text-xs text-indigo-300 mt-1">
                📧 O convite da reunião será enviado para este email
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Data do Compromisso *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio ? format(new Date(formData.data_inicio), "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    const currentStart = formData.data_inicio ? new Date(formData.data_inicio) : new Date();
                    newDate.setHours(currentStart.getHours(), currentStart.getMinutes());
                    const newEnd = new Date(newDate);
                    newEnd.setHours(newEnd.getHours() + 1);
                    setFormData({ 
                      ...formData, 
                      data_inicio: newDate.toISOString(),
                      data_fim: newEnd.toISOString()
                    });
                  }}
                  className="bg-white/10 border-white/20 text-white w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Horário Início *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.data_inicio ? format(new Date(formData.data_inicio), "HH") : ""}
                      onValueChange={(hour) => {
                        const date = formData.data_inicio ? new Date(formData.data_inicio) : new Date();
                        date.setHours(parseInt(hour));
                        const endDate = new Date(date);
                        endDate.setHours(endDate.getHours() + 1);
                        setFormData({ 
                          ...formData, 
                          data_inicio: date.toISOString(),
                          data_fim: endDate.toISOString()
                        });
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 4).map(h => (
                          <SelectItem key={h} value={String(h).padStart(2, '0')}>
                            {String(h).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.data_inicio ? format(new Date(formData.data_inicio), "mm") : ""}
                      onValueChange={(minute) => {
                        const date = formData.data_inicio ? new Date(formData.data_inicio) : new Date();
                        date.setMinutes(parseInt(minute));
                        const endDate = new Date(date);
                        endDate.setHours(endDate.getHours() + 1);
                        setFormData({ 
                          ...formData, 
                          data_inicio: date.toISOString(),
                          data_fim: endDate.toISOString()
                        });
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Horário Fim *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.data_fim ? format(new Date(formData.data_fim), "HH") : ""}
                      onValueChange={(hour) => {
                        const date = formData.data_fim ? new Date(formData.data_fim) : new Date();
                        date.setHours(parseInt(hour));
                        setFormData({ ...formData, data_fim: date.toISOString() });
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 4).map(h => (
                          <SelectItem key={h} value={String(h).padStart(2, '0')}>
                            {String(h).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.data_fim ? format(new Date(formData.data_fim), "mm") : ""}
                      onValueChange={(minute) => {
                        const date = formData.data_fim ? new Date(formData.data_fim) : new Date();
                        date.setMinutes(parseInt(minute));
                        setFormData({ ...formData, data_fim: date.toISOString() });
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Cor do Compromisso</Label>
              <div className="grid grid-cols-2 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 hover:scale-105 transition-transform ${
                      formData.cor === color.value ? "border-white bg-white/10" : "border-white/20 bg-white/5"
                    }`}
                    onClick={() => setFormData({ ...formData, cor: color.value, tipo: color.tipo })}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs text-left text-white font-medium">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white">Link da Reunião</Label>
              <div className="relative">
                <Input
                  value={formData.meeting_link}
                  placeholder="Link gerado automaticamente pelo Google Meet"
                  className="bg-white/10 border-white/20 text-white"
                  readOnly
                />
                <div className="text-xs text-green-300 mt-1 flex items-center gap-1">
                  ✨ O link do Google Meet será gerado automaticamente ao salvar
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={criarCompromissoMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {criarCompromissoMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}