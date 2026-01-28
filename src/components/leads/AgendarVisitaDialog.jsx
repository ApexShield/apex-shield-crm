import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

const COLORS = [
  { value: "#0891b2", label: "Azul Pavão - Agendado", tipo: "agendado" },
  { value: "#fbbf24", label: "Amarelo Banana - Delay", tipo: "delay" },
  { value: "#8b5cf6", label: "Mirtilo - Reunião Realizada", tipo: "reuniao_realizada" },
  { value: "#10b981", label: "Manjericão - Venda Feita", tipo: "venda_feita" },
  { value: "#f97316", label: "Tangerina - Compromisso Pessoal", tipo: "pessoal" },
  { value: "#ec4899", label: "Flamingo - Compromisso da Avanti", tipo: "avanti" }
];

export default function AgendarVisitaDialog({ open, onClose, cliente, user, onSave }) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    cor: "#0891b2",
    tipo: "agendado",
    modalidade: "",
    meeting_link: "",
    endereco: ""
  });
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState("");

  const isVIPOrAdmin = user?.role === "admin" || user?.role_type === "UsuarioVIP";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data_inicio || !formData.data_fim) {
      setErro("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.modalidade) {
      setErro("Por favor, selecione a modalidade (Online ou Presencial)");
      return;
    }

    if (formData.modalidade === "presencial" && !formData.endereco) {
      setErro("Por favor, informe o endereço para compromisso presencial");
      return;
    }

    setValidando(true);
    setErro("");

    try {
      const dataToSubmit = { ...formData };
      if (formData.modalidade === "online" && formData.titulo && !formData.titulo.includes("(Online)")) {
        dataToSubmit.titulo = `${formData.titulo} (Online)`;
      }

      const eventData = {
        summary: dataToSubmit.titulo,
        description: dataToSubmit.descricao || '',
        start: {
          dateTime: dataToSubmit.data_inicio
        },
        end: {
          dateTime: dataToSubmit.data_fim
        },
        location: formData.modalidade === 'presencial' ? (formData.endereco || '') : 'Online'
      };

      if (cliente?.email) {
        eventData.attendees = [{ email: cliente.email }];
      }

      const googleResponse = await base44.functions.invoke('criarEventoCalendar', eventData);
      
      if (googleResponse.data?.meetLink) {
        dataToSubmit.meeting_link = googleResponse.data.meetLink;
        dataToSubmit.google_event_id = googleResponse.data.eventId;
        dataToSubmit.google_event_link = googleResponse.data.eventLink;
      }

      await base44.entities.Compromisso.create({
        ...dataToSubmit,
        cliente_id: cliente?.id || "",
        cliente_nome: cliente?.nome || ""
      });

      const agendamento = {
        tipo: formData.tipo,
        dataHora: formData.data_inicio,
        endereco: formData.endereco,
        titulo: dataToSubmit.titulo,
        convidados: cliente?.email ? [cliente.email] : [],
        meeting_link: dataToSubmit.meeting_link
      };

      onSave(agendamento);
      resetForm();
      onClose();
      
      alert('✅ Compromisso criado e sincronizado com Google Calendar!');
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      setErro(`Erro ao criar agendamento: ${error.message || 'Tente novamente'}`);
    } finally {
      setValidando(false);
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
      meeting_link: "",
      endereco: ""
    });
    setErro("");
  };

  if (!isVIPOrAdmin) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: '#AFCB3A' }} />
              Agendamento de Visita
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-700 font-semibold mb-2">Função Exclusiva VIP</p>
            <p className="text-sm text-gray-600">Esta funcionalidade está disponível apenas para usuários VIP e Administradores.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose(); }}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            🗓️ Editar Compromisso
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white">Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder={`${cliente?.nome || 'Compromisso'}`}
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

          {formData.modalidade === "presencial" && (
            <div>
              <Label className="text-white">Endereço (opcional)</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço do compromisso"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          )}

          {cliente?.email && (
            <div className="bg-green-500/20 border border-green-500/50 px-3 py-2 rounded-lg text-sm text-green-100">
              ✉️ Convite será enviado para: <strong>{cliente.email}</strong>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">Data *</Label>
              <Input
                type="date"
                value={formData.data_inicio ? (() => {
                  try {
                    const date = parseISO(formData.data_inicio);
                    return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
                  } catch {
                    return "";
                  }
                })() : ""}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  if (!year || !month || !day) return;
                  
                  const currentStart = formData.data_inicio ? parseISO(formData.data_inicio) : new Date();
                  const newDate = new Date(year, month - 1, day, currentStart.getHours(), currentStart.getMinutes());
                  
                  if (isNaN(newDate.getTime())) return;
                  
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
                    value={formData.data_inicio ? (() => {
                      try {
                        const date = parseISO(formData.data_inicio);
                        return isNaN(date.getTime()) ? "" : format(date, "HH");
                      } catch {
                        return "";
                      }
                    })() : ""}
                    onValueChange={(hour) => {
                      const date = formData.data_inicio ? parseISO(formData.data_inicio) : new Date();
                      if (isNaN(date.getTime())) return;
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
                      <SelectValue placeholder="HH" />
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
                    value={formData.data_inicio ? (() => {
                      try {
                        const date = parseISO(formData.data_inicio);
                        return isNaN(date.getTime()) ? "" : format(date, "mm");
                      } catch {
                        return "";
                      }
                    })() : ""}
                    onValueChange={(minute) => {
                      const date = formData.data_inicio ? parseISO(formData.data_inicio) : new Date();
                      if (isNaN(date.getTime())) return;
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
                      <SelectValue placeholder="MM" />
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
                    value={formData.data_fim ? (() => {
                      try {
                        const date = parseISO(formData.data_fim);
                        return isNaN(date.getTime()) ? "" : format(date, "HH");
                      } catch {
                        return "";
                      }
                    })() : ""}
                    onValueChange={(hour) => {
                      const date = formData.data_fim ? parseISO(formData.data_fim) : new Date();
                      if (isNaN(date.getTime())) return;
                      date.setHours(parseInt(hour));
                      setFormData({ ...formData, data_fim: date.toISOString() });
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                      <SelectValue placeholder="HH" />
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
                    value={formData.data_fim ? (() => {
                      try {
                        const date = parseISO(formData.data_fim);
                        return isNaN(date.getTime()) ? "" : format(date, "mm");
                      } catch {
                        return "";
                      }
                    })() : ""}
                    onValueChange={(minute) => {
                      const date = formData.data_fim ? parseISO(formData.data_fim) : new Date();
                      if (isNaN(date.getTime())) return;
                      date.setMinutes(parseInt(minute));
                      setFormData({ ...formData, data_fim: date.toISOString() });
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                      <SelectValue placeholder="MM" />
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
            <Label className="text-white">Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {erro && (
            <div className="bg-red-500/20 border border-red-500/50 px-3 py-2 rounded-lg text-sm text-red-100">
              {erro}
            </div>
          )}

          <div className="text-xs text-green-300 flex items-center gap-1">
            ✨ O link do Google Meet será gerado automaticamente ao salvar
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { resetForm(); onClose(); }}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={validando}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {validando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}