import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Save, Loader2, Trash2, CalendarIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações Realizadas" },
  { key: "agendamentos_feitos", label: "Agendamentos Feitos" },
  { key: "abs_realizadas", label: "ABs Realizadas" },
  { key: "f_realizados", label: "F Realizados" },
  { key: "n_protocoladas", label: "Propostas Realizadas" },
  { key: "recs", label: "REC Realizadas" },
  { key: "pa", label: "PA Realizado" },
  { key: "cs", label: "CS Realizado" },
];

const MESES_LABEL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function parseExistingPeriodo(periodo) {
  if (!periodo) return null;
  const parts = periodo.split("-");
  if (parts.length === 2) {
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    if (!isNaN(y) && !isNaN(m)) return new Date(y, m, 1);
  }
  return null;
}

export default function MetaForm({ open, onClose, existingMeta }) {
  const [selectedMonth, setSelectedMonth] = useState(() => parseExistingPeriodo(existingMeta?.periodo));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [values, setValues] = useState(() => {
    const initial = {};
    METRICS.forEach(m => {
      const val = existingMeta?.[m.key] || 0;
      initial[m.key] = val === 0 ? "" : String(val);
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const periodoStr = selectedMonth
    ? `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`
    : "";
  const periodoLabel = selectedMonth
    ? `${MESES_LABEL[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`
    : "";

  const handleSave = async () => {
    if (!selectedMonth) { toast.error("Selecione o mês da meta"); return; }
    setSaving(true);
    const numericValues = {};
    METRICS.forEach(m => {
      const v = values[m.key];
      numericValues[m.key] = v === "" ? 0 : parseFloat(v) || 0;
    });
    const payload = { periodo: periodoStr, periodo_label: periodoLabel, ...numericValues };
    if (existingMeta) {
      await base44.entities.Meta.update(existingMeta.id, payload);
      toast.success("Meta atualizada!");
    } else {
      await base44.entities.Meta.create(payload);
      toast.success("Meta criada!");
    }
    queryClient.invalidateQueries({ queryKey: ["metas-equipe"] });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!existingMeta || !confirm("Excluir esta meta?")) return;
    await base44.entities.Meta.delete(existingMeta.id);
    queryClient.invalidateQueries({ queryKey: ["metas-equipe"] });
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
            <Label className="text-sm font-semibold text-slate-700">Mês da Meta</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  {periodoLabel || "Selecione o mês..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(d) => {
                    if (d) {
                      setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                      setCalendarOpen(false);
                    }
                  }}
                  locale={ptBR}
                  defaultMonth={selectedMonth || new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {METRICS.map(m => (
              <div key={m.key} className="flex items-center gap-3">
                <Label className="text-sm text-slate-600 w-44 flex-shrink-0">{m.label}</Label>
                <Input
                  type="number"
                  step={m.key === "pa" || m.key === "cs" ? "0.01" : "1"}
                  min="0"
                  value={values[m.key]}
                  onChange={e => setValues(prev => ({ ...prev, [m.key]: e.target.value }))}
                  onFocus={e => { if (e.target.value === "0") setValues(prev => ({ ...prev, [m.key]: "" })); }}
                  placeholder="0"
                  className="flex-1"
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