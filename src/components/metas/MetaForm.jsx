import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações realizadas" },
  { key: "ligacoes_atendidas", label: "Ligações atendidas" },
  { key: "agendamentos_feitos", label: "Agendamentos feitos" },
  { key: "abs_marcadas", label: "ABs marcadas" },
  { key: "abs_realizadas", label: "ABs realizadas" },
  { key: "f_agendados", label: "F agendados" },
  { key: "f_realizados", label: "F realizados" },
  { key: "n_protocoladas", label: "N protocoladas" },
  { key: "recs", label: "RECS" },
  { key: "pa", label: "PA (Prêmio Anual)" },
  { key: "cs", label: "CS (Capital Segurado)" },
];

export default function MetaForm({ open, onClose, existingMeta }) {
  const [periodo, setPeriodo] = useState(existingMeta?.periodo || "");
  const [values, setValues] = useState(() => {
    const initial = {};
    METRICS.forEach(m => { initial[m.key] = existingMeta?.[m.key] || 0; });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!periodo.trim()) { toast.error("Informe o período da meta"); return; }
    setSaving(true);
    const payload = { periodo: periodo.trim(), ...values };
    if (existingMeta) {
      await base44.entities.Meta.update(existingMeta.id, payload);
      toast.success("Meta atualizada!");
    } else {
      await base44.entities.Meta.create(payload);
      toast.success("Meta criada!");
    }
    queryClient.invalidateQueries({ queryKey: ["metas"] });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!existingMeta || !confirm("Excluir esta meta?")) return;
    await base44.entities.Meta.delete(existingMeta.id);
    queryClient.invalidateQueries({ queryKey: ["metas"] });
    toast.success("Meta excluída");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-emerald-700">
            {existingMeta ? "Editar Meta" : "Definir Nova Meta"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Período / Nome da Meta</Label>
            <Input
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              placeholder="Ex: Janeiro 2025, Semana 12, Anual 2025..."
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {METRICS.map(m => (
              <div key={m.key}>
                <Label className="text-sm text-slate-600">{m.label}</Label>
                <Input
                  type="number"
                  step={m.key === "pa" || m.key === "cs" ? "0.01" : "1"}
                  min="0"
                  value={values[m.key]}
                  onChange={e => setValues(prev => ({ ...prev, [m.key]: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {existingMeta && (
              <Button onClick={handleDelete} variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {existingMeta ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}