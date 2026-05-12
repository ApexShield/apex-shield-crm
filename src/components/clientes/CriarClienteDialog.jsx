import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, AlertTriangle, Loader2 } from "lucide-react";

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
};

const formatCPF = (value) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/-$/, "");
};

const STATUS_OPTIONS = [
  "AB Fechamento", "Análise", "Venda Feita", "Entrega de Apólice"
];

export default function CriarClienteDialog({ open, onClose, onCreate, isLoading }) {
  const [form, setForm] = useState({
    nome: "", cpf: "", email: "", telefone: "",
    profissao: "", estado_civil: "", data_nascimento: "",
    filhos: "", status: "AB Fechamento"
  });
  const [erros, setErros] = useState([]);

  const handleCreate = () => {
    const missing = [];
    if (!form.nome.trim()) missing.push("Nome Completo");
    if (!form.cpf.trim() || form.cpf.replace(/\D/g, "").length < 11) missing.push("CPF (completo)");
    if (!form.email.trim()) missing.push("Email");
    if (!form.telefone.trim()) missing.push("Telefone");
    if (missing.length > 0) { setErros(missing); return; }
    setErros([]);
    onCreate({
      ...form,
      is_cliente: true,
      data_conversao_cliente: new Date().toISOString(),
      data_cadastro: new Date().toISOString().split("T")[0]
    });
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/20 max-w-lg compact-form">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Criar Novo Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-white text-xs">Nome Completo *</Label>
              <Input value={form.nome} onChange={(e) => update("nome", e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div>
              <Label className="text-white text-xs">CPF *</Label>
              <Input value={form.cpf} onChange={(e) => update("cpf", formatCPF(e.target.value))}
                maxLength={14} placeholder="000.000.000-00" className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div>
              <Label className="text-white text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div>
              <Label className="text-white text-xs">Telefone *</Label>
              <Input value={form.telefone} onChange={(e) => update("telefone", formatPhone(e.target.value))}
                maxLength={15} className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div>
              <Label className="text-white text-xs">Profissão</Label>
              <Input value={form.profissao} onChange={(e) => update("profissao", e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div>
              <Label className="text-white text-xs">Data de Nascimento</Label>
              <Input type="date" value={form.data_nascimento} onChange={(e) => update("data_nascimento", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div>
              <Label className="text-white text-xs">Estado Civil</Label>
              <Select value={form.estado_civil} onValueChange={(v) => update("estado_civil", v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  <SelectItem value="União Estável">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white text-xs">Filhos</Label>
              <Input type="number" min="0" value={form.filhos} onChange={(e) => update("filhos", e.target.value)}
                className="bg-white/10 border-white/20 text-white h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-white text-xs">Status Inicial</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {erros.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-200">
                <p className="font-bold mb-1">Campos obrigatórios faltando:</p>
                {erros.map(e => <p key={e}>• {e}</p>)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
            Criar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}