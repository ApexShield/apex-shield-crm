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
import { Calendar, Plus, Clock, CalendarDays, ChevronLeft, ChevronRight, Link2, Mail, CheckCircle2, RefreshCw, Repeat, Download } from "lucide-react";
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
  const [showConfirmResend, setShowConfirmResend] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [defaultMeetingLink, setDefaultMeetingLink] = useState("");
  const [checkingConfirmations, setCheckingConfirmations] = useState(false);
  const [showFixoDialog, setShowFixoDialog] = useState(false);
  const [savingFixo, setSavingFixo] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

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

  const enviarEmailCompromisso = async (compromissoData, tipo = "novo", compromissoId = null) => {
    if (!compromissoData.email_participante) return;
    const dataInicio = new Date(compromissoData.data_inicio);
    const dataFim = new Date(compromissoData.data_fim);
    const dataFormatada = format(dataInicio, "dd/MM/yyyy", { locale: ptBR });
    const horaInicio = format(dataInicio, "HH:mm");
    const horaFim = format(dataFim, "HH:mm");
    const linkReuniao = compromissoData.meeting_link || defaultMeetingLink || "";
    const organizador = user?.full_name || user?.email || "Organizador";

    const baseUrl = window.location.origin;
    const confirmUrl = compromissoId ? `${baseUrl}/functions/confirmarPresenca?id=${compromissoId}&action=confirmar` : '';
    const recusarUrl = compromissoId ? `${baseUrl}/functions/confirmarPresenca?id=${compromissoId}&action=recusar` : '';

    const botoesRSVP = compromissoId ? `
      <div style="margin-top:24px;text-align:center;">
        <p style="color:#475569;font-size:14px;margin-bottom:16px;font-weight:600;">Você confirma sua presença?</p>
        <div style="display:inline-block;">
          <a href="${confirmUrl}" style="display:inline-block;background:#10b981;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin:0 8px;">✅ Sim, confirmo</a>
          <a href="${recusarUrl}" style="display:inline-block;background:#ef4444;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin:0 8px;">❌ Não poderei ir</a>
        </div>
      </div>` : '';

    let assunto = "", corpo = "";
    if (tipo === "novo") {
      assunto = `📅 Convite: ${compromissoData.titulo}`;
      corpo = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">📅 Novo Compromisso</h1>
          <p style="color:#e0e7ff;margin:8px 0 0;">APEX SHIELD CRM</p>
        </div>
        <div style="padding:30px;">
          <h2 style="color:#1e293b;margin:0 0 20px;">${compromissoData.titulo}</h2>
          <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;">
            <p style="margin:8px 0;color:#475569;"><strong>📅 Data:</strong> ${dataFormatada}</p>
            <p style="margin:8px 0;color:#475569;"><strong>🕐 Horário:</strong> ${horaInicio} - ${horaFim}</p>
            <p style="margin:8px 0;color:#475569;"><strong>📍 Modalidade:</strong> ${compromissoData.modalidade === 'online' ? 'Online' : 'Presencial'}</p>
            ${compromissoData.endereco ? `<p style="margin:8px 0;color:#475569;"><strong>📍 Endereço:</strong> ${compromissoData.endereco}</p>` : ''}
            ${linkReuniao ? `<p style="margin:8px 0;"><strong>🔗 Link da Reunião:</strong> <a href="${linkReuniao}" style="color:#6366f1;">${linkReuniao}</a></p>` : ''}
            ${compromissoData.descricao ? `<p style="margin:8px 0;color:#475569;"><strong>📝 Descrição:</strong> ${compromissoData.descricao}</p>` : ''}
          </div>
          ${botoesRSVP}
          <p style="color:#64748b;margin-top:20px;font-size:14px;">Organizado por: <strong>${organizador}</strong></p>
        </div>
        <div style="background:#f1f5f9;padding:15px;text-align:center;font-size:12px;color:#94a3b8;">
          APEX SHIELD CRM - Gestão Profissional de Compromissos
        </div>
      </div>`;
    } else {
      assunto = `🔄 Compromisso Atualizado: ${compromissoData.titulo}`;
      corpo = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:30px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">🔄 Compromisso Atualizado</h1>
          <p style="color:#fef3c7;margin:8px 0 0;">APEX SHIELD CRM</p>
        </div>
        <div style="padding:30px;">
          <p style="color:#dc2626;font-weight:bold;margin:0 0 15px;">⚠️ O compromisso abaixo foi alterado pelo organizador:</p>
          <h2 style="color:#1e293b;margin:0 0 20px;">${compromissoData.titulo}</h2>
          <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;">
            <p style="margin:8px 0;color:#475569;"><strong>📅 Nova Data:</strong> ${dataFormatada}</p>
            <p style="margin:8px 0;color:#475569;"><strong>🕐 Novo Horário:</strong> ${horaInicio} - ${horaFim}</p>
            <p style="margin:8px 0;color:#475569;"><strong>📍 Modalidade:</strong> ${compromissoData.modalidade === 'online' ? 'Online' : 'Presencial'}</p>
            ${compromissoData.endereco ? `<p style="margin:8px 0;color:#475569;"><strong>📍 Endereço:</strong> ${compromissoData.endereco}</p>` : ''}
            ${linkReuniao ? `<p style="margin:8px 0;"><strong>🔗 Link da Reunião:</strong> <a href="${linkReuniao}" style="color:#6366f1;">${linkReuniao}</a></p>` : ''}
          </div>
          ${botoesRSVP}
          <p style="color:#64748b;margin-top:20px;font-size:14px;">Atualizado por: <strong>${organizador}</strong></p>
        </div>
        <div style="background:#f1f5f9;padding:15px;text-align:center;font-size:12px;color:#94a3b8;">
          APEX SHIELD CRM - Gestão Profissional de Compromissos
        </div>
      </div>`;
    }

    await base44.functions.invoke('enviarEmailGmail', {
      to: compromissoData.email_participante,
      subject: assunto,
      body: corpo
    });
  };

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
      if (data.email_participante) await enviarEmailCompromisso(data, "novo", result.id);
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
      if (sendEmail && updateData.email_participante) {
        updateData.email_enviado = true;
      }
      await base44.entities.Compromisso.update(id, updateData);
      if (sendEmail && updateData.email_participante) await enviarEmailCompromisso(updateData, "atualizado", id);
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

      const compromissos = diasFiltrados.map(dia => {
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

      if (compromissos.length === 0) {
        alert("Nenhum dia corresponde aos critérios selecionados.");
        return;
      }

      await base44.entities.Compromisso.bulkCreate(compromissos);

      // Sync each to Google Calendar
      for (const c of compromissos) {
        try {
          const res = await base44.functions.invoke('criarEventoCalendar', {
            summary: c.titulo,
            description: c.descricao,
            startDateTime: c.data_inicio,
            endDateTime: c.data_fim
          });
          // We don't save google_event_id for bulk, it's optional
        } catch (err) {
          console.error('Erro sync fixo:', err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setShowFixoDialog(false);
      alert(`✅ ${compromissos.length} compromissos fixos criados com sucesso!`);
    } catch (err) {
      alert("Erro ao criar compromissos fixos: " + err.message);
    } finally {
      setSavingFixo(false);
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
      if (formData.email_participante) {
        setPendingUpdateData(formData);
        setShowConfirmResend(true);
      } else {
        atualizarMutation.mutate({ ...formData, id: editingEvent.id, sendEmail: false });
      }
    } else {
      criarMutation.mutate(formData);
    }
  };

  const handleConfirmResend = (send) => {
    if (pendingUpdateData) {
      atualizarMutation.mutate({ ...pendingUpdateData, id: editingEvent.id, sendEmail: send });
    }
    setShowConfirmResend(false);
    setPendingUpdateData(null);
  };

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
    if (!event) return;
    const newDate = addDays(currentWeekStart, newDay);
    const newStart = new Date(newDate); newStart.setHours(newHour, 0, 0, 0);
    const duration = new Date(event.data_fim).getTime() - new Date(event.data_inicio).getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    atualizarMutation.mutate({
      id: event.id, titulo: event.titulo, descricao: event.descricao,
      data_inicio: newStart.toISOString(), data_fim: newEnd.toISOString(),
      cor: event.cor, modalidade: event.modalidade, email_participante: event.email_participante || "",
      sendEmail: !!event.email_participante
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6 space-y-4">
          <ConexaoStatusBanner />
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
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowFixoDialog(true)} variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20">
                <Repeat className="w-4 h-4 mr-2" /> Compromisso Fixo
              </Button>
              <Button onClick={async () => {
                setCheckingConfirmations(true);
                try {
                  const res = await base44.functions.invoke('verificarConfirmacoesGmail', {});
                  const data = res.data;
                  queryClient.invalidateQueries({ queryKey: ['compromissos'] });
                  alert(data.message || 'Verificação concluída');
                } catch (e) {
                  alert('Erro ao verificar: ' + e.message);
                } finally {
                  setCheckingConfirmations(false);
                }
              }} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" disabled={checkingConfirmations}>
                <RefreshCw className={`w-4 h-4 mr-2 ${checkingConfirmations ? 'animate-spin' : ''}`} /> {checkingConfirmations ? 'Verificando...' : 'Verificar Confirmações'}
              </Button>
              <Button onClick={() => setShowLinkDialog(true)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link2 className="w-4 h-4 mr-2" /> Link de Reunião Padrão
              </Button>
              <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-8 py-6 text-lg">
                <Plus className="w-5 h-5 mr-2" /> Criar Compromisso
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="bg-white/10 border-white/20 text-white hover:bg-white/20"><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="outline" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 font-bold">Hoje</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="bg-white/10 border-white/20 text-white hover:bg-white/20"><ChevronRight className="w-5 h-5" /></Button>
            </div>
            <span className="text-xl font-bold text-white">{format(currentWeekStart, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>

          <div className="flex">
            <div className="w-80 border-r border-white/10 p-6 bg-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Mini Calendário</h3>
              <div className="bg-white rounded-xl p-2">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 })); }} locale={ptBR} className="rounded-md" />
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
                                              {event.convidado_confirmou && <CheckCircle2 className="w-3 h-3 text-green-200 flex-shrink-0" />}
                                            </div>
                                            {!isNaN(start.getTime()) && <div className="text-[9px] opacity-75">{format(start, 'HH:mm')}</div>}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingEvent ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-white">Título *</Label><Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="bg-white/10 border-white/20 text-white" required /></div>
              <div><Label className="text-white">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => { const c = COLORS.find(x => x.tipo === v); setFormData({ ...formData, tipo: v, cor: c ? c.value : formData.cor }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{COLORS.map(c => <SelectItem key={c.tipo} value={c.tipo}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-indigo-300 mt-1">📧 Um email personalizado será enviado para este endereço</p>
            </div>
            {formData.modalidade === "online" && (
              <div><Label className="text-white">Link da Reunião</Label><Input value={formData.meeting_link || defaultMeetingLink} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." className="bg-white/10 border-white/20 text-white" />
                {defaultMeetingLink && !formData.meeting_link && <p className="text-xs text-green-300 mt-1">✅ Usando link padrão configurado</p>}
              </div>
            )}
            {formData.modalidade === "presencial" && (
              <div><Label className="text-white">Endereço (opcional)</Label><Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} placeholder="Endereço do compromisso" className="bg-white/10 border-white/20 text-white" /></div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-white mb-2 block">Data *</Label>
                <Input type="date" value={formData.data_inicio ? (() => { const d = new Date(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd"); })() : ""}
                  onChange={(e) => { if (!e.target.value) return; const [y,m,d] = e.target.value.split('-').map(Number); const cur = new Date(formData.data_inicio || Date.now()); const nd = new Date(y, m-1, d, cur.getHours(), cur.getMinutes()); if (isNaN(nd.getTime())) return; const ne = new Date(nd); ne.setHours(ne.getHours()+1); setFormData({ ...formData, data_inicio: nd.toISOString(), data_fim: ne.toISOString() }); }}
                  className="bg-white/10 border-white/20 text-white w-full" required />
              </div>
              <div><Label className="text-white mb-2 block">Início *</Label>
                <Input type="time" value={formData.data_inicio ? (() => { const d = new Date(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "HH:mm"); })() : ""}
                  onChange={(e) => { if (!e.target.value) return; const [h,m] = e.target.value.split(':').map(Number); const d = new Date(formData.data_inicio || Date.now()); d.setHours(h,m); const ed = new Date(d); ed.setHours(ed.getHours()+1); setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}
                  className="bg-white/10 border-white/20 text-white w-full" required />
              </div>
              <div><Label className="text-white mb-2 block">Fim *</Label>
                <Input type="time" value={formData.data_fim ? (() => { const d = new Date(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "HH:mm"); })() : ""}
                  onChange={(e) => { if (!e.target.value) return; const [h,m] = e.target.value.split(':').map(Number); const d = new Date(formData.data_fim || Date.now()); d.setHours(h,m); setFormData({ ...formData, data_fim: d.toISOString() }); }}
                  className="bg-white/10 border-white/20 text-white w-full" required />
              </div>
            </div>
            <div><Label className="text-white mb-2 block">Cor do Compromisso</Label>
              <div className="grid grid-cols-3 gap-2">
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
            <div className="text-xs text-blue-300 flex items-center gap-1 bg-blue-500/10 p-2 rounded-lg"><Mail className="w-4 h-4" /> Se informar um email de participante, um convite personalizado será enviado automaticamente</div>
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

      {/* Confirmar reenvio de email */}
      <Dialog open={showConfirmResend} onOpenChange={setShowConfirmResend}>
        <DialogContent className="max-w-md bg-slate-900 border-white/20">
          <DialogHeader><DialogTitle className="text-white text-xl">📧 Notificar Participante?</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-indigo-200">Deseja enviar um email atualizado ao participante sobre as mudanças?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleConfirmResend(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Não enviar</Button>
              <Button onClick={() => handleConfirmResend(true)} className="bg-gradient-to-r from-green-500 to-emerald-600">Sim, enviar email</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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