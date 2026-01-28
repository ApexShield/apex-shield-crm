import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Plus, Clock, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { format, parseISO, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const HOURS = Array.from({ length: 20 }, (_, i) => i + 4); // 04:00 às 23:00
const COLORS = [
  { value: "#0891b2", label: "Azul Pavão - Agendado", tipo: "agendado" },
  { value: "#fbbf24", label: "Amarelo Banana - Delay", tipo: "delay" },
  { value: "#8b5cf6", label: "Mirtilo - Reunião Realizada", tipo: "reuniao_realizada" },
  { value: "#10b981", label: "Manjericão - Venda Feita", tipo: "venda_feita" },
  { value: "#f97316", label: "Tangerina - Compromisso Pessoal", tipo: "pessoal" },
  { value: "#ec4899", label: "Flamingo - Compromisso da Avanti", tipo: "avanti" }
];

export default function Compromissos() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
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
    queryKey: ['compromissos-google', currentWeekStart],
    queryFn: async () => {
      try {
        const weekStart = startOfDay(currentWeekStart);
        const weekEnd = endOfDay(addDays(currentWeekStart, 6));
        
        const response = await base44.functions.invoke('listarEventosCalendar', {
          dataInicio: weekStart.toISOString(),
          dataFim: weekEnd.toISOString()
        });
        
        return response.data?.eventos || [];
      } catch (error) {
        console.error('Erro ao buscar compromissos:', error);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 60000
  });

  const criarCompromissoMutation = useMutation({
    mutationFn: async (data) => {
      const eventData = {
        summary: data.titulo,
        description: data.descricao || '',
        startDateTime: data.data_inicio,
        endDateTime: data.data_fim,
        location: data.modalidade === 'presencial' ? (data.endereco || '') : 'Online',
        colorId: getGoogleColorId(data.cor)
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

  const atualizarCompromissoMutation = useMutation({
    mutationFn: async (data) => {
      const eventData = {
        eventId: data.id,
        summary: data.titulo,
        description: data.descricao || '',
        startDateTime: data.data_inicio,
        endDateTime: data.data_fim,
        location: data.modalidade === 'presencial' ? (data.endereco || '') : 'Online',
        colorId: getGoogleColorId(data.cor)
      };

      // Adicionar participante se fornecido
      if (data.email_participante) {
        eventData.attendees = [{ email: data.email_participante }];
      }

      return await base44.functions.invoke('atualizarEventoCalendar', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos-google'] });
      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
      alert('✅ Compromisso atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar compromisso:', error);
      alert('❌ Erro ao atualizar compromisso. Tente novamente.');
    }
  });

  const deletarCompromissoMutation = useMutation({
    mutationFn: async (eventId) => {
      return await base44.functions.invoke('deletarEventoCalendar', { eventId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos-google'] });
      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
      alert('✅ Compromisso deletado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar compromisso:', error);
      alert('❌ Erro ao deletar compromisso. Tente novamente.');
    }
  });

  // Mapear cores do painel para IDs de cores do Google Calendar
  const getGoogleColorId = (hexColor) => {
    const colorMap = {
      "#0891b2": "9",  // Azul Pavão -> Blue
      "#fbbf24": "5",  // Amarelo Banana -> Yellow
      "#8b5cf6": "3",  // Mirtilo -> Purple
      "#10b981": "10", // Manjericão -> Green
      "#f97316": "6",  // Tangerina -> Orange
      "#ec4899": "4"   // Flamingo -> Pink
    };
    return colorMap[hexColor] || "9"; // Default: Blue
  };

  // Mapear IDs de cores do Google Calendar para cores do painel
  const getHexColorFromGoogleId = (colorId) => {
    const colorMap = {
      "1": "#0891b2",  // Lavender -> Azul Pavão
      "2": "#10b981",  // Sage -> Manjericão
      "3": "#8b5cf6",  // Grape -> Mirtilo
      "4": "#ec4899",  // Flamingo -> Flamingo
      "5": "#fbbf24",  // Banana -> Amarelo Banana
      "6": "#f97316",  // Tangerine -> Tangerina
      "7": "#0891b2",  // Peacock -> Azul Pavão
      "8": "#6b7280",  // Graphite -> Cinza
      "9": "#0891b2",  // Blueberry -> Azul Pavão
      "10": "#10b981", // Basil -> Manjericão
      "11": "#ef4444"  // Tomato -> Vermelho
    };
    return colorMap[colorId] || "#0891b2"; // Default: Azul Pavão
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      atualizarCompromissoMutation.mutate(formData);
    } else {
      criarCompromissoMutation.mutate(formData);
    }
  };

  const handleDeleteEvent = () => {
    if (editingEvent && confirm('Tem certeza que deseja deletar este compromisso?')) {
      deletarCompromissoMutation.mutate(editingEvent.id);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    
    // Garantir que as datas sejam válidas
    const dataInicio = event.data_inicio ? new Date(event.data_inicio) : new Date();
    const dataFim = event.data_fim ? new Date(event.data_fim) : new Date(dataInicio.getTime() + 3600000);
    
    setFormData({
      id: event.id,
      titulo: event.titulo || '',
      descricao: event.descricao || '',
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      cor: event.cor || '#0891b2',
      tipo: COLORS.find(c => c.value === event.cor)?.tipo || 'agendado',
      modalidade: event.modalidade || '',
      meeting_link: event.meeting_link || '',
      email_participante: event.email_participante || ''
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const handleSlotClick = (day, hour) => {
    const startTime = new Date(day);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);

    setSelectedSlot({ startTime, endTime });
    setFormData({
      titulo: "",
      descricao: "",
      data_inicio: startTime.toISOString(),
      data_fim: endTime.toISOString(),
      cor: "#0891b2",
      tipo: "agendado",
      modalidade: "",
      meeting_link: "",
      email_participante: ""
    });
    setShowDialog(true);
  };

  const getEventsForSlot = (day, hour) => {
    return compromissos.filter(comp => {
      if (!comp.data_inicio) return false;
      
      try {
        const compStart = parseISO(comp.data_inicio);
        if (isNaN(compStart.getTime())) return false;
        
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        
        return isSameDay(compStart, day) && compStart >= slotStart && compStart < slotEnd;
      } catch (error) {
        console.error('Erro ao processar data do evento:', error);
        return false;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header Moderno */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">Agenda Profissional</h1>
                <p className="text-indigo-300">Organize seus compromissos e reuniões</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                const now = new Date();
                setFormData({
                  titulo: "",
                  descricao: "",
                  data_inicio: now.toISOString(),
                  data_fim: new Date(now.getTime() + 3600000).toISOString(),
                  cor: "#0891b2",
                  tipo: "agendado",
                  modalidade: "",
                  meeting_link: "",
                  email_participante: ""
                });
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-8 py-6 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Compromisso
            </Button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {/* Header da Semana */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 font-bold"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <span className="text-xl font-bold text-white">
              {format(currentWeekStart, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          <div className="flex">
            {/* Sidebar com Mini Calendário */}
            <div className="w-80 border-r border-white/10 p-6 bg-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Mini Calendário
              </h3>
              <div className="bg-white rounded-xl p-2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
                  }}
                  locale={ptBR}
                  className="rounded-md"
                />
              </div>

              {/* Legenda de Cores */}
              <div className="mt-6">
                <h4 className="text-white font-bold mb-3 text-sm">Legenda</h4>
                <div className="space-y-2">
                  {COLORS.map((color) => (
                    <div key={color.value} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs text-indigo-200">{color.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade de Horários */}
            <div className="flex-1 overflow-auto">
              <div className="min-w-[900px]">
                {/* Cabeçalho dos Dias */}
                <div className="grid grid-cols-8 border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
                  <div className="p-4 text-center border-r border-white/10">
                    <Clock className="w-5 h-5 mx-auto text-indigo-400" />
                  </div>
                  {weekDays.map((day, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 text-center border-r border-white/10 ${
                        isSameDay(day, new Date()) ? "bg-gradient-to-b from-indigo-600/20 to-transparent" : ""
                      }`}
                    >
                      <div className="text-xs font-bold text-indigo-300 uppercase mb-1">
                        {format(day, "EEE", { locale: ptBR })}
                      </div>
                      <div
                        className={`text-3xl font-black ${
                          isSameDay(day, new Date()) 
                            ? "text-white bg-gradient-to-br from-indigo-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto" 
                            : "text-white"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Grid de Horários */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-white/5">
                      <div className="p-3 text-sm font-bold text-indigo-300 text-right border-r border-white/10 bg-white/5">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const events = getEventsForSlot(day, hour);
                        return (
                          <div
                            key={dayIndex}
                            className="min-h-[70px] border-r border-white/5 hover:bg-white/10 cursor-pointer relative p-1 transition-colors"
                            onClick={() => handleSlotClick(day, hour)}
                          >
                            {events.map((event, eventIndex) => (
                              <motion.div
                                key={event.id}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute left-1 right-1 rounded-lg px-3 py-2 text-xs text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform z-10"
                                style={{
                                  backgroundColor: event.cor || "#3b82f6",
                                  top: `${eventIndex * 28 + 4}px`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event);
                                }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="truncate flex-1">{event.titulo}</div>
                                  <div className="text-[9px] bg-white/30 px-1 rounded">📅</div>
                                </div>
                                {event.meeting_link && (
                                  <div 
                                    className="text-[10px] opacity-90 truncate mt-0.5 cursor-pointer hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(event.meeting_link, '_blank');
                                    }}
                                  >
                                    🎥 Entrar na reunião
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editingEvent ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Linha 1: Título e Tipo */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Linha 2: Modalidade e Cliente */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Email do Participante */}
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

            {/* Data e Horários */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-white mb-2 block">Data *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio ? (() => {
                    try {
                      const date = new Date(formData.data_inicio);
                      return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
                    } catch {
                      return "";
                    }
                  })() : ""}
                  onChange={(e) => {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const currentStart = formData.data_inicio ? new Date(formData.data_inicio) : new Date();
                    const newDate = new Date(year, month - 1, day, currentStart.getHours(), currentStart.getMinutes());
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
                      <SelectValue placeholder="H" />
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
                      <SelectValue placeholder="M" />
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
                      <SelectValue placeholder="H" />
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
                      <SelectValue placeholder="M" />
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

            {/* Cor do Compromisso */}
            <div>
              <Label className="text-white mb-2 block">Cor do Compromisso</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 hover:scale-105 transition-transform ${
                      formData.cor === color.value ? "border-white bg-white/10" : "border-white/20 bg-white/5"
                    }`}
                    onClick={() => setFormData({ ...formData, cor: color.value, tipo: color.tipo })}
                  >
                    <div 
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs text-left text-white font-medium">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <Label className="text-white">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* Info do Google Meet */}
            <div className="text-xs text-green-300 flex items-center gap-1 bg-green-500/10 p-2 rounded-lg">
              ✨ O link do Google Meet será gerado automaticamente ao salvar
            </div>

            {/* Botões */}
            <div className="flex justify-between pt-2">
              <div>
                {editingEvent && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDeleteEvent}
                    disabled={deletarCompromissoMutation.isPending}
                    className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                  >
                    {deletarCompromissoMutation.isPending ? 'Deletando...' : 'Deletar'}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={criarCompromissoMutation.isPending || atualizarCompromissoMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {editingEvent 
                    ? (atualizarCompromissoMutation.isPending ? 'Salvando...' : 'Salvar')
                    : (criarCompromissoMutation.isPending ? 'Criando...' : 'Criar')
                  }
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}