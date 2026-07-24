import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Plus, Clock, CalendarDays, ChevronLeft, ChevronRight, Link2, Repeat, Mail } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, eachDayOfInterval, getDay, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import CompromissoFixoDialog from "../components/compromissos/CompromissoFixoDialog";
import MobileAgendaView from "../components/compromissos/MobileAgendaView";
import CorretorSelector from "../components/compromissos/CorretorSelector";
import GoogleCalendarStatus from "../components/compromissos/GoogleCalendarStatus";


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
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [defaultMeetingLink, setDefaultMeetingLink] = useState("");
  const [showFixoDialog, setShowFixoDialog] = useState(false);
  const [savingFixo, setSavingFixo] = useState(false);
  const [mobileDayIndex, setMobileDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState(null);
  const [selectedCorretor, setSelectedCorretor] = useState(null);

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

  useEffect(() => {
    if (user?.link_reuniao_padrao) setDefaultMeetingLink(user.link_reuniao_padrao);
  }, [user]);

  // Real-time subscription for live status updates
  useEffect(() => {
    const unsubscribe = base44.entities.Compromisso.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: allClientes = [] } = useQuery({
    queryKey: ["clientes"], queryFn: () => base44.entities.Cliente.list(), enabled: !!user
  });

  const clientes = useMemo(() => {
    if (!user || !allClientes.length) return [];
    if (user.role === "admin") return allClientes.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    return allClientes.filter(c => c.created_by === user.email).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [allClientes, user]);


  const isLeader = user?.tipo_hierarquia === 'LiderUnidade' || user?.tipo_hierarquia === 'LiderAgencia' || user?.role === 'admin';

  // Fetch team members for leaders
  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listarCompromissosEquipe', {});
      return res.data;
    },
    enabled: !!user && isLeader,
  });
  const teamMembers = teamData?.teamMembers || [];

  // Fetch own compromissos (RLS handles visibility)
  const { data: localCompromissos = [], isLoading } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list('-data_inicio', 2000),
    enabled: !!user && !selectedCorretor,
  });

  // Fetch selected corretor's compromissos via backend
  const { data: corretorData, isLoading: loadingCorretor } = useQuery({
    queryKey: ['compromissos-corretor', selectedCorretor],
    queryFn: async () => {
      const res = await base44.functions.invoke('listarCompromissosEquipe', { corretor_email: selectedCorretor });
      return res.data;
    },
    enabled: !!user && !!selectedCorretor,
  });

  const compromissos = useMemo(() => {
    if (selectedCorretor) {
      return corretorData?.compromissos || [];
    }
    return localCompromissos;
  }, [localCompromissos, corretorData, selectedCorretor]);

  const criarMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.meeting_link && defaultMeetingLink && data.modalidade === "online") {
        data.meeting_link = defaultMeetingLink;
      }
      if (user?.email) {
        data.owner_email = user.email;
      }
      const result = await base44.entities.Compromisso.create(data);

      // Fire-and-forget: sync with Google Calendar + send invite (don't block UI)
      const bgTasks = async () => {
        // Sync with Google Calendar
        try {
          const calRes = await base44.functions.invoke('criarEventoCalendar', {
            summary: data.titulo,
            description: data.descricao || '',
            startDateTime: data.data_inicio,
            endDateTime: data.data_fim,
            location: data.modalidade === 'presencial' ? (data.endereco || '') : '',
            attendees: data.email_participante ? [{ email: data.email_participante }] : [],
          });
          if (calRes.data?.success && calRes.data.eventId) {
            const updateData = { google_event_id: calRes.data.eventId };
            if (calRes.data.meetingLink && !data.meeting_link) updateData.meeting_link = calRes.data.meetingLink;
            await base44.entities.Compromisso.update(result.id, updateData);
          }
        } catch (err) {
          console.error('Google Calendar sync error (create):', err);
        }

        // Send invite email if participant email is provided
        if (data.email_participante) {
          try {
            await base44.functions.invoke('enviarConviteCompromisso', { compromisso_id: result.id });
          } catch (err) {
            console.error('Erro ao enviar convite:', err);
          }
        }
      };
      bgTasks(); // don't await — runs in background

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
    mutationFn: async ({ updatePayload, sendEmail }) => {
      const { id, ...updateData } = updatePayload;
      await base44.entities.Compromisso.update(id, updateData);

      // Fire-and-forget: sync calendar + send invite (don't block UI)
      const bgTasks = async () => {
        const existingEvent = compromissos.find(c => c.id === id);
        if (existingEvent?.google_event_id) {
          try {
            await base44.functions.invoke('atualizarEventoCalendar', {
              eventId: existingEvent.google_event_id,
              summary: updateData.titulo,
              description: updateData.descricao || '',
              startDateTime: updateData.data_inicio,
              endDateTime: updateData.data_fim,
              location: updateData.modalidade === 'presencial' ? (updateData.endereco || '') : '',
              attendees: updateData.email_participante ? [{ email: updateData.email_participante }] : [],
            });
          } catch (err) {
            console.error('Google Calendar sync error (update):', err);
          }
        }
        if (sendEmail && updateData.email_participante) {
          try {
            await base44.functions.invoke('enviarConviteCompromisso', { compromisso_id: id });
          } catch (err) {
            console.error('Erro ao enviar email de atualização:', err);
          }
        }
      };
      bgTasks(); // don't await — runs in background
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
      alert('✅ Compromisso atualizado!');
    }
  });

  const deletarMutation = useMutation({
    mutationFn: async (id) => {
      // Sync with Google Calendar before deleting
      const existingEvent = compromissos.find(c => c.id === id);
      if (existingEvent?.google_event_id) {
        try {
          await base44.functions.invoke('deletarEventoCalendar', { eventId: existingEvent.google_event_id });
        } catch (err) {
          console.error('Google Calendar sync error (delete):', err);
        }
      }
      await base44.entities.Compromisso.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
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
      const updatePayload = { ...formData, id: editingEvent.id };
      if (editingEvent.email_participante || formData.email_participante) {
        setPendingUpdateData(updatePayload);
        setShowEmailConfirm(true);
      } else {
        atualizarMutation.mutate({ updatePayload, sendEmail: false });
      }
    } else {
      criarMutation.mutate(formData);
    }
  };

  const handleConfirmUpdate = (sendEmail) => {
    if (pendingUpdateData) {
      atualizarMutation.mutate({ updatePayload: pendingUpdateData, sendEmail });
    }
    setShowEmailConfirm(false);
    setPendingUpdateData(null);
  };

  const handleDeleteEvent = () => {
    if (editingEvent && confirm('Tem certeza que deseja deletar este compromisso?')) {
      deletarMutation.mutate(editingEvent.id);
    }
  };

  const handleSendInvite = async () => {
    if (!editingEvent) return;
    setSendingInvite(true);
    try {
      await base44.functions.invoke('enviarConviteCompromisso', { compromisso_id: editingEvent.id });
      alert('✅ Convite reenviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
    } catch (err) {
      alert('Erro ao enviar convite: ' + err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleEditEvent = (event) => {
    // Google-only events: open in Google Calendar
    if (event.source === 'google') {
      if (event.htmlLink) window.open(event.htmlLink, '_blank');
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
      if (!comp.data_inicio || !comp.data_fim) return false;
      const cs = new Date(comp.data_inicio);
      if (isNaN(cs.getTime())) return false;
      // Only show event in its START hour slot to avoid duplicates
      if (cs.getFullYear() !== day.getFullYear() || cs.getMonth() !== day.getMonth() || cs.getDate() !== day.getDate()) return false;
      return cs.getHours() === hour;
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
    if (!event || event.source === 'google') return;
    const newDate = addDays(currentWeekStart, newDay);
    const newStart = new Date(newDate); newStart.setHours(newHour, 0, 0, 0);
    const duration = new Date(event.data_fim).getTime() - new Date(event.data_inicio).getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    atualizarMutation.mutate({
      updatePayload: {
        id: event.id, titulo: event.titulo, descricao: event.descricao,
        data_inicio: newStart.toISOString(), data_fim: newEnd.toISOString(),
        cor: event.cor, modalidade: event.modalidade, email_participante: event.email_participante || ""
      },
      sendEmail: false
    });
  };

  const mobileDay = weekDays[mobileDayIndex] || weekDays[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Desktop header */}
      <div className="hidden md:block p-6">
        <div className="max-w-[1800px] mx-auto mb-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">Agenda</h1>
                <p className="text-indigo-300 text-base">Compromissos e reuniões</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <GoogleCalendarStatus />
              {isLeader && teamMembers.length > 0 && (
                <CorretorSelector teamMembers={teamMembers} selectedEmail={selectedCorretor} onSelect={setSelectedCorretor} />
              )}
              <Button onClick={() => setShowFixoDialog(true)} variant="outline" size="sm" className="bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20">
                <Repeat className="w-4 h-4 mr-2" /> Compromisso Fixo
              </Button>
              <Button onClick={() => setShowLinkDialog(true)} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link2 className="w-4 h-4 mr-2" /> Link Padrão
              </Button>
              <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-8 py-6 text-lg">
                <Plus className="w-5 h-5 mr-2" /> Criar Novo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-white">Agenda</h1>
          <GoogleCalendarStatus />
        </div>
        {isLeader && teamMembers.length > 0 && (
          <CorretorSelector teamMembers={teamMembers} selectedEmail={selectedCorretor} onSelect={setSelectedCorretor} />
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <Button onClick={() => setShowFixoDialog(true)} variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 h-8 px-2.5 text-[10px] font-semibold rounded-lg">
              <Repeat className="w-3 h-3 mr-1" /> Fixo
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} size="sm" className="bg-gradient-to-r from-emerald-500 to-green-600 font-bold h-8 px-3 text-xs rounded-lg shadow-lg shadow-emerald-500/20">
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto md:px-6">
        {/* Mobile view */}
        <div className="md:hidden" style={{ height: "calc(100dvh - 56px - 3.5rem - 52px)" }}>
          <MobileAgendaView
            weekDays={weekDays}
            mobileDayIndex={mobileDayIndex}
            setMobileDayIndex={setMobileDayIndex}
            compromissos={compromissos}
            currentWeekStart={currentWeekStart}
            setCurrentWeekStart={setCurrentWeekStart}
            onEditEvent={handleEditEvent}
            onAddEvent={() => {
              const s = new Date(mobileDay); s.setHours(9, 0, 0, 0);
              const e = new Date(s); e.setHours(10, 0, 0, 0);
              setFormData({ titulo: "", descricao: "", data_inicio: s.toISOString(), data_fim: e.toISOString(), cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", email_participante: "", endereco: "" });
              setShowDialog(true);
            }}
          />
        </div>

        <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 w-9"><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 font-bold text-sm">Hoje</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 w-9"><ChevronRight className="w-5 h-5" /></Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">{format(currentWeekStart, "MMM yyyy", { locale: ptBR })}</span>
              {compromissos.length > 0 && <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-indigo-300">{compromissos.length} compromissos</span>}
              {selectedCorretor && <span className="text-xs bg-purple-500/20 px-2 py-1 rounded-full text-purple-300">👤 {teamMembers.find(m => m.email === selectedCorretor)?.full_name || selectedCorretor}</span>}
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
                    <p className="text-[10px] text-indigo-300 font-semibold mb-1.5">Status dos Lembretes</p>
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black text-white">1</span>
                      <span className="text-xs text-indigo-200">Lembrete 1h enviado</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black text-white">2</span>
                      <span className="text-xs text-indigo-200">Lembrete 30min enviado</span>
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
                          const events = getEventsForSlot(day, hour);
                          return (
                            <Droppable key={`${dayIndex}_${hour}`} droppableId={`${dayIndex}_${hour}`}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}
                                  className={`border-r border-white/5 hover:bg-white/10 cursor-pointer relative transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/20' : ''}`}
                                  style={{ height: '60px' }} onClick={() => handleSlotClick(day, hour)}>
                                  {events.map((event, idx) => {
                                    const { topOffset, heightPx } = calculateEventPosition(event);
                                    const start = new Date(event.data_inicio);
                                    const isGoogleOnly = event.source === 'google';
                                    return (
                                      <Draggable key={event.id} draggableId={`${event.id}_${dayIndex}_${hour}`} index={idx} isDragDisabled={isGoogleOnly}>
                                        {(prov, snap) => (
                                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                            className={`absolute rounded-md px-2 py-1.5 text-[11px] text-white font-bold shadow-lg overflow-hidden ${isGoogleOnly ? 'cursor-pointer ring-1 ring-white/20' : 'cursor-grab'} ${snap.isDragging ? 'z-50 opacity-90 shadow-2xl ring-2 ring-white/50' : 'z-10'}`}
                                            style={{ backgroundColor: event.cor || "#3b82f6", top: `${topOffset}%`, height: `${heightPx}px`, left: '2px', width: 'calc(100% - 4px)', ...prov.draggableProps.style }}
                                            onClick={(e) => { if (!snap.isDragging) { e.stopPropagation(); handleEditEvent(event); } }}>
                                            <div className="flex items-center gap-1">
                                              {isGoogleOnly && <span className="text-[9px] flex-shrink-0" title="Google Calendar">📅</span>}
                                              <span className="truncate flex-1">{event.titulo}</span>
                                              {event.email_participante && (event.lembrete_1h_enviado || event.lembrete_30min_enviado) && (
                                                <span className={`flex-shrink-0 rounded-full w-5 h-5 flex items-center justify-center shadow-md text-[10px] font-black text-white ${event.lembrete_30min_enviado ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                  title={event.lembrete_30min_enviado ? 'Lembrete 30min enviado' : 'Lembrete 1h enviado'}>
                                                  {event.lembrete_30min_enviado ? '2' : '1'}
                                                </span>
                                              )}
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
              </div>
            </div>
            <div><Label className="text-white">Email do Participante (opcional)</Label><Input type="email" value={formData.email_participante} onChange={(e) => setFormData({ ...formData, email_participante: e.target.value })} placeholder="participante@email.com" className="bg-white/10 border-white/20 text-white" />
              <p className="text-xs text-indigo-300 mt-1">📧 Um convite com arquivo .ics será enviado para este endereço, com botões Sim/Não para confirmar presença</p>
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
                    onValueChange={(hour) => { const d = new Date(formData.data_inicio || Date.now()); if (isNaN(d.getTime())) return; d.setHours(parseInt(hour)); const ed = new Date(d); ed.setHours(ed.getHours()+1); if (isNaN(d.getTime()) || isNaN(ed.getTime())) return; setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="H" /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 20 }, (_, i) => i + 4).map(h => <SelectItem key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.data_inicio ? (() => { const d = new Date(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "mm"); })() : ""}
                    onValueChange={(minute) => { const d = new Date(formData.data_inicio || Date.now()); if (isNaN(d.getTime())) return; d.setMinutes(parseInt(minute)); const ed = new Date(d); ed.setHours(ed.getHours()+1); if (isNaN(d.getTime()) || isNaN(ed.getTime())) return; setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="M" /></SelectTrigger>
                    <SelectContent>{['00','15','30','45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-white mb-2 block">Fim *</Label>
                <div className="flex gap-2">
                  <Select value={formData.data_fim ? (() => { const d = new Date(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "HH"); })() : ""}
                    onValueChange={(hour) => { const d = new Date(formData.data_fim || Date.now()); if (isNaN(d.getTime())) return; d.setHours(parseInt(hour)); if (isNaN(d.getTime())) return; setFormData({ ...formData, data_fim: d.toISOString() }); }}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="H" /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 20 }, (_, i) => i + 4).map(h => <SelectItem key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.data_fim ? (() => { const d = new Date(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "mm"); })() : ""}
                    onValueChange={(minute) => { const d = new Date(formData.data_fim || Date.now()); if (isNaN(d.getTime())) return; d.setMinutes(parseInt(minute)); if (isNaN(d.getTime())) return; setFormData({ ...formData, data_fim: d.toISOString() }); }}>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {editingEvent.lembrete_30min_enviado ? (
                      <span className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black text-white">2</span>
                    ) : editingEvent.lembrete_1h_enviado ? (
                      <span className="bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black text-white">1</span>
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-sm text-white">
                      {editingEvent.lembrete_30min_enviado ? 'Lembrete de 30min enviado' : editingEvent.lembrete_1h_enviado ? 'Lembrete de 1h enviado' : 'Nenhum lembrete enviado ainda'}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    editingEvent.lembrete_30min_enviado ? 'bg-green-500/20 text-green-300' : 
                    editingEvent.lembrete_1h_enviado ? 'bg-yellow-500/20 text-yellow-300' : 
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {editingEvent.lembrete_30min_enviado ? '✅ 2/2 enviados' : editingEvent.lembrete_1h_enviado ? '⏳ 1/2 enviado' : '0/2 enviados'}
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleSendInvite} disabled={sendingInvite}
                  className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 w-full">
                  <Mail className="w-4 h-4 mr-2" /> {sendingInvite ? 'Enviando...' : 'Reenviar Convite por Email'}
                </Button>
              </div>
            )}
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

      {/* Dialog Link Padrão */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-white/20">
          <DialogHeader><DialogTitle className="text-white text-xl flex items-center gap-2"><Link2 className="w-5 h-5 text-cyan-400" /> Link de Reunião Padrão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-indigo-200 text-sm">Configure o link de reunião que será incluído automaticamente nos compromissos online e nos emails de convite.</p>
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

      {/* Dialog confirmar envio de email na edição */}
      <AlertDialog open={showEmailConfirm} onOpenChange={setShowEmailConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Enviar email de atualização?</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-200">
              Deseja enviar um email informando o participante sobre as alterações feitas neste compromisso?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmUpdate(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Não, apenas salvar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmUpdate(true)} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
              Sim, enviar email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}