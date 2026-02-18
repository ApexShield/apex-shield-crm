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
import { Calendar, Plus, Clock, CalendarDays, ChevronLeft, ChevronRight, Link2, CheckCircle2, RefreshCw, Repeat, Download, List } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, parseISO, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, eachDayOfInterval, getDay, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import ConexaoStatusBanner from "../components/compromissos/ConexaoStatusBanner";
import CompromissoFixoDialog from "../components/compromissos/CompromissoFixoDialog";

const HOURS = Array.from({ length: 20 }, (_, i) => i + 4);
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
  const [editingEvent, setEditingEvent] = useState(null);
  // Removed: email confirmation dialog no longer needed - Google Calendar handles notifications
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [defaultMeetingLink, setDefaultMeetingLink] = useState("");
  const [checkingConfirmations, setCheckingConfirmations] = useState(false);
  const [showFixoDialog, setShowFixoDialog] = useState(false);
  const [savingFixo, setSavingFixo] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [mobileView, setMobileView] = useState("week"); // "week" or "day"
  const [mobileDayIndex, setMobileDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const getDefaultDates = () => {
    const now = new Date();
    return { data_inicio: now.toISOString(), data_fim: new Date(now.getTime() + 3600000).toISOString() };
  };

  const [formData, setFormData] = useState({
    titulo: "", descricao: "", ...getDefaultDates(),
    cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", email_participante: "", endereco: ""
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => base44.auth.me() });

  // Carregar link padrão do perfil do usuário
  React.useEffect(() => {
    if (user?.link_reuniao_padrao) setDefaultMeetingLink(user.link_reuniao_padrao);
  }, [user]);

  const { data: allClientes = [] } = useQuery({
    queryKey: ["clientes"], queryFn: () => base44.entities.Cliente.list(), enabled: !!user
  });

  const clientes = useMemo(() => {
    if (!user || !allClientes.length) return [];
    if (user.role === "admin") return allClientes.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    return allClientes.filter(c => c.created_by === user.email).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [allClientes, user]);

  // Buscar compromissos da entidade local
  const { data: localCompromissos = [], isLoading } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list('-data_inicio', 500),
    enabled: !!user
  });

  // Buscar eventos do Google Calendar para a semana atual
  const weekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);
  const { data: googleEvents = [] } = useQuery({
    queryKey: ['google-calendar-events', currentWeekStart.toISOString()],
    queryFn: async () => {
      const dataInicio = new Date(currentWeekStart);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(weekEnd);
      dataFim.setHours(23, 59, 59, 999);
      const res = await base44.functions.invoke('listarEventosCalendar', {
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString()
      });
      return res.data?.eventos || [];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Merge: local compromissos + google events (avoid duplicates by google_event_id)
  const compromissos = useMemo(() => {
    const localGoogleIds = new Set(localCompromissos.filter(c => c.google_event_id).map(c => c.google_event_id));
    const googleOnly = googleEvents
      .filter(ge => !ge.is_all_day && !localGoogleIds.has(ge.google_event_id))
      .map(ge => ({ ...ge, id: `gcal_${ge.google_event_id}`, _isGoogleOnly: true }));
    return [...localCompromissos, ...googleOnly];
  }, [localCompromissos, googleEvents]);

  // Não enviamos mais email separado - o Google Calendar já envia convite com botão de Sim/Não/Talvez
  // A confirmação é verificada diretamente pelo attendee status no Google Calendar

  const syncToGoogleCalendar = async (compromissoData, compromissoId, existingGoogleEventId = null) => {
    try {
      const attendees = compromissoData.email_participante ? [{ email: compromissoData.email_participante }] : [];
      const payload = {
        summary: compromissoData.titulo,
        description: compromissoData.descricao || '',
        startDateTime: compromissoData.data_inicio,
        endDateTime: compromissoData.data_fim,
        location: compromissoData.endereco || '',
        attendees
      };

      let googleEventId = existingGoogleEventId;
      if (existingGoogleEventId) {
        const res = await base44.functions.invoke('atualizarEventoCalendar', { ...payload, eventId: existingGoogleEventId });
        googleEventId = res.data?.eventId || existingGoogleEventId;
      } else {
        const res = await base44.functions.invoke('criarEventoCalendar', payload);
        googleEventId = res.data?.eventId;
        if (res.data?.meetingLink && compromissoData.modalidade === 'online' && !compromissoData.meeting_link) {
          await base44.entities.Compromisso.update(compromissoId, { meeting_link: res.data.meetingLink });
        }
      }
      if (googleEventId) {
        await base44.entities.Compromisso.update(compromissoId, { google_event_id: googleEventId });
      }
    } catch (err) {
      console.error('Erro ao sincronizar com Google Calendar:', err);
    }
  };

  const criarMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.meeting_link && defaultMeetingLink && data.modalidade === "online") {
        data.meeting_link = defaultMeetingLink;
      }
      if (data.email_participante) {
        data.email_enviado = true;
      }
      const result = await base44.entities.Compromisso.create(data);
      // O Google Calendar envia o convite automaticamente ao participante (sendUpdates=all)
      await syncToGoogleCalendar(data, result.id);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      setShowDialog(false);
      resetForm();
      alert('✅ Compromisso criado com sucesso!');
    }
  });

  const atualizarMutation = useMutation({
    mutationFn: async (data) => {
      const { id, sendEmail, ...updateData } = data;
      if (updateData.email_participante) {
        updateData.email_enviado = true;
      }
      await base44.entities.Compromisso.update(id, updateData);
      // O Google Calendar envia atualização automaticamente ao participante (sendUpdates=all)
      const existing = localCompromissos.find(c => c.id === id);
      await syncToGoogleCalendar(updateData, id, existing?.google_event_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
      alert('✅ Compromisso atualizado!');
    }
  });

  const deletarMutation = useMutation({
    mutationFn: async (id) => {
      const existing = localCompromissos.find(c => c.id === id);
      if (existing?.google_event_id) {
        try {
          await base44.functions.invoke('deletarEventoCalendar', { eventId: existing.google_event_id });
        } catch (err) {
          console.error('Erro ao deletar do Google Calendar:', err);
        }
      }
      await base44.entities.Compromisso.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
      alert('✅ Compromisso deletado!');
    }
  });

  const criarCompromissosFixos = async (formFixo) => {
    setSavingFixo(true);
    try {
      const inicio = new Date(formFixo.data_inicio + "T00:00:00");
      const fim = new Date(formFixo.data_fim + "T00:00:00");
      const allDays = eachDayOfInterval({ start: inicio, end: fim });
      const diasFiltrados = allDays.filter(d => formFixo.dias.includes(getDay(d)));

      const compromissosList = diasFiltrados.map(dia => {
        const [hi, mi] = formFixo.hora_inicio.split(":").map(Number);
        const [hf, mf] = formFixo.hora_fim.split(":").map(Number);
        const di = new Date(dia); di.setHours(hi, mi, 0, 0);
        const df = new Date(dia); df.setHours(hf, mf, 0, 0);
        return {
          titulo: formFixo.titulo,
          descricao: formFixo.descricao || "",
          data_inicio: di.toISOString(),
          data_fim: df.toISOString(),
          cor: formFixo.cor,
          tipo: formFixo.tipo,
          is_fixo: true,
          fixo_dias_semana: formFixo.dias,
          fixo_hora_inicio: formFixo.hora_inicio,
          fixo_hora_fim: formFixo.hora_fim,
          fixo_data_inicio: formFixo.data_inicio,
          fixo_data_fim: formFixo.data_fim
        };
      });

      if (compromissosList.length === 0) {
        alert("Nenhum dia corresponde aos critérios selecionados.");
        setSavingFixo(false);
        return;
      }

      await base44.entities.Compromisso.bulkCreate(compromissosList);

      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setShowFixoDialog(false);
      setSavingFixo(false);
      alert(`✅ ${compromissosList.length} compromissos fixos criados com sucesso!`);

      // Sync to Google Calendar in background (non-blocking)
      for (const c of compromissosList) {
        base44.functions.invoke('criarEventoCalendar', {
          summary: c.titulo,
          description: c.descricao,
          startDateTime: c.data_inicio,
          endDateTime: c.data_fim
        }).catch(err => console.error('Erro sync fixo:', err));
      }
    } catch (err) {
      setSavingFixo(false);
      alert("Erro ao criar compromissos fixos: " + err.message);
    }
  };

  const salvarLinkPadrao = async () => {
    await base44.auth.updateMe({ link_reuniao_padrao: defaultMeetingLink });
    setShowLinkDialog(false);
    alert('✅ Link de reunião padrão salvo!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      // O Google Calendar já notifica automaticamente ao atualizar (sendUpdates=all)
      atualizarMutation.mutate({ ...formData, id: editingEvent.id });
    } else {
      criarMutation.mutate(formData);
    }
  };

  // Removed: Google Calendar handles email notifications automatically

  const handleDeleteEvent = () => {
    if (editingEvent && confirm('Tem certeza que deseja deletar este compromisso?')) {
      deletarMutation.mutate(editingEvent.id);
    }
  };

  const handleEditEvent = (event) => {
    // If it's a Google-only event, open the Google Calendar link
    if (event._isGoogleOnly && event.htmlLink) {
      window.open(event.htmlLink, '_blank');
      return;
    }
    setEditingEvent(event);
    const dataInicio = event.data_inicio ? new Date(event.data_inicio) : new Date();
    const dataFim = event.data_fim ? new Date(event.data_fim) : new Date(dataInicio.getTime() + 3600000);
    const validStart = isNaN(dataInicio.getTime()) ? new Date() : dataInicio;
    const validEnd = isNaN(dataFim.getTime()) ? new Date(validStart.getTime() + 3600000) : dataFim;
    setFormData({
      titulo: event.titulo || '', descricao: event.descricao || '',
      data_inicio: validStart.toISOString(), data_fim: validEnd.toISOString(),
      cor: event.cor || '#0891b2', tipo: COLORS.find(c => c.value === event.cor)?.tipo || 'agendado',
      modalidade: event.modalidade || '', meeting_link: event.meeting_link || '',
      email_participante: event.email_participante || '', endereco: event.endereco || '',
      cliente_id: event.cliente_id || '', cliente_nome: event.cliente_nome || ''
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({ titulo: "", descricao: "", ...getDefaultDates(), cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", email_participante: "", endereco: "" });
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)), [currentWeekStart]);

  const handleSlotClick = (day, hour) => {
    const s = new Date(day); s.setHours(hour, 0, 0, 0);
    const e = new Date(s); e.setHours(hour + 1, 0, 0, 0);
    setFormData({ titulo: "", descricao: "", data_inicio: s.toISOString(), data_fim: e.toISOString(), cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", email_participante: "", endereco: "" });
    setShowDialog(true);
  };

  const getEventsForSlot = (day, hour) => {
    return compromissos.filter(comp => {
      if (!comp.data_inicio) return false;
      const cs = new Date(comp.data_inicio);
      const ce = new Date(comp.data_fim);
      if (isNaN(cs.getTime()) || isNaN(ce.getTime())) return false;
      const ss = new Date(day); ss.setHours(hour, 0, 0, 0);
      const se = new Date(ss); se.setHours(hour + 1, 0, 0, 0);
      return isSameDay(cs, day) && cs < se && ce > ss;
    });
  };

  const calculateEventPosition = (event) => {
    const start = new Date(event.data_inicio);
    const end = new Date(event.data_fim);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { topOffset: 0, heightPx: 58 };
    const topOffset = (start.getMinutes() / 60) * 100;
    const heightPx = Math.max((end.getTime() - start.getTime()) / (1000 * 60) - 2, 20);
    return { topOffset, heightPx };
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const eventId = result.draggableId.split('_')[0];
    const [newDay, newHour] = result.destination.droppableId.split('_').map(Number);
    const event = compromissos.find(e => e.id === eventId);
    if (!event || event._isGoogleOnly) return;
    const newDate = addDays(currentWeekStart, newDay);
    const newStart = new Date(newDate); newStart.setHours(newHour, 0, 0, 0);
    const duration = new Date(event.data_fim).getTime() - new Date(event.data_inicio).getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    atualizarMutation.mutate({
      id: event.id, titulo: event.titulo, descricao: event.descricao,
      data_inicio: newStart.toISOString(), data_fim: newEnd.toISOString(),
      cor: event.cor, modalidade: event.modalidade, email_participante: event.email_participante || ""
    });
  };

  // Mobile day events for list view
  const mobileDay = weekDays[mobileDayIndex] || weekDays[0];
  const mobileDayEvents = useMemo(() => {
    if (!mobileDay) return [];
    return compromissos.filter(c => {
      if (!c.data_inicio) return false;
      const cs = new Date(c.data_inicio);
      return !isNaN(cs.getTime()) && isSameDay(cs, mobileDay);
    }).sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
  }, [compromissos, mobileDay]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <ConexaoStatusBanner />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black text-white">Agenda</h1>
                <p className="text-indigo-300 text-xs md:text-base">Compromissos e reuniões</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowFixoDialog(true)} variant="outline" size="sm" className="bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 text-xs md:text-sm">
                <Repeat className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Compromisso </span>Fixo
              </Button>
              <Button onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
              }} variant="outline" size="sm" className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs md:text-sm">
                <Download className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Sincronizar </span>Google
              </Button>
              <Button onClick={async () => {
                setCheckingConfirmations(true);
                try {
                  const res = await base44.functions.invoke('verificarConfirmacoesCalendar', {});
                  const data = res.data;
                  queryClient.invalidateQueries({ queryKey: ['compromissos'] });
                  alert(data.message || 'Verificação concluída');
                } catch (e) {
                  alert('Erro ao verificar: ' + e.message);
                } finally {
                  setCheckingConfirmations(false);
                }
              }} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm hidden md:flex" disabled={checkingConfirmations}>
                <RefreshCw className={`w-4 h-4 mr-1 md:mr-2 ${checkingConfirmations ? 'animate-spin' : ''}`} /> {checkingConfirmations ? 'Verificando...' : 'Confirmações'}
              </Button>
              <Button onClick={() => setShowLinkDialog(true)} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm hidden md:flex">
                <Link2 className="w-4 h-4 mr-1 md:mr-2" /> Link Padrão
              </Button>
              <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-4 md:px-8 py-3 md:py-6 text-sm md:text-lg">
                <Plus className="w-5 h-5 mr-1 md:mr-2" /> <span className="hidden md:inline">Criar </span>Novo
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-3 md:p-6 border-b border-white/10">
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 font-bold text-xs md:text-sm">Hoje</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></Button>
            </div>
            <span className="text-sm md:text-xl font-bold text-white">{format(currentWeekStart, "MMM yyyy", { locale: ptBR })}</span>
          </div>

          {/* Mobile: Day selector + list view */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto gap-1 p-2 border-b border-white/10">
              {weekDays.map((day, i) => (
                <button key={i} onClick={() => setMobileDayIndex(i)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
                    mobileDayIndex === i ? 'bg-indigo-600 text-white' : isSameDay(day, new Date()) ? 'bg-white/10 text-white' : 'text-indigo-300'
                  }`}>
                  <span className="text-[10px] font-bold uppercase">{format(day, "EEE", { locale: ptBR })}</span>
                  <span className="text-lg font-black">{format(day, "d")}</span>
                </button>
              ))}
            </div>
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {mobileDayEvents.length === 0 ? (
                <div className="text-center py-8 text-indigo-300 text-sm">Nenhum compromisso neste dia</div>
              ) : (
                mobileDayEvents.map(event => {
                  const start = new Date(event.data_inicio);
                  const end = new Date(event.data_fim);
                  return (
                    <div key={event.id} onClick={() => handleEditEvent(event)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                      <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: event.cor || '#3b82f6' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm truncate">{event.titulo}</span>
                          {event.email_participante && event.convidado_confirmou && (
                            <span className="bg-green-500 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-2.5 h-2.5 text-white" /></span>
                          )}
                          {event.email_participante && !event.convidado_confirmou && (
                            <span className="bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0"><Clock className="w-2 h-2 text-white" /></span>
                          )}
                        </div>
                        <div className="text-xs text-indigo-300 mt-0.5">
                          {!isNaN(start.getTime()) && format(start, 'HH:mm')} - {!isNaN(end.getTime()) && format(end, 'HH:mm')}
                          {event.modalidade && <span className="ml-2">{event.modalidade === 'online' ? '💻 Online' : '📍 Presencial'}</span>}
                        </div>
                        {event.endereco && <div className="text-[11px] text-indigo-400 truncate mt-0.5">{event.endereco}</div>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    </div>
                  );
                })
              )}
              <Button onClick={() => { const s = new Date(mobileDay); s.setHours(9,0,0,0); const e = new Date(s); e.setHours(10,0,0,0); setFormData({ titulo: "", descricao: "", data_inicio: s.toISOString(), data_fim: e.toISOString(), cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", email_participante: "", endereco: "" }); setShowDialog(true); }}
                className="w-full bg-white/5 border border-dashed border-white/20 text-indigo-300 hover:bg-white/10 mt-2">
                <Plus className="w-4 h-4 mr-2" /> Adicionar compromisso
              </Button>
            </div>
          </div>

          {/* Desktop: Full week grid */}
          <div className="hidden md:flex">
            <div className="w-72 lg:w-80 border-r border-white/10 p-4 lg:p-6 bg-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><Clock className="w-5 h-5" /> Mini Calendário</h3>
              <div className="bg-white rounded-xl p-2">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={(date) => { if (date) { setSelectedDate(date); setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 })); }}} locale={ptBR} className="rounded-md" />
              </div>
              <div className="mt-6">
                <h4 className="text-white font-bold mb-3 text-sm">Legenda</h4>
                <div className="space-y-2">
                  {COLORS.map((c) => (
                    <div key={c.value} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.value }} />
                      <span className="text-xs text-indigo-200">{c.label}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></span>
                      <span className="text-xs text-indigo-200">Presença confirmada</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center"><Clock className="w-2.5 h-2.5 text-white" /></span>
                      <span className="text-xs text-indigo-200">Aguardando confirmação</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 overflow-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-8 border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
                    <div className="p-2 text-center border-r border-white/10"><Clock className="w-4 h-4 mx-auto text-indigo-400" /></div>
                    {weekDays.map((day, i) => (
                      <div key={i} className={`p-2 text-center border-r border-white/10 ${isSameDay(day, new Date()) ? "bg-gradient-to-b from-indigo-600/20 to-transparent" : ""}`}>
                        <div className="text-[10px] font-bold text-indigo-300 uppercase mb-1">{format(day, "EEE", { locale: ptBR })}</div>
                        <div className={`text-xl font-black ${isSameDay(day, new Date()) ? "text-white bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto" : "text-white"}`}>{format(day, "d")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    {HOURS.map((hour) => (
                      <div key={hour} className="grid grid-cols-8 border-b border-white/5" style={{ height: '60px' }}>
                        <div className="p-2 text-xs font-bold text-indigo-300 text-right border-r border-white/10 bg-white/5">{String(hour).padStart(2, "0")}:00</div>
                        {weekDays.map((day, dayIndex) => {
                          const events = getEventsForSlot(day, hour).filter(e => { const s = new Date(e.data_inicio); return !isNaN(s.getTime()) && s.getHours() === hour; });
                          return (
                            <Droppable key={`${dayIndex}_${hour}`} droppableId={`${dayIndex}_${hour}`}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}
                                  className={`border-r border-white/5 hover:bg-white/10 cursor-pointer relative transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/20' : ''}`}
                                  style={{ height: '60px' }} onClick={() => handleSlotClick(day, hour)}>
                                  {events.map((event, idx) => {
                                    const { topOffset, heightPx } = calculateEventPosition(event);
                                    const start = new Date(event.data_inicio);
                                    return (
                                      <Draggable key={event.id} draggableId={`${event.id}_${dayIndex}_${hour}`} index={idx}>
                                        {(prov, snap) => (
                                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                            className={`absolute rounded-md px-2 py-1.5 text-[11px] text-white font-bold shadow-lg cursor-grab overflow-hidden ${snap.isDragging ? 'z-50 opacity-90 shadow-2xl ring-2 ring-white/50' : 'z-10'}`}
                                            style={{ backgroundColor: event.cor || "#3b82f6", top: `${topOffset}%`, height: `${heightPx}px`, left: '2px', width: 'calc(100% - 4px)', ...prov.draggableProps.style }}
                                            onClick={(e) => { if (!snap.isDragging) { e.stopPropagation(); handleEditEvent(event); } }}>
                                            <div className="flex items-center gap-1">
                                              <span className="truncate flex-1">{event.titulo}</span>
                                              {event.email_participante && event.convidado_confirmou && (
                                                <span className="flex-shrink-0 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md" title="Presença confirmada">
                                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                </span>
                                              )}
                                              {event.email_participante && !event.convidado_confirmou && (
                                                <span className="flex-shrink-0 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md" title="Aguardando confirmação">
                                                  <Clock className="w-3 h-3 text-white" />
                                                </span>
                                              )}
                                              {event._isGoogleOnly && <Calendar className="w-3 h-3 text-white/70 flex-shrink-0" />}
                                            </div>
                                            {!isNaN(start.getTime()) && <div className="text-[9px] opacity-75">{format(start, 'HH:mm')}</div>}
                                            {event.endereco && <div className="text-[9px] opacity-80 truncate">{event.endereco.split(',')[0]}</div>}
                                            {event.modalidade && <div className="text-[9px] opacity-80">{event.modalidade === 'online' ? 'Meet' : 'Presencial'}</div>}
                                            {event.meeting_link && <div className="text-[9px] opacity-90 truncate mt-0.5 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); window.open(event.meeting_link, '_blank'); }}>🔗 Reunião</div>}
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingEvent ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-white">Título *</Label><Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="bg-white/10 border-white/20 text-white" required /></div>
              <div><Label className="text-white">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => { const c = COLORS.find(x => x.tipo === v); setFormData({ ...formData, tipo: v, cor: c ? c.value : formData.cor }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{COLORS.map(c => <SelectItem key={c.tipo} value={c.tipo}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-white">Modalidade</Label>
                <Select value={formData.modalidade} onValueChange={(v) => setFormData({ ...formData, modalidade: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent><SelectItem value="presencial">📍 Presencial</SelectItem><SelectItem value="online">💻 Online</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-white">Cliente (opcional)</Label>
                <Select value={formData.cliente_id} onValueChange={(v) => { const cl = clientes.find(c => c.id === v); setFormData({ ...formData, cliente_id: v, cliente_nome: cl?.nome || "", email_participante: cl?.email || formData.email_participante }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}{c.email ? ` (${c.email})` : ''}</SelectItem>)}</SelectContent>
                </Select>
                {formData.cliente_id && !clientes.find(c => c.id === formData.cliente_id)?.email && (
                  <p className="text-xs text-yellow-300 mt-1">⚠️ Este cliente não possui email cadastrado</p>
                )}
              </div>
            </div>
            <div><Label className="text-white">Email do Participante (opcional)</Label><Input type="email" value={formData.email_participante} onChange={(e) => setFormData({ ...formData, email_participante: e.target.value })} placeholder="participante@email.com" className="bg-white/10 border-white/20 text-white" />
              <p className="text-xs text-indigo-300 mt-1">📅 Um convite do Google Calendar será enviado para este endereço</p>
            </div>
            {formData.modalidade === "online" && (
              <div><Label className="text-white">Link da Reunião</Label><Input value={formData.meeting_link || defaultMeetingLink} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." className="bg-white/10 border-white/20 text-white" />
                {defaultMeetingLink && !formData.meeting_link && <p className="text-xs text-green-300 mt-1">✅ Usando link padrão configurado</p>}
              </div>
            )}
            {formData.modalidade === "presencial" && (
              <div><Label className="text-white">Endereço (opcional)</Label><Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} placeholder="Endereço do compromisso" className="bg-white/10 border-white/20 text-white" /></div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label className="text-white mb-2 block">Data *</Label>
                <Input type="date" value={formData.data_inicio ? (() => { const d = new Date(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd"); })() : ""}
                  onChange={(e) => { if (!e.target.value) return; const [y,m,d] = e.target.value.split('-').map(Number); const cur = new Date(formData.data_inicio || Date.now()); const nd = new Date(y, m-1, d, cur.getHours(), cur.getMinutes()); if (isNaN(nd.getTime())) return; const ne = new Date(nd); ne.setHours(ne.getHours()+1); setFormData({ ...formData, data_inicio: nd.toISOString(), data_fim: ne.toISOString() }); }}
                  className="bg-white/10 border-white/20 text-white w-full" required />
              </div>
              <div><Label className="text-white mb-2 block">Início *</Label>
                <div className="flex gap-2">
                  <Select value={formData.data_inicio ? (() => { const d = new Date(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "HH"); })() : ""}
                    onValueChange={(hour) => { const d = new Date(formData.data_inicio || Date.now()); d.setHours(parseInt(hour)); const ed = new Date(d); ed.setHours(ed.getHours()+1); setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="H" /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 20 }, (_, i) => i + 4).map(h => <SelectItem key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.data_inicio ? (() => { const d = new Date(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "mm"); })() : ""}
                    onValueChange={(minute) => { const d = new Date(formData.data_inicio || Date.now()); d.setMinutes(parseInt(minute)); const ed = new Date(d); ed.setHours(ed.getHours()+1); setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="M" /></SelectTrigger>
                    <SelectContent>{['00','15','30','45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-white mb-2 block">Fim *</Label>
                <div className="flex gap-2">
                  <Select value={formData.data_fim ? (() => { const d = new Date(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "HH"); })() : ""}
                    onValueChange={(hour) => { const d = new Date(formData.data_fim || Date.now()); d.setHours(parseInt(hour)); setFormData({ ...formData, data_fim: d.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="H" /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 20 }, (_, i) => i + 4).map(h => <SelectItem key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.data_fim ? (() => { const d = new Date(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "mm"); })() : ""}
                    onValueChange={(minute) => { const d = new Date(formData.data_fim || Date.now()); d.setMinutes(parseInt(minute)); setFormData({ ...formData, data_fim: d.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="M" /></SelectTrigger>
                    <SelectContent>{['00','15','30','45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div><Label className="text-white mb-2 block">Cor do Compromisso</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COLORS.map((c) => (
                  <button key={c.value} type="button" className={`flex items-center gap-2 p-2 rounded-lg border-2 hover:scale-105 transition-transform ${formData.cor === c.value ? "border-white bg-white/10" : "border-white/20 bg-white/5"}`} onClick={() => setFormData({ ...formData, cor: c.value, tipo: c.tipo })}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: c.value }} />
                    <span className="text-xs text-left text-white font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><Label className="text-white">Descrição</Label><Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={2} className="bg-white/10 border-white/20 text-white" /></div>
            {editingEvent && editingEvent.email_participante && (
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-5 h-5 ${editingEvent.convidado_confirmou ? 'text-green-400' : 'text-white/30'}`} />
                  <span className="text-sm text-white">Convidado confirmou presença</span>
                </div>
                <Button type="button" size="sm" variant={editingEvent.convidado_confirmou ? "default" : "outline"}
                  className={editingEvent.convidado_confirmou ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
                  onClick={async () => {
                    const newVal = !editingEvent.convidado_confirmou;
                    await base44.entities.Compromisso.update(editingEvent.id, { convidado_confirmou: newVal });
                    setEditingEvent({ ...editingEvent, convidado_confirmou: newVal });
                    queryClient.invalidateQueries({ queryKey: ['compromissos'] });
                  }}>
                  {editingEvent.convidado_confirmou ? '✅ Confirmado' : 'Marcar como confirmado'}
                </Button>
              </div>
            )}
            <div className="text-xs text-blue-300 flex items-center gap-1 bg-blue-500/10 p-2 rounded-lg"><Calendar className="w-4 h-4" /> Se informar um email de participante, um convite do Google Calendar será enviado com opções Sim/Não/Talvez</div>
            <div className="flex justify-between pt-2">
              <div>{editingEvent && <Button type="button" variant="outline" onClick={handleDeleteEvent} disabled={deletarMutation.isPending} className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20">{deletarMutation.isPending ? 'Deletando...' : 'Deletar'}</Button>}</div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancelar</Button>
                <Button type="submit" disabled={criarMutation.isPending || atualizarMutation.isPending} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  {editingEvent ? (atualizarMutation.isPending ? 'Salvando...' : 'Salvar') : (criarMutation.isPending ? 'Criando...' : 'Criar')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Removido: Google Calendar envia notificações automaticamente */}

      {/* Dialog Link Padrão */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-white/20">
          <DialogHeader><DialogTitle className="text-white text-xl flex items-center gap-2"><Link2 className="w-5 h-5 text-cyan-400" /> Link de Reunião Padrão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-indigo-200 text-sm">Configure o link de reunião que será incluído automaticamente nos emails de convite para compromissos online.</p>
            <div><Label className="text-white">Link da Reunião</Label><Input value={defaultMeetingLink} onChange={(e) => setDefaultMeetingLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" className="bg-white/10 border-white/20 text-white" /></div>
            <p className="text-xs text-indigo-300">Pode ser Google Meet, Zoom, Teams ou qualquer plataforma de videoconferência.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancelar</Button>
              <Button onClick={salvarLinkPadrao} className="bg-gradient-to-r from-green-500 to-emerald-600">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CompromissoFixoDialog open={showFixoDialog} onClose={() => setShowFixoDialog(false)} onSave={criarCompromissosFixos} saving={savingFixo} />
    </div>
  );
}