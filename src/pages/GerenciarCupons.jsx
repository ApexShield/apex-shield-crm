import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Ticket, Plus, Loader2, Percent, Copy, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciarCupons() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: cupons = [], isLoading } = useQuery({
    queryKey: ["cupons"],
    queryFn: () => base44.entities.CupomDesconto.list("-created_date", 100),
  });

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Gerenciar Cupons</h1>
            <p className="text-sm text-slate-500">Crie e gerencie cupons de desconto para assinaturas</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 gap-2">
          <Plus className="w-4 h-4" />
          Novo Cupom
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: cupons.length, color: "from-violet-500 to-purple-600" },
          { label: "Ativos", value: cupons.filter(c => c.ativo).length, color: "from-emerald-500 to-green-600" },
          { label: "Usos Totais", value: cupons.reduce((s, c) => s + (c.usos_realizados || 0), 0), color: "from-blue-500 to-indigo-600" },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
            <p className="text-white/70 text-xs font-medium">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cupons List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : cupons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum cupom criado</p>
          <p className="text-sm text-slate-400">Crie seu primeiro cupom de desconto!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cupons.map(cupom => (
            <CupomCard key={cupom.id} cupom={cupom} />
          ))}
        </div>
      )}

      {showForm && <CupomFormDialog open={showForm} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function CupomCard({ cupom }) {
  const [toggling, setToggling] = useState(false);
  const queryClient = useQueryClient();

  const descontoColors = {
    10: "bg-blue-100 text-blue-700",
    20: "bg-violet-100 text-violet-700",
    30: "bg-orange-100 text-orange-700",
  };

  const handleToggle = async () => {
    setToggling(true);
    const newStatus = !cupom.ativo;
    await base44.functions.invoke("gerenciarCupom", {
      action: newStatus ? "activate" : "deactivate",
      cupom_id: cupom.id,
    });
    await base44.entities.CupomDesconto.update(cupom.id, { ativo: newStatus });
    queryClient.invalidateQueries({ queryKey: ["cupons"] });
    toast.success(newStatus ? "Cupom ativado!" : "Cupom desativado!");
    setToggling(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cupom.codigo);
    toast.success("Código copiado!");
  };

  const handleDelete = async () => {
    if (!cupom.ativo) {
      await base44.entities.CupomDesconto.delete(cupom.id);
      queryClient.invalidateQueries({ queryKey: ["cupons"] });
      toast.success("Cupom excluído!");
    }
  };

  const duracaoLabel = {
    once: "1º mês apenas",
    repeating: `${cupom.duracao_meses || 0} meses`,
    forever: "Para sempre",
  };

  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 font-mono text-lg">{cupom.codigo}</span>
              <Badge className={descontoColors[cupom.desconto_percentual] || "bg-slate-100 text-slate-700"}>
                {cupom.desconto_percentual}% OFF
              </Badge>
              <Badge className={cupom.ativo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                {cupom.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              <span>Duração: {duracaoLabel[cupom.duracao] || "1º mês"}</span>
              {cupom.max_usos > 0 && <span>Usos: {cupom.usos_realizados || 0}/{cupom.max_usos}</span>}
              {cupom.max_usos === 0 && <span>Usos: {cupom.usos_realizados || 0} (ilimitado)</span>}
              {cupom.data_expiracao && <span>Expira: {format(new Date(cupom.data_expiracao), "dd/MM/yyyy")}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copiar código">
            <Copy className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleToggle} disabled={toggling} title={cupom.ativo ? "Desativar" : "Ativar"}>
            {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : cupom.ativo
              ? <PowerOff className="w-4 h-4 text-red-400" />
              : <Power className="w-4 h-4 text-emerald-500" />}
          </Button>
          {!cupom.ativo && (
            <Button variant="ghost" size="icon" onClick={handleDelete} title="Excluir">
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CupomFormDialog({ open, onClose }) {
  const [codigo, setCodigo] = useState("");
  const [desconto, setDesconto] = useState("10");
  const [maxUsos, setMaxUsos] = useState("");
  const [dataExpiracao, setDataExpiracao] = useState("");
  const [duracao, setDuracao] = useState("once");
  const [duracaoMeses, setDuracaoMeses] = useState("3");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!codigo.trim()) { toast.error("Informe o código do cupom"); return; }

    setSaving(true);

    // Create in Stripe
    const res = await base44.functions.invoke("gerenciarCupom", {
      action: "create",
      codigo: codigo.trim().toUpperCase(),
      desconto_percentual: parseInt(desconto),
      max_usos: maxUsos ? parseInt(maxUsos) : 0,
      data_expiracao: dataExpiracao || null,
      duracao,
      duracao_meses: duracao === "repeating" ? parseInt(duracaoMeses) : null,
    });

    if (res.data?.success) {
      // Save in database
      await base44.entities.CupomDesconto.create({
        codigo: codigo.trim().toUpperCase(),
        desconto_percentual: parseInt(desconto),
        stripe_coupon_id: res.data.stripe_coupon_id,
        stripe_promotion_code_id: res.data.stripe_promotion_code_id,
        max_usos: maxUsos ? parseInt(maxUsos) : 0,
        usos_realizados: 0,
        ativo: true,
        data_expiracao: dataExpiracao || null,
        duracao,
        duracao_meses: duracao === "repeating" ? parseInt(duracaoMeses) : null,
      });

      queryClient.invalidateQueries({ queryKey: ["cupons"] });
      toast.success("Cupom criado com sucesso!");
      onClose();
    } else {
      toast.error("Erro ao criar cupom: " + (res.data?.error || "desconhecido"));
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-slate-200">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Novo Cupom de Desconto
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-slate-700 font-semibold">Código do Cupom *</Label>
            <Input
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="Ex: APEX10"
              className="mt-1 font-mono uppercase"
              maxLength={20}
            />
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Desconto *</Label>
            <Select value={desconto} onValueChange={setDesconto}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10% de desconto</SelectItem>
                <SelectItem value="20">20% de desconto</SelectItem>
                <SelectItem value="30">30% de desconto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Duração do Desconto</Label>
            <Select value={duracao} onValueChange={setDuracao}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Apenas no 1º mês</SelectItem>
                <SelectItem value="repeating">Por X meses</SelectItem>
                <SelectItem value="forever">Para sempre</SelectItem>
              </SelectContent>
            </Select>
            {duracao === "repeating" && (
              <Input
                type="number"
                value={duracaoMeses}
                onChange={e => setDuracaoMeses(e.target.value)}
                placeholder="Quantidade de meses"
                className="mt-2"
                min="1"
                max="36"
              />
            )}
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Máximo de Usos</Label>
            <Input
              type="number"
              value={maxUsos}
              onChange={e => setMaxUsos(e.target.value)}
              placeholder="Deixe vazio para ilimitado"
              className="mt-1"
              min="0"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Data de Expiração</Label>
            <Input
              type="date"
              value={dataExpiracao}
              onChange={e => setDataExpiracao(e.target.value)}
              className="mt-1"
            />
            <p className="text-[11px] text-slate-400 mt-1">Deixe vazio para não expirar</p>
          </div>

          {/* Preview */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-violet-700 mb-1">Prévia do cupom:</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-violet-800">{codigo || "CODIGO"}</span>
              <Badge className="bg-violet-100 text-violet-700">{desconto}% OFF</Badge>
              <span className="text-xs text-violet-600">
                {duracao === "once" ? "1º mês" : duracao === "repeating" ? `${duracaoMeses} meses` : "Sempre"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !codigo.trim()} className="flex-1 bg-violet-600 hover:bg-violet-700 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
              {saving ? "Criando..." : "Criar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}