import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const COLORS = [
  { value: "#0891b2", label: "Azul Pavão - Agendado", tipo: "agendado" },
  { value: "#fbbf24", label: "Amarelo Banana - Delay", tipo: "delay" },
  { value: "#8b5cf6", label: "Mirtilo - Reunião Realizada", tipo: "reuniao_realizada" },
  { value: "#10b981", label: "Manjericão - Venda Feita", tipo: "venda_feita" },
  { value: "#f97316", label: "Tangerina - Compromisso Pessoal", tipo: "pessoal" },
  { value: "#ec4899", label: "Flamingo - Compromisso da Avanti", tipo: "avanti" }
];

export default function AgendarVisitaDialog({ open, onClose, cliente, user, onSave }) {
  const [tipoCompromisso, setTipoCompromisso] = useState("");
  const [subTipoFechamento, setSubTipoFechamento] = useState("");
  const [emailConvidado, setEmailConvidado] = useState("");
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    return {
      titulo: "", descricao: "",
      data_inicio: now.toISOString(), data_fim: end.toISOString(),
      cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", endereco: ""
    };
  });
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState("");

  // Fetch default meeting link from user profile
  const { data: currentUser } = useQuery({
    queryKey: ["user-for-link"],
    queryFn: () => base44.auth.me(),
  });
  const defaultMeetingLink = currentUser?.link_reuniao_padrao || "";

  const atualizarTitulo = (tipoComp, subTipo) => {
    let prefixo = "";
    if (tipoComp === "AB Visita") prefixo = "AB";
    else if (tipoComp === "Fechamento" && subTipo) prefixo = subTipo;
    else if (tipoComp === "Entrega de Apólice") prefixo = "ENT APOLICE";
    const novoTitulo = prefixo ? `${prefixo} - ${cliente?.nome || ''}` : "";
    setFormData(prev => ({ ...prev, titulo: novoTitulo }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoCompromisso) { setErro("Selecione o tipo de compromisso"); return; }
    if (tipoCompromisso === "Fechamento" && !subTipoFechamento) { setErro("Selecione a fase do fechamento"); return; }
    if (!formData.titulo || !formData.data_inicio || !formData.data_fim) { setErro("Preencha todos os campos obrigatórios"); return; }
    if (!formData.modalidade) { setErro("Selecione a modalidade"); return; }

    const startDate = parseISO(formData.data_inicio);
    const endDate = parseISO(formData.data_fim);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { setErro("Datas inválidas"); return; }

    setValidando(true);
    setErro("");

    try {
      const dataToSubmit = { ...formData };
      // Auto-fill meeting link from default if online and not set
      if (dataToSubmit.modalidade === "online" && !dataToSubmit.meeting_link && defaultMeetingLink) {
        dataToSubmit.meeting_link = defaultMeetingLink;
      }
      const participanteEmail = emailConvidado || cliente?.email;

      const compromisso = await base44.entities.Compromisso.create({
        ...dataToSubmit,
        cliente_id: cliente?.id || "",
        cliente_nome: cliente?.nome || "",
        email_participante: participanteEmail || "",
        owner_email: user?.email || ""
      });

      // Atualizar status do lead conforme tipo de compromisso
      if (cliente?.id) {
        let novoStatus = null;
        if (tipoCompromisso === "AB Visita") {
          novoStatus = "AB Visita";
        } else if (tipoCompromisso === "Fechamento") {
          novoStatus = "AB Fechamento";
        } else if (tipoCompromisso === "Entrega de Apólice") {
          novoStatus = "Entrega de Apólice";
        }

        if (novoStatus && cliente.status !== novoStatus) {
          const historicoAtual = cliente.historico_status || [];
          await base44.entities.Cliente.update(cliente.id, {
            status: novoStatus,
            historico_status: [
              ...historicoAtual,
              { de: cliente.status, para: novoStatus, data: new Date().toISOString(), timestamp: Date.now() }
            ]
          });
        }
      }

      // Send calendar invite if participant email exists
      let conviteMsg = '';
      if (participanteEmail) {
        try {
          const res = await base44.functions.invoke('enviarConviteCompromisso', { compromisso_id: compromisso.id });
          if (res.data?.warning === 'no_calendar_connection') {
            conviteMsg = '\n\n⚠️ Email enviado, mas sem opção Aceitar/Recusar. Conecte seu Google Calendar na página de Compromissos para enviar convites nativos.';
          } else {
            conviteMsg = '\n\n📧 Convite de calendário enviado com opções de Aceitar/Recusar!';
          }
        } catch (err) {
          console.error('Erro ao enviar convite:', err);
          conviteMsg = '\n\n⚠️ Erro ao enviar convite por email.';
        }
      }

      onSave({
        tipo: formData.tipo,
        dataHora: formData.data_inicio,
        endereco: formData.endereco,
        titulo: dataToSubmit.titulo,
        convidados: participanteEmail ? [participanteEmail] : [],
        meeting_link: dataToSubmit.meeting_link
      });

      resetForm();
      onClose();
      alert('✅ Compromisso criado!' + conviteMsg);
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Tente novamente';
      setErro(`Erro: ${msg}`);
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
    setFormData({ titulo: "", descricao: "", data_inicio: now.toISOString(), data_fim: end.toISOString(), cor: "#0891b2", tipo: "agendado", modalidade: "", meeting_link: "", endereco: "" });
    setErro("");
  };

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20 w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">🗓️ Editar Compromisso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-indigo-500/20 border-2 border-indigo-400/50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">👆</span>
              <Label className="text-indigo-200 font-bold text-sm">PRIMEIRO: Selecione o tipo de compromisso</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <Label className="text-white block mb-1">Tipo de Compromisso *</Label>
                <Select value={tipoCompromisso} onValueChange={(value) => { setTipoCompromisso(value); setSubTipoFechamento(""); if (value !== "Fechamento") atualizarTitulo(value, ""); }}>
                  <SelectTrigger className="bg-white/10 border-indigo-400/50 text-white"><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
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
                  <Select value={subTipoFechamento} onValueChange={(value) => { setSubTipoFechamento(value); atualizarTitulo("Fechamento", value); }}>
                    <SelectTrigger className="bg-white/10 border-indigo-400/50 text-white"><SelectValue placeholder="Selecione a fase..." /></SelectTrigger>
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
          </div>

          <div>
            <Label className="text-white">Título *</Label>
            <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="bg-white/10 border-white/20 text-white" required readOnly />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white block mb-1">Tipo do Evento</Label>
              <Select value={formData.tipo} onValueChange={(value) => { const sc = COLORS.find(c => c.tipo === value); setFormData({ ...formData, tipo: value, cor: sc ? sc.value : formData.cor }); }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{COLORS.map(c => <SelectItem key={c.tipo} value={c.tipo}>{c.label.split(' - ')[1]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white block mb-1">Modalidade</Label>
              <Select value={formData.modalidade} onValueChange={(value) => setFormData({ ...formData, modalidade: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione uma modalidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">📍 Presencial</SelectItem>
                  <SelectItem value="online">💻 Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white">Email do Participante (opcional)</Label>
            <Input type="email" value={emailConvidado} onChange={(e) => setEmailConvidado(e.target.value)} placeholder={cliente?.email || "Digite o email do convidado"} className="bg-white/10 border-white/20 text-white" />
            {(emailConvidado || cliente?.email) && (
              <div className="mt-2 bg-green-500/20 border border-green-500/50 px-3 py-2 rounded-lg text-sm text-green-100">
                📅 Convite de calendário será enviado para: <strong>{emailConvidado || cliente.email}</strong>
                <br/><span className="text-green-300 text-xs">O cliente receberá opções de Aceitar/Recusar no email</span>
              </div>
            )}
          </div>

          {formData.modalidade === "online" && (
            <div>
              <Label className="text-white">Link da Reunião</Label>
              <Input value={formData.meeting_link || defaultMeetingLink} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." className="bg-white/10 border-white/20 text-white" />
              {defaultMeetingLink && !formData.meeting_link && <p className="text-xs text-green-300 mt-1">✅ Usando link padrão configurado</p>}
            </div>
          )}

          {formData.modalidade === "presencial" && (
            <div><Label className="text-white">Endereço (opcional)</Label><Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} placeholder="Endereço do compromisso" className="bg-white/10 border-white/20 text-white" /></div>
          )}

          <div>
            <Label className="text-white mb-2 block">Data do Compromisso *</Label>
            <Input type="date" value={formData.data_inicio ? (() => { try { const date = parseISO(formData.data_inicio); return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd"); } catch { return ""; } })() : ""}
              onChange={(e) => { if (!e.target.value) return; const [year, month, day] = e.target.value.split('-').map(Number); let cH = 12, cM = 0; if (formData.data_inicio) { try { const cs = parseISO(formData.data_inicio); if (!isNaN(cs.getTime())) { cH = cs.getHours(); cM = cs.getMinutes(); } } catch {} } const nd = new Date(year, month-1, day, cH, cM); if (isNaN(nd.getTime())) return; const ne = new Date(nd); ne.setHours(ne.getHours()+1); setFormData({ ...formData, data_inicio: nd.toISOString(), data_fim: ne.toISOString() }); }}
              className="bg-white/10 border-white/20 text-white w-full" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="text-white mb-2 block">Horário Início *</Label>
              <div className="flex gap-2">
                <Select value={formData.data_inicio ? (() => { try { const d = parseISO(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "HH"); } catch { return ""; } })() : ""}
                  onValueChange={(hour) => { const d = formData.data_inicio ? new Date(formData.data_inicio) : new Date(); if (isNaN(d.getTime())) d.setTime(Date.now()); d.setHours(parseInt(hour)); const ed = new Date(d); ed.setHours(ed.getHours()+1); setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="H" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 20 }, (_, i) => i + 4).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={formData.data_inicio ? (() => { try { const d = parseISO(formData.data_inicio); return isNaN(d.getTime()) ? "" : format(d, "mm"); } catch { return ""; } })() : ""}
                  onValueChange={(minute) => { const d = formData.data_inicio ? new Date(formData.data_inicio) : new Date(); if (isNaN(d.getTime())) d.setTime(Date.now()); d.setMinutes(parseInt(minute)); const ed = new Date(d); ed.setHours(ed.getHours()+1); setFormData({ ...formData, data_inicio: d.toISOString(), data_fim: ed.toISOString() }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="M" /></SelectTrigger>
                  <SelectContent>{['00', '15', '30', '45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-white mb-2 block">Horário Fim *</Label>
              <div className="flex gap-2">
                <Select value={formData.data_fim ? (() => { try { const d = parseISO(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "HH"); } catch { return ""; } })() : ""}
                  onValueChange={(hour) => { const d = formData.data_fim ? new Date(formData.data_fim) : new Date(); if (isNaN(d.getTime())) d.setTime(Date.now()); d.setHours(parseInt(hour)); setFormData({ ...formData, data_fim: d.toISOString() }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="H" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 20 }, (_, i) => i + 4).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={formData.data_fim ? (() => { try { const d = parseISO(formData.data_fim); return isNaN(d.getTime()) ? "" : format(d, "mm"); } catch { return ""; } })() : ""}
                  onValueChange={(minute) => { const d = formData.data_fim ? new Date(formData.data_fim) : new Date(); if (isNaN(d.getTime())) d.setTime(Date.now()); d.setMinutes(parseInt(minute)); setFormData({ ...formData, data_fim: d.toISOString() }); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1"><SelectValue placeholder="M" /></SelectTrigger>
                  <SelectContent>{['00', '15', '30', '45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div><Label className="text-white mb-2 block">Cor do Compromisso</Label>
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((color) => (
                <button key={color.value} type="button" className={`flex items-center gap-3 p-3 rounded-lg border-2 hover:scale-105 transition-transform ${formData.cor === color.value ? "border-white bg-white/10" : "border-white/20 bg-white/5"}`}
                  onClick={() => setFormData({ ...formData, cor: color.value, tipo: color.tipo })}>
                  <div className="w-6 h-6 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: color.value }} />
                  <span className="text-xs text-left text-white font-medium">{color.label.split(' - ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div><Label className="text-white">Descrição</Label><Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={3} className="bg-white/10 border-white/20 text-white" /></div>

          {erro && <div className="bg-red-500/20 border border-red-500/50 px-3 py-2 rounded-lg text-sm text-red-100">{erro}</div>}

          <div className="text-xs text-blue-300 flex items-center gap-1 bg-blue-500/10 p-2 rounded-lg">
            📅 Se informar email, o compromisso será criado no Google Calendar e o participante receberá um convite nativo com opções de Aceitar/Recusar
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancelar</Button>
            <Button type="submit" disabled={validando} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              {validando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}