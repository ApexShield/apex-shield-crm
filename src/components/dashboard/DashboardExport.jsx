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

// Color definitions matching the Excel reference
const COLORS = {
  headerBg: { r: 0, g: 100, b: 0 },       // Dark green for day headers
  headerFont: { r: 255, g: 255, b: 255 },  // White text
  metricBg: { r: 226, g: 239, b: 218 },    // Light green for metric rows
  metricAlt: { r: 198, g: 224, b: 180 },   // Slightly darker green alternating
  totalBg: { r: 255, g: 230, b: 153 },     // Yellow for TOTAL/MÉDIA columns
  indicadorBg: { r: 47, g: 117, b: 181 },  // Blue for indicator header
  indicadorFont: { r: 255, g: 255, b: 255 },
  funilBg: { r: 112, g: 48, b: 160 },      // Purple for funil header
  funilFont: { r: 255, g: 255, b: 255 },
  geralBg: { r: 192, g: 0, b: 0 },         // Red for geral header
  geralFont: { r: 255, g: 255, b: 255 },
  convBg: { r: 255, g: 192, b: 0 },        // Orange for conversion section
};

function makeStyle(opts = {}) {
  const s = {};
  if (opts.fill) {
    s.fill = { fgColor: { rgb: rgbToHex(opts.fill) }, patternType: "solid" };
  }
  if (opts.font) {
    s.font = { ...opts.font };
    if (opts.fontColor) s.font.color = { rgb: rgbToHex(opts.fontColor) };
  } else if (opts.fontColor) {
    s.font = { color: { rgb: rgbToHex(opts.fontColor) } };
  }
  if (opts.bold) {
    s.font = s.font || {};
    s.font.bold = true;
  }
  if (opts.fontSize) {
    s.font = s.font || {};
    s.font.sz = opts.fontSize;
  }
  if (opts.border) {
    const b = { style: "thin", color: { rgb: "000000" } };
    s.border = { top: b, bottom: b, left: b, right: b };
  }
  if (opts.numFmt) {
    s.numFmt = opts.numFmt;
  }
  if (opts.alignment) {
    s.alignment = opts.alignment;
  }
  return s;
}

