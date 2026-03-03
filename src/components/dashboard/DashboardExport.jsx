import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

const DIAS = ["Segunda feira", "Terça feira", "Quarta feira", "Quinta feira", "Sexta Feira"];
const METRICS = [
  { key: "ligacoes_realizadas", label: "Ligações realizadas" },
  { key: "ligacoes_atendidas", label: "Ligações atendidas" },
  { key: "agendamentos_feitos", label: "Agendamentos feitos" },
  { key: "abs_marcadas", label: "ABs que estavam marcadas para o dia" },
  { key: "abs_realizadas", label: "ABs que foram realizadas" },
  { key: "f_agendados", label: "F agendados para o dia" },
  { key: "f_realizados", label: "F realizados" },
  { key: "n_protocoladas", label: "N protocoladas" },
  { key: "recs", label: "RECS" },
  { key: "pa", label: "PA" },
  { key: "cs", label: "CS" },
];

export default function DashboardExport({ data, ano }) {
  const handleExport = () => {
    const maxWeek = data.reduce((max, d) => Math.max(max, d.semana || 0), 0);
    const weekCols = Array.from({ length: Math.max(maxWeek, 52) }, (_, i) => `Semana ${i + 1}`);
    const rows = [];

    // For each day, generate metrics rows
    DIAS.forEach(dia => {
      // Header row for the day
      const headerRow = [dia, ...weekCols, "TOTAL", "MÉDIA DO DIA"];
      rows.push(headerRow);

      const dayData = data.filter(d => d.dia_semana === dia);

      METRICS.forEach(m => {
        const row = [m.label];
        let total = 0;
        let count = 0;
        weekCols.forEach((_, wIdx) => {
          const weekNum = wIdx + 1;
          const weekRecords = dayData.filter(d => d.semana === weekNum);
          const sum = weekRecords.reduce((s, r) => s + (r[m.key] || 0), 0);
          row.push(sum);
          total += sum;
          if (weekRecords.length > 0) count++;
        });
        row.push(total);
        row.push(count > 0 ? Math.round(total / count * 100) / 100 : 0);
        rows.push(row);
      });

      rows.push([]); // Empty row separator
    });

    // Summary section - FUNIL SEMANAL (DETALHADO)
    rows.push([]);
    rows.push(["FUNIL SEMANAL (DETALHADO)", ...weekCols, "TOTAL", "MÉDIA DO DIA"]);
    METRICS.forEach(m => {
      const row = [m.label];
      let total = 0;
      let count = 0;
      weekCols.forEach((_, wIdx) => {
        const weekNum = wIdx + 1;
        const weekRecords = data.filter(d => d.semana === weekNum);
        const sum = weekRecords.reduce((s, r) => s + (r[m.key] || 0), 0);
        row.push(sum);
        total += sum;
        if (weekRecords.length > 0) count++;
      });
      row.push(total);
      row.push(count > 0 ? Math.round(total / count * 100) / 100 : 0);
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(ano));
    XLSX.writeFile(wb, `dashboard_${ano}.xlsx`);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="w-4 h-4" />
      Exportar Excel
    </Button>
  );
}