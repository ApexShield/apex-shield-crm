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
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
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
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    cor: "#0891b2",
    tipo: "agendado"
  });

  const queryClient = useQueryClient();

  const { data: compromissos = [] } = useQuery({
    queryKey: ["compromissos"],
    queryFn: () => base44.entities.Compromisso.list()
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list()
  });

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
      tipo: "agendado"
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
      endereco: event.endereco || ""
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
      tipo: "agendado"
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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { locale: ptBR }))}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-lg font-medium text-slate-700 ml-2">
                  {format(currentWeekStart, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
            <Button onClick={() => {
              const now = new Date();
              setSelectedSlot({ startTime: now, endTime: new Date(now.getTime() + 3600000) });
              setFormData({
                titulo: "",
                descricao: "",
                data_inicio: now.toISOString(),
                data_fim: new Date(now.getTime() + 3600000).toISOString(),
                cor: "#0891b2",
                tipo: "agendado"
              });
              setEditingEvent(null);
              setShowDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Compromisso
            </Button>
          </div>

          <div className="flex">
            {/* Sidebar com calendário */}
            <div className="w-64 border-r border-slate-200 p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCurrentWeekStart(startOfWeek(date, { locale: ptBR }));
                }}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>

            {/* Grade de horários */}
            <div className="flex-1 overflow-auto">
              <div className="min-w-[900px]">
                {/* Cabeçalho dos dias */}
                <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                  <div className="p-2 text-center text-sm font-medium text-slate-500 border-r border-slate-200">
                    <Clock className="w-4 h-4 mx-auto" />
                  </div>
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className={`p-2 text-center border-r border-slate-200 ${
                        isSameDay(day, new Date()) ? "bg-indigo-50" : ""
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-500 uppercase">
                        {format(day, "EEE", { locale: ptBR })}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isSameDay(day, new Date()) ? "text-indigo-600" : "text-slate-800"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid de horários */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-slate-100">
                      <div className="p-2 text-xs text-slate-500 text-right border-r border-slate-200">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const events = getEventsForSlot(day, hour);
                        return (
                          <div
                            key={dayIndex}
                            className="min-h-[60px] border-r border-slate-200 hover:bg-slate-50 cursor-pointer relative p-1"
                            onClick={() => handleSlotClick(day, hour)}
                          >
                            {events.map((event, eventIndex) => (
                              <div
                                key={event.id}
                                className="absolute left-1 right-1 rounded px-2 py-1 text-xs text-white font-medium shadow cursor-pointer hover:opacity-90 z-10"
                                style={{
                                  backgroundColor: event.cor || "#3b82f6",
                                  top: `${eventIndex * 24 + 4}px`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                              >
                                <div className="truncate">{event.titulo}</div>
                                {event.cliente_nome && (
                                  <div className="text-[10px] opacity-90 truncate">
                                    {event.cliente_nome}
                                  </div>
                                )}
                              </div>
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

      {/* Dialog de criação/edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Editar Compromisso" : "Novo Compromisso"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Tipo</Label>
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
                <SelectTrigger>
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
              <Label>Cliente (opcional)</Label>
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
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_inicio ? format(parseISO(formData.data_inicio), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => setFormData({ ...formData, data_inicio: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_fim ? format(parseISO(formData.data_fim), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => setFormData({ ...formData, data_fim: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="space-y-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 hover:bg-slate-50 transition ${
                      formData.cor === color.value ? "border-slate-800 bg-slate-50" : "border-slate-200"
                    }`}
                    onClick={() => setFormData({ ...formData, cor: color.value, tipo: color.tipo })}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-sm text-left">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4">
              {editingEvent && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Deletar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
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