function rgbToHex(c) {
  return ((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1).toUpperCase();
}

function cellRef(r, c) {
  return colLetter(c) + (r + 1);
}

export default function DashboardExport({ data, ano }) {
  const handleExport = () => {
    const rows = [];
    const styles = {}; // cellRef -> style
    const weekCols = Array.from({ length: 52 }, (_, i) => `Semana ${i + 1}`);
    const numCols = weekCols.length;
    const totalColIdx = numCols + 1;
    const avgColIdx = numCols + 2;

    // Helper to set style
    const setStyle = (row, col, style) => {
      styles[cellRef(row, col)] = style;
    };

    const setRowStyle = (rowIdx, startCol, endCol, style) => {
      for (let c = startCol; c <= endCol; c++) {
        setStyle(rowIdx, c, style);
      }
    };

    // --- Per-day blocks ---
    DIAS.forEach((dia, diaIdx) => {
      const headerRowIdx = rows.length;
      const headerRow = [dia, ...weekCols, "TOTAL", "MÉDIA DO DIA"];
      rows.push(headerRow);

      // Style header row
      const headerStyle = makeStyle({
        fill: COLORS.headerBg, fontColor: COLORS.headerFont,
        bold: true, fontSize: 11, border: true,
        alignment: { horizontal: "center" }
      });
      setRowStyle(headerRowIdx, 0, numCols + 2, headerStyle);

      const dayData = data.filter(d => d.dia_semana === dia);

      METRIC_KEYS.forEach((key, mIdx) => {
        const rowIdx = rows.length;
        const r = rowIdx + 1; // 1-based for formulas
        const row = [METRIC_LABELS[mIdx]];
        for (let w = 1; w <= 52; w++) {
          const sum = dayData.filter(d => d.semana === w).reduce((s, d) => s + (d[key] || 0), 0);
          row.push(sum || 0);
        }
        row.push({ f: `SUM(B${r}:${colLetter(numCols)}${r})` });
        row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,"#DIV/0!",${colLetter(totalColIdx)}${r}/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
        rows.push(row);

        // Style metric rows - alternating colors
        const bg = mIdx % 2 === 0 ? COLORS.metricBg : COLORS.metricAlt;
        const metricStyle = makeStyle({ fill: bg, border: true, fontSize: 10 });
        const labelStyle = makeStyle({ fill: bg, border: true, bold: true, fontSize: 10 });
        const totalStyle = makeStyle({ fill: COLORS.totalBg, border: true, bold: true, fontSize: 10 });

        setStyle(rowIdx, 0, labelStyle);
        for (let c = 1; c <= numCols; c++) setStyle(rowIdx, c, metricStyle);
        setStyle(rowIdx, totalColIdx, totalStyle);
        setStyle(rowIdx, avgColIdx, totalStyle);
      });

      rows.push([]); // separator
    });

    // --- Empty rows ---
    rows.push([]);
    rows.push([]);

    // --- INDICADOR DE ATIVIDADES ---
    rows.push([" ", 1]);
    const indHeaderIdx = rows.length;
    rows.push(["INDICADOR DE ATIVIDADES", ...weekCols, "MÉDIAS"]);

    const indHeaderStyle = makeStyle({
      fill: COLORS.indicadorBg, fontColor: COLORS.indicadorFont,
      bold: true, fontSize: 11, border: true,
      alignment: { horizontal: "center" }
    });
    setRowStyle(indHeaderIdx, 0, numCols + 1, indHeaderStyle);

    const indicadorLabels = ["Abs Realizadas", "RECS", "Propostas", "Soma dos prêmios", "PA", "Capital Segurado Total"];
    const indicadorKeys = [
      (d) => d.abs_realizadas || 0,
      (d) => d.recs || 0,
      (d) => d.n_protocoladas || 0,
      null,
      (d) => d.pa || 0,
      (d) => d.cs || 0,
    ];

    indicadorLabels.forEach((label, idx) => {
      const rowIdx = rows.length;
      const r = rowIdx + 1;
      const row = [label];
      for (let w = 1; w <= 52; w++) {
        const weekData = data.filter(d => d.semana === w);
        let val = 0;
        if (idx === 3) {
          val = weekData.reduce((s, d) => s + (d.pa || 0), 0) / 12;
          val = Math.round(val * 100) / 100;
        } else {
          val = weekData.reduce((s, d) => s + (indicadorKeys[idx]?.(d) || 0), 0);
        }
        row.push(val);
      }
      row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,"#DIV/0!",SUM(B${r}:${colLetter(numCols)}${r})/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
      rows.push(row);

      const bg = idx % 2 === 0 ? { r: 189, g: 215, b: 238 } : { r: 155, g: 194, b: 230 };
      const metricStyle = makeStyle({ fill: bg, border: true, fontSize: 10 });
      const labelStyle = makeStyle({ fill: bg, border: true, bold: true, fontSize: 10 });
      setStyle(rowIdx, 0, labelStyle);
      for (let c = 1; c <= numCols + 1; c++) setStyle(rowIdx, c, metricStyle);
    });

    // --- Empty rows before FUNIL ---
    for (let i = 0; i < 5; i++) rows.push([]);

    // --- FUNIL SEMANAL (DETALHADO) ---
    const funilHeaderIdx = rows.length;
    rows.push(["FUNIL SEMANAL (DETALHADO)", ...weekCols, "TOTAL", "MÉDIA DO DIA"]);

    const funilHeaderStyle = makeStyle({
      fill: COLORS.funilBg, fontColor: COLORS.funilFont,
      bold: true, fontSize: 11, border: true,
      alignment: { horizontal: "center" }
    });
    setRowStyle(funilHeaderIdx, 0, numCols + 2, funilHeaderStyle);

    METRIC_KEYS.forEach((key, mIdx) => {
      const rowIdx = rows.length;
      const r = rowIdx + 1;
      const row = [METRIC_LABELS[mIdx]];
      for (let w = 1; w <= 52; w++) {
        const sum = data.filter(d => d.semana === w).reduce((s, d) => s + (d[key] || 0), 0);
        row.push(sum);
      }
      row.push({ f: `SUM(B${r}:${colLetter(numCols)}${r})` });
      row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,0,${colLetter(totalColIdx)}${r}/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
      rows.push(row);

      const bg = mIdx % 2 === 0 ? { r: 228, g: 208, b: 245 } : { r: 210, g: 180, b: 235 };
      const metricStyle = makeStyle({ fill: bg, border: true, fontSize: 10 });
      const labelStyle = makeStyle({ fill: bg, border: true, bold: true, fontSize: 10 });
      const totalStyle = makeStyle({ fill: COLORS.totalBg, border: true, bold: true, fontSize: 10 });
      setStyle(rowIdx, 0, labelStyle);
      for (let c = 1; c <= numCols; c++) setStyle(rowIdx, c, metricStyle);
      setStyle(rowIdx, totalColIdx, totalStyle);
      setStyle(rowIdx, avgColIdx, totalStyle);
    });

    // --- FUNIL SEMANAL (GERAL EQUIPE) ---
    rows.push([]);
    const geralHeaderIdx = rows.length;
    rows.push(["FUNIL SEMANAL (GERAL EQUIPE)", "TOTAL", "MÉDIA", "CONVERSÃO"]);

    const geralHeaderStyle = makeStyle({
      fill: COLORS.geralBg, fontColor: COLORS.geralFont,
      bold: true, fontSize: 11, border: true,
      alignment: { horizontal: "center" }
    });
    setRowStyle(geralHeaderIdx, 0, 3, geralHeaderStyle);

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
      const rowIdx = rows.length;
      const total = totals[c.key];
      const avg = weeksWithData > 0 ? Math.round(total / weeksWithData * 100) / 100 : 0;
      rows.push([METRIC_LABELS[idx], total, avg, typeof c.conv === "number" ? Math.round(c.conv * 10000000000) / 10000000000 : c.conv]);

      const bg = idx % 2 === 0 ? { r: 255, g: 199, b: 199 } : { r: 255, g: 170, b: 170 };
      const style = makeStyle({ fill: bg, border: true, fontSize: 10 });
      const labelStyle = makeStyle({ fill: bg, border: true, bold: true, fontSize: 10 });
      setStyle(rowIdx, 0, labelStyle);
      for (let cc = 1; cc <= 3; cc++) setStyle(rowIdx, cc, style);
    });

    // --- Conversion rates ---
    rows.push([]);
    const convLabels = [
      { label: "DELAY TOTAL", val: totals.abs_marcadas > 0 ? (totals.abs_realizadas / totals.abs_marcadas) : 0 },
      { label: "LIG.AT --> AB.R", val: totals.ligacoes_atendidas > 0 ? (totals.abs_realizadas / totals.ligacoes_atendidas) : 0 },
      { label: "AB.R --> N", val: totals.abs_realizadas > 0 ? (totals.n_protocoladas / totals.abs_realizadas) : 0 },
      { label: "AB.R --> F.R", val: totals.abs_realizadas > 0 ? (totals.f_realizados / totals.abs_realizadas) : 0 },
    ];
    convLabels.forEach(item => {
      const labelIdx = rows.length;
      rows.push([item.label]);
      setStyle(labelIdx, 0, makeStyle({ fill: COLORS.convBg, bold: true, fontSize: 11, border: true }));
      const valIdx = rows.length;
      rows.push([item.val]);
      setStyle(valIdx, 0, makeStyle({ fill: { r: 255, g: 235, b: 156 }, border: true, fontSize: 10, numFmt: "0.0000000000" }));
    });

    // Build worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Apply styles
    Object.entries(styles).forEach(([ref, style]) => {
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = style;
    });

    // Set column widths
    const colWidths = [{ wch: 36 }]; // col A wide for labels
    for (let i = 0; i < 52; i++) colWidths.push({ wch: 10 });
    colWidths.push({ wch: 12 }); // TOTAL
    colWidths.push({ wch: 14 }); // MÉDIA
    ws["!cols"] = colWidths;

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