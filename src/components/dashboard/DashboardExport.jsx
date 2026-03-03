import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

const DIAS = ["Segunda feira", "Terça feira", "Quarta feira", "Quinta feira", "Sexta Feira"];
const METRIC_LABELS = [
  "Ligações realizadas", "Ligações atendidas", "Agendamentos feitos",
  "ABs que estavam marcadas para o dia", "ABs que foram realizadas",
  "F agendados para o dia", "F realizados", "N protocoladas", "RECS", "PA", "CS"
];
const METRIC_KEYS = [
  "ligacoes_realizadas", "ligacoes_atendidas", "agendamentos_feitos",
  "abs_marcadas", "abs_realizadas", "f_agendados", "f_realizados",
  "n_protocoladas", "recs", "pa", "cs"
];

function colLetter(idx) {
  let s = "";
  idx++;
  while (idx > 0) { idx--; s = String.fromCharCode(65 + (idx % 26)) + s; idx = Math.floor(idx / 26); }
  return s;
}

export default function DashboardExport({ data, ano }) {
  const handleExport = () => {
    const rows = [];
    const weekCols = Array.from({ length: 52 }, (_, i) => `Semana ${i + 1}`);
    const numCols = weekCols.length;

    // --- Per-day blocks ---
    DIAS.forEach((dia) => {
      const headerRow = [dia, ...weekCols, "TOTAL", "MÉDIA DO DIA"];
      rows.push(headerRow);

      const dayData = data.filter(d => d.dia_semana === dia);

      METRIC_KEYS.forEach((key, mIdx) => {
        const r = rows.length + 1; // 1-based row for formulas
        const row = [METRIC_LABELS[mIdx]];
        for (let w = 1; w <= 52; w++) {
          const sum = dayData.filter(d => d.semana === w).reduce((s, d) => s + (d[key] || 0), 0);
          row.push(sum || 0);
        }
        // TOTAL formula: SUM of columns B to BA (cols 1 to 52)
        const totalCol = colLetter(numCols + 1); // column after last week
        const avgCol = colLetter(numCols + 2);
        row.push({ f: `SUM(B${r}:${colLetter(numCols)}${r})` });
        row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,"#DIV/0!",${totalCol}${r}/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
        rows.push(row);
      });

      rows.push([]); // separator
    });

    // --- Empty rows ---
    rows.push([]);
    rows.push([]);

    // --- INDICADOR DE ATIVIDADES ---
    rows.push([" ", 1]);
    rows.push(["INDICADOR DE ATIVIDADES", ...weekCols, "MÉDIAS"]);

    const indicadorLabels = ["Abs Realizadas", "RECS", "Propostas", "Soma dos prêmios", "PA", "Capital Segurado Total"];
    const indicadorKeys = [
      (d) => d.abs_realizadas || 0,
      (d) => d.recs || 0,
      (d) => d.n_protocoladas || 0,
      null, // soma premios = PA/12
      (d) => d.pa || 0,
      (d) => d.cs || 0,
    ];

    indicadorLabels.forEach((label, idx) => {
      const row = [label];
      for (let w = 1; w <= 52; w++) {
        const weekData = data.filter(d => d.semana === w);
        let val = 0;
        if (idx === 3) { // soma premios = PA / 12
          val = weekData.reduce((s, d) => s + (d.pa || 0), 0) / 12;
          val = Math.round(val * 100) / 100;
        } else {
          val = weekData.reduce((s, d) => s + (indicadorKeys[idx]?.(d) || 0), 0);
        }
        row.push(val);
      }
      const r = rows.length + 1;
      row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,"#DIV/0!",SUM(B${r}:${colLetter(numCols)}${r})/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
      rows.push(row);
    });

    // --- More empty rows + FUNIL SEMANAL (DETALHADO) ---
    for (let i = 0; i < 5; i++) rows.push([]);

    rows.push(["FUNIL SEMANAL (DETALHADO)", ...weekCols, "TOTAL", "MÉDIA DO DIA"]);
    METRIC_KEYS.forEach((key, mIdx) => {
      const r = rows.length + 1;
      const row = [METRIC_LABELS[mIdx]];
      for (let w = 1; w <= 52; w++) {
        const sum = data.filter(d => d.semana === w).reduce((s, d) => s + (d[key] || 0), 0);
        row.push(sum);
      }
      const totalCol = colLetter(numCols + 1);
      row.push({ f: `SUM(B${r}:${colLetter(numCols)}${r})` });
      row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,0,${totalCol}${r}/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
      rows.push(row);
    });

    // --- FUNIL SEMANAL (GERAL EQUIPE) ---
    rows.push([]);
    const funilGeralStart = rows.length + 1;
    rows.push(["FUNIL SEMANAL (GERAL EQUIPE)", "TOTAL", "MÉDIA", "CONVERSÃO"]);

    const totals = {};
    METRIC_KEYS.forEach(key => { totals[key] = data.reduce((s, d) => s + (d[key] || 0), 0); });
    const weeksWithData = [...new Set(data.map(d => d.semana))].length;

    const conversions = [
      { key: "ligacoes_realizadas", conv: "-" },
      { key: "ligacoes_atendidas", conv: totals.ligacoes_realizadas > 0 ? (totals.ligacoes_atendidas / totals.ligacoes_realizadas) : 0 },
      { key: "agendamentos_feitos", conv: totals.ligacoes_atendidas > 0 ? (totals.agendamentos_feitos / totals.ligacoes_atendidas) : 0 },
      { key: "abs_marcadas", conv: "-" },
      { key: "abs_realizadas", conv: totals.abs_marcadas > 0 ? (totals.abs_realizadas / totals.abs_marcadas) : 0 },
      { key: "f_agendados", conv: "-" },
      { key: "f_realizados", conv: totals.f_agendados > 0 ? (totals.f_realizados / totals.f_agendados) : 0 },
      { key: "n_protocoladas", conv: totals.f_realizados > 0 ? (totals.n_protocoladas / totals.f_realizados) : 0 },
      { key: "recs", conv: "-" },
      { key: "pa", conv: "-" },
      { key: "cs", conv: "-" },
    ];

    conversions.forEach((c, idx) => {
      const total = totals[c.key];
      const avg = weeksWithData > 0 ? Math.round(total / weeksWithData * 100) / 100 : 0;
      rows.push([METRIC_LABELS[idx], total, avg, typeof c.conv === "number" ? Math.round(c.conv * 10000000000) / 10000000000 : c.conv]);
    });

    // --- Conversion rates at bottom ---
    rows.push([]);
    rows.push(["DELAY TOTAL"]);
    rows.push([totals.abs_marcadas > 0 ? (totals.abs_realizadas / totals.abs_marcadas) : 0]);
    rows.push(["LIG.AT --> AB.R"]);
    rows.push([totals.ligacoes_atendidas > 0 ? (totals.abs_realizadas / totals.ligacoes_atendidas) : 0]);
    rows.push(["AB.R --> N"]);
    rows.push([totals.abs_realizadas > 0 ? (totals.n_protocoladas / totals.abs_realizadas) : 0]);
    rows.push(["AB.R --> F.R"]);
    rows.push([totals.abs_realizadas > 0 ? (totals.f_realizados / totals.abs_realizadas) : 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(ano));
    XLSX.writeFile(wb, `relatorio_dashboard_${ano}.xlsx`);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="w-4 h-4" />
      Exportar Relatório
    </Button>
  );
}