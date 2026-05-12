import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações realizadas", type: "int" },
  { key: "ligacoes_atendidas", label: "Ligações atendidas", type: "int" },
  { key: "agendamentos_feitos", label: "Agendamentos feitos", type: "int" },
  { key: "abs_marcadas", label: "ABs marcadas para o dia", type: "int" },
  { key: "abs_realizadas", label: "ABs realizadas", type: "int" },
  { key: "f_agendados", label: "F agendados para o dia", type: "int" },
  { key: "f_realizados", label: "F realizados", type: "int" },
  { key: "n_protocoladas", label: "N protocoladas", type: "int" },
  { key: "recs", label: "RECS", type: "int" },
  { key: "pa", label: "PA (Prêmio Anual)", type: "float" },
  { key: "cs", label: "CS (Capital Segurado)", type: "float" },
];

const DIAS_SEMANA_MAP = {
  0: "Segunda feira", // getDay Sunday=0, but we use ISO
  1: "Segunda feira",
  2: "Terça feira",
  3: "Quarta feira",
  4: "Quinta feira",
  5: "Sexta Feira",
  6: "Sexta Feira",
};

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getDiaSemana(date) {
  const day = date.getDay();
  return DIAS_SEMANA_MAP[day] || "Segunda feira";
}

export default function DashboardInputForm({ open, onClose, existingRecord }) {
  const [selectedDate, setSelectedDate] = useState(
    existingRecord ? new Date(existingRecord.data + "T12:00:00") : new Date()
  );
  const [values, setValues] = useState(() => {
    const initial = {};
    METRICS.forEach(m => {
      const val = existingRecord ? (existingRecord[m.key] || 0) : 0;
      let strVal = val === 0 ? "" : String(val);
      if (m.type === "float" && strVal) strVal = strVal.replace(".", ",");
      initial[m.key] = strVal;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    const diaSemana = getDiaSemana(selectedDate);
    const semana = getWeekNumber(selectedDate);
    const ano = selectedDate.getFullYear();
    const dataStr = format(selectedDate, "yyyy-MM-dd");

    const numericValues = {};
    METRICS.forEach(m => {
      const v = values[m.key];
      numericValues[m.key] = v === "" ? 0 : parseFloat(String(v).replace(",", ".")) || 0;
    });

    const payload = {
      data: dataStr,
      dia_semana: diaSemana,
      semana,
      ano,
      ...numericValues,
    };

    if (existingRecord) {
      await base44.entities.DashboardDiario.update(existingRecord.id, payload);
      toast.success("Registro atualizado!");
    } else {
      await base44.entities.DashboardDiario.create(payload);
      toast.success("Registro criado!");
    }
    queryClient.invalidateQueries({ queryKey: ["dashboard-diario"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-indigo-700">
            {existingRecord ? "Editar Registro" : "Novo Registro Diário"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-slate-500 mt-1">
              Semana {getWeekNumber(selectedDate)} • {getDiaSemana(selectedDate)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {METRICS.map(m => (
              <div key={m.key}>
                <Label className="text-sm text-slate-600">{m.label}</Label>
                <Input
                  type="text"
                  inputMode={m.type === "float" ? "decimal" : "numeric"}
                  value={values[m.key]}
                  onChange={e => {
                    let raw = e.target.value;
                    // Allow digits, dot and comma for floats
                    if (m.type === "float") {
                      // Replace comma with dot for internal handling
                      raw = raw.replace(",", ".");
                      raw = raw.replace(/[^0-9.]/g, "");
                      // Only one dot allowed
                      const parts = raw.split(".");
                      if (parts.length > 2) raw = parts[0] + "." + parts.slice(1).join("");
                      // Display with comma for Brazilian users
                      raw = raw.replace(".", ",");
                    } else {
                      raw = raw.replace(/[^0-9]/g, "");
                    }
                    // Remove leading zeros (but keep "0," for floats)
                    if (raw.length > 1 && raw[0] === "0" && raw[1] !== ",") {
                      raw = raw.replace(/^0+/, "");
                    }
                    setValues(prev => ({ ...prev, [m.key]: raw }));
                  }}
                  onFocus={e => { if (e.target.value === "0") setValues(prev => ({ ...prev, [m.key]: "" })); }}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {existingRecord ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}