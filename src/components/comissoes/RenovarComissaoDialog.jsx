import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";

export default function RenovarComissaoDialog({ open, onClose, comissao, onRenewed }) {
  const [novoValor, setNovoValor] = useState("");
  const [saving, setSaving] = useState(false);

  if (!comissao) return null;

  const handleRenovar = async () => {
    if (!novoValor) {
      toast.error("Informe o novo valor da comissão");
      return;
    }
    setSaving(true);
    const novaDataAdesao = comissao.data_expiracao;
    const novaDataExp = format(addMonths(new Date(novaDataAdesao + "T12:00:00"), 12), "yyyy-MM-dd");
    const historico = comissao.historico_renovacoes || [];
    historico.push({
      data_renovacao: new Date().toISOString(),
      valor_anterior: comissao.valor_comissao,
      valor_novo: parseFloat(novoValor)
    });
    await base44.entities.ComissaoCliente.update(comissao.id, {
      valor_comissao: parseFloat(novoValor),
      data_adesao: novaDataAdesao,
      data_expiracao: novaDataExp,
      status: "ativa",
      notificacao_enviada: false,
      historico_renovacoes: historico
    });
    toast.success(`Comissão de ${comissao.cliente_nome} renovada!`);
    setSaving(false);
    setNovoValor("");
    onRenewed();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md bg-slate-900 border-white/20 text-white compact-form">
        <DialogHeader>
          <DialogTitle className="text-white font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            Renovar Comissão
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-sm font-bold text-white">{comissao.cliente_nome}</p>
            <p className="text-xs text-white/50">{comissao.produto} • Valor atual: R$ {comissao.valor_comissao?.toFixed(2)}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-amber-300 text-xs">O período de 12 meses expirou. Informe o novo valor da comissão que a seguradora pagará pelos próximos 12 meses.</p>
          </div>
          <div>
            <Label className="text-white/70 text-xs">Novo Valor Mensal (R$)</Label>
            <Input type="number" step="0.01" value={novoValor} onChange={e => setNovoValor(e.target.value)}
              placeholder="Ex: 80.00"
              className="bg-white/10 border-white/20 text-white text-sm" />
          </div>
          <Button onClick={handleRenovar} disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 font-bold">
            {saving ? "Renovando..." : "Renovar Comissão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}