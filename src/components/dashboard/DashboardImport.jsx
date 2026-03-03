import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Loader2, AlertTriangle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const DIAS = ["Segunda feira", "Terça feira", "Quarta feira", "Quinta feira", "Sexta Feira"];
const METRIC_KEYS = [
  "ligacoes_realizadas", "ligacoes_atendidas", "agendamentos_feitos",
  "abs_marcadas", "abs_realizadas", "f_agendados", "f_realizados",
  "n_protocoladas", "recs", "pa", "cs"
];

const DIAS_SEMANA_MAP = { 1: "Segunda feira", 2: "Terça feira", 3: "Quarta feira", 4: "Quinta feira", 5: "Sexta Feira" };

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getDateForWeekDay(ano, semana, diaDaSemana) {
  // diaDaSemana: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const jan4 = new Date(ano, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - dayOfWeek + 1);
  const target = new Date(mondayWeek1);
  target.setDate(mondayWeek1.getDate() + (semana - 1) * 7 + (diaDaSemana - 1));
  return target;
}

function parseSheelData(sheetData, ano) {
  const records = [];
  const diaIndices = { "Segunda feira": 1, "Terça feira": 2, "Quarta feira": 3, "Quinta feira": 4, "Sexta Feira": 5 };

  // Parse the sheet: it has blocks for each day
  // Each block starts with the day name as header, then 11 metric rows
  let currentDia = null;
  let metricIdx = 0;
  const dayMetrics = {};

  for (let r = 0; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (!row || row.length === 0) { currentDia = null; metricIdx = 0; continue; }

    const firstCell = String(row[0] || "").trim();

    if (DIAS.includes(firstCell) && String(row[1] || "").includes("Semana")) {
      currentDia = firstCell;
      metricIdx = 0;
      if (!dayMetrics[currentDia]) dayMetrics[currentDia] = {};
      continue;
    }

    if (currentDia && metricIdx < 11) {
      const metricKey = METRIC_KEYS[metricIdx];
      dayMetrics[currentDia][metricKey] = {};
      for (let c = 1; c <= 52; c++) {
        const val = parseFloat(row[c]) || 0;
        dayMetrics[currentDia][metricKey][c] = val;
      }
      metricIdx++;
    }

    // Stop after the 5th day block's metrics (before INDICADOR section)
    if (firstCell === "INDICADOR DE ATIVIDADES" || firstCell === "FUNIL SEMANAL (DETALHADO)") break;
  }

  // Build records from parsed data
  for (const dia of DIAS) {
    if (!dayMetrics[dia]) continue;
    const diaIdx = diaIndices[dia];

    for (let semana = 1; semana <= 52; semana++) {
      // Check if any metric has a value for this week
      let hasData = false;
      const record = {
        data: "",
        dia_semana: dia,
        semana: semana,
        ano: ano,
      };

      for (const key of METRIC_KEYS) {
        const val = dayMetrics[dia]?.[key]?.[semana] || 0;
        record[key] = val;
        if (val !== 0) hasData = true;
      }

      // Also include weeks where all values are 0 but the week has data in other days
      // Calculate the date
      const dateObj = getDateForWeekDay(ano, semana, diaIdx);
      if (dateObj.getFullYear() !== ano) continue;
      
      record.data = dateObj.toISOString().split("T")[0];

      // Only include if we have any data OR if this week has data in any other day
      const weekHasData = DIAS.some(d => 
        dayMetrics[d] && METRIC_KEYS.some(k => (dayMetrics[d]?.[k]?.[semana] || 0) !== 0)
      );

      if (weekHasData) {
        records.push(record);
      }
    }
  }

  return records;
}

export default function DashboardImport({ data, ano }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [parsedRecords, setParsedRecords] = useState([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "array" });
      // Try to find the sheet for the current year
      const sheetName = wb.SheetNames.find(s => s === String(ano)) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const records = parseSheelData(sheetData, parseInt(sheetName) || ano);
      setParsedRecords(records);
      setShowConfirm(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleExportBackup = () => {
    // Export current data as backup using same format
    exportCurrentData();
    doImport();
  };

  const exportCurrentData = () => {
    const maxWeek = data.reduce((max, d) => Math.max(max, d.semana || 0), 0);
    const weekCols = Array.from({ length: 52 }, (_, i) => `Semana ${i + 1}`);
    const rows = [];

    DIAS.forEach(dia => {
      rows.push([dia, ...weekCols, "TOTAL", "MÉDIA DO DIA"]);
      const dayData = data.filter(d => d.dia_semana === dia);
      METRIC_KEYS.forEach(key => {
        const label = { ligacoes_realizadas: "Ligações realizadas", ligacoes_atendidas: "Ligações atendidas", agendamentos_feitos: "Agendamentos feitos", abs_marcadas: "ABs que estavam marcadas para o dia", abs_realizadas: "ABs que foram realizadas", f_agendados: "F agendados para o dia", f_realizados: "F realizados", n_protocoladas: "N protocoladas", recs: "RECS", pa: "PA", cs: "CS" }[key];
        const row = [label];
        let total = 0;
        weekCols.forEach((_, wIdx) => {
          const weekNum = wIdx + 1;
          const sum = dayData.filter(d => d.semana === weekNum).reduce((s, r) => s + (r[key] || 0), 0);
          row.push(sum);
          total += sum;
        });
        row.push(total);
        row.push(0);
        rows.push(row);
      });
      rows.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(ano));
    XLSX.writeFile(wb, `backup_dashboard_${ano}_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Backup exportado com sucesso!");
  };

  const doImport = async () => {
    setImporting(true);
    // Delete existing records for the year
    const existing = data.filter(d => d.ano === ano);
    for (const rec of existing) {
      await base44.entities.DashboardDiario.delete(rec.id);
    }

    // Insert new records in batches
    const batchSize = 20;
    for (let i = 0; i < parsedRecords.length; i += batchSize) {
      const batch = parsedRecords.slice(i, i + batchSize);
      await base44.entities.DashboardDiario.bulkCreate(batch);
    }

    queryClient.invalidateQueries({ queryKey: ["dashboard-diario"] });
    toast.success(`${parsedRecords.length} registros importados com sucesso!`);
    setImporting(false);
    setShowConfirm(false);
    setParsedRecords([]);
  };

  return (
    <>
      <input type="file" ref={fileRef} accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileRef.current?.click()} variant="outline" className="gap-2">
        <Upload className="w-4 h-4" />
        Importar
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-slate-200 shadow-2xl">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Importar Dados</h2>
                <p className="text-indigo-200 text-sm">{fileName}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Info de registros */}
            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-indigo-600">{parsedRecords.length}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Registros encontrados</p>
                <p className="text-xs text-slate-500">Prontos para importação no ano {ano}</p>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Atenção: dados serão substituídos</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Todos os dados existentes do ano {ano} serão sobrescritos. Recomendamos fazer um backup antes de continuar.
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportBackup} 
                  disabled={importing} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 rounded-xl font-semibold"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Backup + Importar
                </Button>
                <Button 
                  onClick={doImport} 
                  disabled={importing} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 rounded-xl font-semibold"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Apenas Importar
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirm(false)} 
                disabled={importing}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl h-10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}