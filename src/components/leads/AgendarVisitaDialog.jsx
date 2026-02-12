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
  const [tipoCompromisso, setTipoCompromisso] = useState(""); // AB Visita, Fechamento, Entrega de Apólice
  const [subTipoFechamento, setSubTipoFechamento] = useState(""); // F, F2, F3, F4, F5
  const [emailConvidado, setEmailConvidado] = useState("");
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    
    return {
      titulo: "",
      descricao: "",
      data_inicio: now.toISOString(),
      data_fim: end.toISOString(),
      cor: "#0891b2",
      tipo: "agendado",
      modalidade: "",
      meeting_link: "",
      endereco: ""
    };
  });
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState("");

  const isVIPOrAdmin = user?.role === "admin" || user?.role_type === "UsuarioVIP";

  // Atualizar título automaticamente quando tipo de compromisso mudar
  const atualizarTitulo = (tipoComp, subTipo) => {
    let prefixo = "";
    if (tipoComp === "AB Visita") {
      prefixo = "AB";
    } else if (tipoComp === "Fechamento" && subTipo) {
      prefixo = subTipo;
    } else if (tipoComp === "Entrega de Apólice") {
      prefixo = "ENT APOLICE";
    }
    
    const novoTitulo = prefixo ? `${prefixo} - ${cliente?.nome || ''}` : "";
    setFormData(prev => ({ ...prev, titulo: novoTitulo }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tipoCompromisso) {
      setErro("Por favor, selecione o tipo de compromisso");
      return;
    }

    if (tipoCompromisso === "Fechamento" && !subTipoFechamento) {
      setErro("Por favor, selecione a fase do fechamento");
      return;
    }
    
    if (!formData.titulo || !formData.data_inicio || !formData.data_fim) {
      setErro("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validar se as datas são válidas
    try {
      const startDate = parseISO(formData.data_inicio);
      const endDate = parseISO(formData.data_fim);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setErro("Datas inválidas. Por favor, verifique os campos de data e hora.");
        return;
      }
    } catch (error) {
      setErro("Erro ao processar as datas. Por favor, verifique os campos.");
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

      const participanteEmail = emailConvidado || cliente?.email;
      
      const eventData = {
        summary: dataToSubmit.titulo,
        description: dataToSubmit.descricao || '',
        startDateTime: dataToSubmit.data_inicio,
        endDateTime: dataToSubmit.data_fim,
        location: formData.modalidade === 'presencial' ? (formData.endereco || '') : 'Online'
      };

      if (participanteEmail) {
        eventData.attendees = [{ email: participanteEmail }];
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
        convidados: participanteEmail ? [participanteEmail] : [],
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
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    
    setTipoCompromisso("");
    setSubTipoFechamento("");
    setEmailConvidado("");
    setFormData({
      titulo: "",
      descricao: "",
      data_inicio: now.toISOString(),
      data_fim: end.toISOString(),
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
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
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Tipo de Compromisso *</Label>
              <Select 
                value={tipoCompromisso} 
                onValueChange={(value) => {
                  setTipoCompromisso(value);
                  setSubTipoFechamento("");
                  if (value !== "Fechamento") {
                    atualizarTitulo(value, "");
                  }
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AB Visita">AB Visita</SelectItem>
                  <SelectItem value="Fechamento">Fechamento</SelectItem>
                  <SelectItem value="Entrega de Apólice">Entrega de Apólice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoCompromisso === "Fechamento" && (
              <div>
                <Label className="text-white">Fase do Fechamento *</Label>
                <Select 
                  value={subTipoFechamento} 
                  onValueChange={(value) => {
                    setSubTipoFechamento(value);
                    atualizarTitulo("Fechamento", value);
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione a fase..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="F2">F2</SelectItem>
                    <SelectItem value="F3">F3</SelectItem>
                    <SelectItem value="F4">F4</SelectItem>
                    <SelectItem value="F5">F5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <Label className="text-white">Email do Participante (opcional)</Label>
            <Input
              type="email"
              value={emailConvidado}
              onChange={(e) => setEmailConvidado(e.target.value)}
              placeholder={cliente?.email || "Digite o email do convidado"}
              className="bg-white/10 border-white/20 text-white"
            />
            {(emailConvidado || cliente?.email) && (
              <div className="mt-2 bg-green-500/20 border border-green-500/50 px-3 py-2 rounded-lg text-sm text-green-100">
                ✉️ Convite será enviado para: <strong>{emailConvidado || cliente.email}</strong>
              </div>
            )}
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
                try {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  if (!year || !month || !day) return;
                  
                  let currentHour = 12;
                  let currentMinute = 0;
                  
                  if (formData.data_inicio) {
                    try {
                      const currentStart = parseISO(formData.data_inicio);
                      if (!isNaN(currentStart.getTime())) {
                        currentHour = currentStart.getHours();
                        currentMinute = currentStart.getMinutes();
                      }
                    } catch {}
                  }
                  
                  const newDate = new Date(year, month - 1, day, currentHour, currentMinute);
                  
                  if (isNaN(newDate.getTime())) return;
                  
                  const newEnd = new Date(newDate);
                  newEnd.setHours(newEnd.getHours() + 1);
                  setFormData({ 
                    ...formData, 
                    data_inicio: newDate.toISOString(),
                    data_fim: newEnd.toISOString()
                  });
                } catch (error) {
                  console.error('Erro ao processar data:', error);
                }
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

          <div>
            <Label className="text-white mb-2 block">Cor do Compromisso</Label>
            <div className="grid grid-cols-3 gap-2">
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