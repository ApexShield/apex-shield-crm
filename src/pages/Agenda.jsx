import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Clock, CalendarDays, Trash2, Users } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
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

export default function Agenda() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { locale: ptBR }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    cor: "#0891b2",
    tipo: "agendado",
    modalidade: "",
    meeting_link: ""
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allCompromissos = [] } = useQuery({
    queryKey: ["compromissos"],
    queryFn: () => base44.entities.Compromisso.list()
  });

  // Buscar eventos do Google Calendar
  const { data: eventosGoogle = [] } = useQuery({
    queryKey: ['google-calendar-events', currentWeekStart],
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
        console.error('Erro ao buscar eventos do Google Calendar:', error);
        return [];
      }
    }
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list()
  });

  // Usuários subordinados baseado na hierarquia
  const usuariosSubordinados = useMemo(() => {
    if (!user || !allUsers.length) return [];
    
    // Admin vê todos os usuários
    if (user.role === "admin") {
      return allUsers.filter(u => u.id !== user.id);
    }
    
    // Líder de Agência vê todos da sua hierarquia (incluindo líderes de unidade e corretores)
    if (user.tipo_hierarquia === "Líder de Agência") {
      const subordinados = allUsers.filter(u => {
        // Não incluir a si mesmo
        if (u.id === user.id) return false;
        
        // Líder de Unidade diretamente vinculado
        if (u.lider_id === user.id || u.lider_email === user.email) return true;
        
        // Corretores vinculados aos Líderes de Unidade
        const lideresUnidade = allUsers.filter(lu => 
          lu.tipo_hierarquia === "Líder de Unidade" && 
          (lu.lider_id === user.id || lu.lider_email === user.email)
        );
        const lideresUnidadeIds = lideresUnidade.map(lu => lu.id);
        const lideresUnidadeEmails = lideresUnidade.map(lu => lu.email);
        
        if (lideresUnidadeIds.includes(u.lider_id) || lideresUnidadeEmails.includes(u.lider_email)) {
          return true;
        }
        
        return false;
      });
      
      console.log('Líder de Agência - subordinados:', subordinados);
      return subordinados;
    } 
    
    // Líder de Unidade vê apenas seus subordinados diretos (corretores ligados diretamente a ele)
    if (user.tipo_hierarquia === "Líder de Unidade") {
      const subordinados = allUsers.filter(u => {
        // Não incluir a si mesmo
        if (u.id === user.id) return false;
        
        // Corretores vinculados diretamente ao líder
        return u.lider_email === user.email || u.lider_id === user.id;
      });
      
      console.log('Líder de Unidade - subordinados:', subordinados);
      return subordinados;
    }
    
    return [];
  }, [allUsers, user]);

  // Combinar compromissos internos + eventos do Google Calendar
  const todosCompromissos = useMemo(() => {
    return [...allCompromissos, ...eventosGoogle];
  }, [allCompromissos, eventosGoogle]);

  // Filtrar compromissos baseado em hierarquia e filtro de usuário
  const compromissos = useMemo(() => {
    if (!user) return [];
    
    const compromissosComGoogle = todosCompromissos.map(c => {
      // Eventos do Google Calendar são visíveis para todos
      if (c.tipo === 'google_calendar' || c.origem === 'Google Calendar') {
        return { ...c, isGoogleEvent: true };
      }
      return c;
    });

    // Se um usuário específico foi selecionado, mostrar compromissos dele + Google Calendar
    if (selectedUserEmail) {
      return compromissosComGoogle.filter(c => 
        c.isGoogleEvent || c.created_by === selectedUserEmail
      );
    }
    
    // Admin vê todos
    if (user.role === "admin") {
      return compromissosComGoogle;
    }
    
    // Corretor vê apenas os próprios + Google Calendar
    if (user.tipo_hierarquia === "Corretor" || !user.tipo_hierarquia) {
      return compromissosComGoogle.filter(c => 
        c.isGoogleEvent || c.created_by === user.email
      );
    }
    
    // Líder de Agência vê todos da sua hierarquia + Google Calendar
    if (user.tipo_hierarquia === "Líder de Agência") {
      const subordinadosEmails = usuariosSubordinados.map(u => u.email);
      return compromissosComGoogle.filter(c => 
        c.isGoogleEvent ||
        c.created_by === user.email || 
        subordinadosEmails.includes(c.created_by)
      );
    }
    
    // Líder de Unidade vê seus compromissos + subordinados + Google Calendar
    if (user.tipo_hierarquia === "Líder de Unidade") {
      const subordinadosEmails = usuariosSubordinados.map(u => u.email);
      return compromissosComGoogle.filter(c => 
        c.isGoogleEvent ||
        c.created_by === user.email || 
        subordinadosEmails.includes(c.created_by)
      );
    }
    
    return compromissosComGoogle.filter(c => 
      c.isGoogleEvent || c.created_by === user.email
    );
  }, [todosCompromissos, user, selectedUserEmail, usuariosSubordinados]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Compromisso.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compromissos"] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Compromisso.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compromissos"] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Compromisso.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compromissos"] });
      setShowDialog(false);
      resetForm();
    }
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekCompromissos = useMemo(() => {
    const weekStart = startOfDay(currentWeekStart);
    const weekEnd = endOfDay(addDays(currentWeekStart, 6));
    
    return compromissos.filter(comp => {
      const compStart = parseISO(comp.data_inicio);
      return compStart >= weekStart && compStart <= weekEnd;
    });
  }, [compromissos, currentWeekStart]);

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
      modalidade: ""
    });
    setEditingEvent(null);
    setShowDialog(true);
  };

  const handleEventClick = (event) => {
    setEditingEvent(event);
    setFormData({
      titulo: event.titulo || "",
      descricao: event.descricao || "",
      data_inicio: event.data_inicio,
      data_fim: event.data_fim,
      cor: event.cor || "#0891b2",
      tipo: event.tipo || "agendado",
      cliente_id: event.cliente_id || "",
      cliente_nome: event.cliente_nome || "",
      endereco: event.endereco || "",
      modalidade: event.modalidade || "",
      meeting_link: event.meeting_link || ""
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Se modalidade for online, adicionar (Zoom) ao título
    const dataToSubmit = { ...formData };
    if (formData.modalidade === "online" && formData.titulo && !formData.titulo.includes("(Zoom)")) {
      dataToSubmit.titulo = `${formData.titulo} (Zoom)`;
    }
    
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = () => {
    if (editingEvent && confirm("Deseja deletar este compromisso?")) {
      deleteMutation.mutate(editingEvent.id);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      data_inicio: "",
      data_fim: "",
      cor: "#0891b2",
      tipo: "agendado",
      modalidade: "",
      meeting_link: ""
    });
    setEditingEvent(null);
    setSelectedSlot(null);
  };

  const getEventsForSlot = (day, hour) => {
    return weekCompromissos.filter(comp => {
      const compStart = parseISO(comp.data_inicio);
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      return isSameDay(compStart, day) && compStart >= slotStart && compStart < slotEnd;
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
            <div className="flex items-center gap-3 flex-wrap">
              {(user?.role === "admin" || user?.tipo_hierarquia === "Líder de Unidade" || user?.tipo_hierarquia === "Líder de Agência") && usuariosSubordinados.length > 0 && (
                <div className="w-[280px]">
                  <Select
                    value={selectedUserEmail}
                    onValueChange={setSelectedUserEmail}
                  >
                    <SelectTrigger className="bg-gradient-to-r from-purple-500 to-pink-600 border-2 border-white/30 text-white font-bold shadow-lg">
                      <SelectValue placeholder="Filtrar agendamentos" />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400/50">
                      <SelectItem value={null} className="text-white hover:bg-white/20 font-bold">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Todos os agendamentos
                        </div>
                      </SelectItem>
                      {usuariosSubordinados.map((u) => (
                        <SelectItem key={u.id} value={u.email} className="text-white hover:bg-white/20">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
                              {u.full_name?.charAt(0) || u.email?.charAt(0)}
                            </div>
                            <span className="font-medium">{u.full_name || u.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button 
              onClick={() => {
                const now = new Date();
                setSelectedSlot({ startTime: now, endTime: new Date(now.getTime() + 3600000) });
                setFormData({
                  titulo: "",
                  descricao: "",
                  data_inicio: now.toISOString(),
                  data_fim: new Date(now.getTime() + 3600000).toISOString(),
                  cor: "#0891b2",
                  tipo: "agendado",
                  modalidade: ""
                });
                setEditingEvent(null);
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-8 py-6 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Compromisso
            </Button>
            </div>
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
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { locale: ptBR }))}
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
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCurrentWeekStart(startOfWeek(date, { locale: ptBR }));
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
                                  // Se for evento do Google, abre link, senão abre dialog
                                  if (event.isGoogleEvent && event.htmlLink) {
                                    window.open(event.htmlLink, '_blank');
                                  } else {
                                    handleEventClick(event);
                                  }
                                }}
                                >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="truncate flex-1">{event.titulo}</div>
                                  {event.isGoogleEvent && (
                                    <div className="text-[9px] bg-white/30 px-1 rounded">📅</div>
                                  )}
                                </div>
                                {event.cliente_nome && (
                                  <div className="text-[10px] opacity-90 truncate mt-0.5">
                                    👤 {event.cliente_nome}
                                  </div>
                                )}
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

      {/* Dialog de Criação/Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editingEvent ? "✏️ Editar Compromisso" : "➕ Novo Compromisso"}
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
                    cliente_nome: cliente?.nome || ""
                  });
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione um cliente" />
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

            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Data do Compromisso *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio ? format(parseISO(formData.data_inicio), "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    const currentStart = formData.data_inicio ? parseISO(formData.data_inicio) : new Date();
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
                      value={formData.data_inicio ? format(parseISO(formData.data_inicio), "HH") : ""}
                      onValueChange={(hour) => {
                        const date = formData.data_inicio ? parseISO(formData.data_inicio) : new Date();
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
                      value={formData.data_inicio ? format(parseISO(formData.data_inicio), "mm") : ""}
                      onValueChange={(minute) => {
                        const date = formData.data_inicio ? parseISO(formData.data_inicio) : new Date();
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
                      value={formData.data_fim ? format(parseISO(formData.data_fim), "HH") : ""}
                      onValueChange={(hour) => {
                        const date = formData.data_fim ? parseISO(formData.data_fim) : new Date();
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
                      value={formData.data_fim ? format(parseISO(formData.data_fim), "mm") : ""}
                      onValueChange={(minute) => {
                        const date = formData.data_fim ? parseISO(formData.data_fim) : new Date();
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
                    <span className="text-xs text-left text-white font-medium">{color.label.split(' - ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white">Link da Reunião</Label>
              <div className="relative">
                <Input
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  placeholder="Link gerado automaticamente pelo Google Meet"
                  className="bg-white/10 border-white/20 text-white"
                  disabled={!editingEvent}
                />
                {!editingEvent && (
                  <div className="text-xs text-green-300 mt-1">
                    ✨ O link do Google Meet será gerado automaticamente ao salvar
                  </div>
                )}
              </div>
              {formData.meeting_link && (
                <a 
                  href={formData.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:text-blue-200 mt-2 inline-flex items-center gap-1"
                >
                  🎥 Abrir reunião no Google Meet
                </a>
              )}
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

            <div className="flex justify-between pt-4">
              {editingEvent && (
                <Button 
                  type="button" 
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
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
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {editingEvent ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}