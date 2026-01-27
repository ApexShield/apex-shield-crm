import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Trash2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Compromissos() {
  const [showDialog, setShowDialog] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    hora_inicio: "",
    data_fim: "",
    hora_fim: ""
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

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
    enabled: googleConnected
  });

  const handleConnectGoogleCalendar = async () => {
    setCheckingConnection(true);
    try {
      const response = await base44.functions.invoke('verificarConexaoCalendar');
      
      if (response.data?.connected) {
        setGoogleConnected(true);
        queryClient.invalidateQueries({ queryKey: ['compromissos-google'] });
        alert('✅ Google Calendar conectado com sucesso!');
      } else if (response.data?.needsAuth) {
        if (confirm('📅 Para usar a integração com Google Calendar, você precisa autorizar o acesso.\n\n✅ Clique em OK para ir para a página de Integrações')) {
          window.open('https://app.base44.com/dashboard/integrations', '_blank');
        }
      } else {
        alert('⚠️ ' + (response.data?.message || 'Erro ao conectar com Google Calendar'));
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      alert('❌ Erro ao conectar. Autorize a integração em:\nDashboard → Integrações → Google Calendar');
    } finally {
      setCheckingConnection(false);
    }
  };

  const criarCompromissoMutation = useMutation({
    mutationFn: async (data) => {
      // Combinar data e hora
      const dataInicio = new Date(`${data.data_inicio}T${data.hora_inicio}:00`);
      const dataFim = new Date(`${data.data_fim}T${data.hora_fim}:00`);

      const eventData = {
        summary: data.titulo,
        description: data.descricao || '',
        start: {
          dateTime: dataInicio.toISOString()
        },
        end: {
          dateTime: dataFim.toISOString()
        }
      };

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
      alert('⚠️ Você precisa conectar o Google Calendar antes de criar compromissos.');
      return;
    }

    criarCompromissoMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      data_inicio: "",
      hora_inicio: "",
      data_fim: "",
      hora_fim: ""
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
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-100 text-sm font-medium">Google Calendar Conectado</span>
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
                disabled={!googleConnected}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Compromisso
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Compromissos */}
        {!googleConnected ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Conecte seu Google Calendar</h3>
              <p className="text-gray-300 mb-6">
                Para visualizar e criar compromissos, conecte sua conta do Google Calendar.
              </p>
              <Button
                onClick={handleConnectGoogleCalendar}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-bold"
              >
                🔗 Conectar Agora
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
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
              <Label className="text-white">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Data Início *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Hora Início *</Label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Hora Fim *</Label>
                <Input
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-xs text-green-300">
                ✨ O compromisso será criado automaticamente no seu Google Calendar com link do Google Meet
              </p>
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
                {criarCompromissoMutation.isPending ? 'Criando...' : 'Criar Compromisso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}