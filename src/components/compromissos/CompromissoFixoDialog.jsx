import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat, Loader2 } from "lucide-react";

const DIAS_SEMANA = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" }
];

const TIPOS = [
  { value: "pessoal", label: "🧡 Pessoal", cor: "#f97316" },
  { value: "avanti", label: "🏢 Agência", cor: "#ec4899" },
  { value: "agendado", label: "💼 Trabalho", cor: "#0891b2" }
];

export default function CompromissoFixoDialog({ open, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "pessoal",
    cor: "#f97316",
    dias: [],
    hora_inicio: "09:00",
    hora_fim: "10:00",
    data_inicio: "",
    data_fim: ""
  });

  const toggleDia = (dia) => {
    setForm(prev => ({
      ...prev,
      dias: prev.dias.includes(dia) ? prev.dias.filter(d => d !== dia) : [...prev.dias, dia]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo || form.dias.length === 0 || !form.data_inicio || !form.data_fim) {
      alert("Preencha todos os campos obrigatórios: título, dias, data início e data fim.");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Repeat className="w-5 h-5 text-orange-400" /> Compromisso Fixo Semanal
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white">Título *</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Academia, Reunião de equipe..." className="bg-white/10 border-white/20 text-white" required />
          </div>

          <div>
            <Label className="text-white">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => {
              const t = TIPOS.find(x => x.value === v);
              setForm({ ...form, tipo: v, cor: t?.cor || form.cor });
            }}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white mb-2 block">Dias da Semana *</Label>
            <div className="grid grid-cols-4 gap-2">
              {DIAS_SEMANA.map(d => (
                <button key={d.value} type="button"
                  className={`p-2 rounded-lg text-sm font-medium transition-all border-2 ${
                    form.dias.includes(d.value) 
                      ? "bg-indigo-500/30 border-indigo-400 text-white" 
                      : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                  }`}
                  onClick={() => toggleDia(d.value)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Hora Início *</Label>
              <Input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                className="bg-white/10 border-white/20 text-white" required />
            </div>
            <div>
              <Label className="text-white">Hora Fim *</Label>
              <Input type="time" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
                className="bg-white/10 border-white/20 text-white" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Data Início *</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                className="bg-white/10 border-white/20 text-white" required />
            </div>
            <div>
              <Label className="text-white">Data Fim *</Label>
              <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                className="bg-white/10 border-white/20 text-white" required />
            </div>
          </div>

          <div>
            <Label className="text-white">Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={2} className="bg-white/10 border-white/20 text-white" placeholder="Observações opcionais..." />
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-200">
            🔁 Este compromisso será criado automaticamente nos dias selecionados, entre as datas de início e fim.
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : "Criar Compromissos Fixos"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}