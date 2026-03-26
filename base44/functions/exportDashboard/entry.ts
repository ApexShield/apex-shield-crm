import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import XLSX from 'npm:xlsx-js-style@1.2.0';

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

function cellRef(r, c) {
  return colLetter(c) + (r + 1);
}

const border = { style: "thin", color: { rgb: "333333" } };
const allBorders = { top: border, bottom: border, left: border, right: border };

function hdrStyle(bgRgb) {
  return {
    fill: { fgColor: { rgb: bgRgb }, patternType: "solid" },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Calibri" },
    border: allBorders,
    alignment: { horizontal: "center", vertical: "center", wrapText: true }
  };
}

function metricLabelStyle(bgRgb) {
  return {
    fill: { fgColor: { rgb: bgRgb }, patternType: "solid" },
    font: { bold: true, sz: 10, name: "Calibri" },
    border: allBorders,
    alignment: { vertical: "center" }
  };
}

function metricDataStyle(bgRgb) {
  return {
    fill: { fgColor: { rgb: bgRgb }, patternType: "solid" },
    font: { sz: 10, name: "Calibri" },
    border: allBorders,
    alignment: { horizontal: "center", vertical: "center" }
  };
}

function totalStyle() {
  return {
    fill: { fgColor: { rgb: "FFE699" }, patternType: "solid" },
    font: { bold: true, sz: 10, name: "Calibri" },
    border: allBorders,
    alignment: { horizontal: "center", vertical: "center" }
  };
}

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { ano } = await req.json();
  if (!ano) return Response.json({ error: 'ano obrigatório' }, { status: 400 });

  // Fetch dashboard data
  const data = await base44.entities.DashboardDiario.filter({ ano, created_by: user.email });

  const rows = [];
  const styles = {};
  const numCols = 52;
  const totalColIdx = numCols + 1;
  const avgColIdx = numCols + 2;

  const setStyle = (row, col, style) => { styles[cellRef(row, col)] = style; };
  const setRowStyle = (rowIdx, startCol, endCol, style) => {
    for (let c = startCol; c <= endCol; c++) setStyle(rowIdx, c, style);
  };

  const weekCols = Array.from({ length: 52 }, (_, i) => `Semana ${i + 1}`);

  // Day header colors cycle
  const dayColors = ["006400", "006400", "006400", "006400", "006400"];
  const metricBgs = [["E2EFDA", "C6E0B4"], ["E2EFDA", "C6E0B4"], ["E2EFDA", "C6E0B4"], ["E2EFDA", "C6E0B4"], ["E2EFDA", "C6E0B4"]];

  // PER-DAY BLOCKS
  DIAS.forEach((dia, diaIdx) => {
    const hdrIdx = rows.length;
    rows.push([dia, ...weekCols, "TOTAL", "MÉDIA DO DIA"]);
    setRowStyle(hdrIdx, 0, avgColIdx, hdrStyle(dayColors[diaIdx]));

    const dayData = data.filter(d => d.dia_semana === dia);
    METRIC_KEYS.forEach((key, mIdx) => {
      const rowIdx = rows.length;
      const r = rowIdx + 1;
      const row = [METRIC_LABELS[mIdx]];
      for (let w = 1; w <= 52; w++) {
        row.push(dayData.filter(d => d.semana === w).reduce((s, d) => s + (d[key] || 0), 0) || 0);
      }
      row.push({ f: `SUM(B${r}:${colLetter(numCols)}${r})` });
      row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,"#DIV/0!",${colLetter(totalColIdx)}${r}/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
      rows.push(row);

      const bg = metricBgs[diaIdx][mIdx % 2];
      setStyle(rowIdx, 0, metricLabelStyle(bg));
      for (let c = 1; c <= numCols; c++) setStyle(rowIdx, c, metricDataStyle(bg));
      setStyle(rowIdx, totalColIdx, totalStyle());
      setStyle(rowIdx, avgColIdx, totalStyle());
    });
    rows.push([]); // separator
  });

  // Empty rows
  rows.push([]); rows.push([]);

  // INDICADOR DE ATIVIDADES
  rows.push([" ", 1]);
  const indHdrIdx = rows.length;
  rows.push(["INDICADOR DE ATIVIDADES", ...weekCols, "MÉDIAS"]);
  setRowStyle(indHdrIdx, 0, numCols + 1, hdrStyle("2F75B5"));

  const indicadorLabels = ["Abs Realizadas", "RECS", "Propostas", "Soma dos prêmios", "PA", "Capital Segurado Total"];
  const indicadorKeys = [
    (d) => d.abs_realizadas || 0, (d) => d.recs || 0, (d) => d.n_protocoladas || 0,
    null, (d) => d.pa || 0, (d) => d.cs || 0,
  ];
  const indBgs = ["BDD7EE", "9BC2E6"];

  indicadorLabels.forEach((label, idx) => {
    const rowIdx = rows.length;
    const r = rowIdx + 1;
    const row = [label];
    for (let w = 1; w <= 52; w++) {
      const wd = data.filter(d => d.semana === w);
      let val = 0;
      if (idx === 3) { val = Math.round(wd.reduce((s, d) => s + (d.pa || 0), 0) / 12 * 100) / 100; }
      else { val = wd.reduce((s, d) => s + (indicadorKeys[idx]?.(d) || 0), 0); }
      row.push(val);
    }
    row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,"#DIV/0!",SUM(B${r}:${colLetter(numCols)}${r})/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
    rows.push(row);
    const bg = indBgs[idx % 2];
    setStyle(rowIdx, 0, metricLabelStyle(bg));
    for (let c = 1; c <= numCols + 1; c++) setStyle(rowIdx, c, metricDataStyle(bg));
  });

  // Empty rows
  for (let i = 0; i < 5; i++) rows.push([]);

  // FUNIL SEMANAL (DETALHADO)
  const funilHdrIdx = rows.length;
  rows.push(["FUNIL SEMANAL (DETALHADO)", ...weekCols, "TOTAL", "MÉDIA DO DIA"]);
  setRowStyle(funilHdrIdx, 0, avgColIdx, hdrStyle("7030A0"));

  const funilBgs = ["E4D0F5", "D2B4EB"];
  METRIC_KEYS.forEach((key, mIdx) => {
    const rowIdx = rows.length;
    const r = rowIdx + 1;
    const row = [METRIC_LABELS[mIdx]];
    for (let w = 1; w <= 52; w++) {
      row.push(data.filter(d => d.semana === w).reduce((s, d) => s + (d[key] || 0), 0));
    }
    row.push({ f: `SUM(B${r}:${colLetter(numCols)}${r})` });
    row.push({ f: `IF(COUNTIF(B${r}:${colLetter(numCols)}${r},">0")=0,0,${colLetter(totalColIdx)}${r}/COUNTIF(B${r}:${colLetter(numCols)}${r},">0"))` });
    rows.push(row);
    const bg = funilBgs[mIdx % 2];
    setStyle(rowIdx, 0, metricLabelStyle(bg));
    for (let c = 1; c <= numCols; c++) setStyle(rowIdx, c, metricDataStyle(bg));
    setStyle(rowIdx, totalColIdx, totalStyle());
    setStyle(rowIdx, avgColIdx, totalStyle());
  });

  // FUNIL SEMANAL (GERAL EQUIPE)
  rows.push([]);
  const geralHdrIdx = rows.length;
  rows.push(["FUNIL SEMANAL (GERAL EQUIPE)", "TOTAL", "MÉDIA", "CONVERSÃO"]);
  setRowStyle(geralHdrIdx, 0, 3, hdrStyle("C00000"));

  const totals = {};
  METRIC_KEYS.forEach(k => { totals[k] = data.reduce((s, d) => s + (d[k] || 0), 0); });
  const weeksWithData = [...new Set(data.map(d => d.semana))].length;

  const conversions = [
    { key: "ligacoes_realizadas", conv: "-" },
    { key: "ligacoes_atendidas", conv: totals.ligacoes_realizadas > 0 ? totals.ligacoes_atendidas / totals.ligacoes_realizadas : 0 },
    { key: "agendamentos_feitos", conv: totals.ligacoes_atendidas > 0 ? totals.agendamentos_feitos / totals.ligacoes_atendidas : 0 },
    { key: "abs_marcadas", conv: "-" },
    { key: "abs_realizadas", conv: totals.abs_marcadas > 0 ? totals.abs_realizadas / totals.abs_marcadas : 0 },
    { key: "f_agendados", conv: "-" },
    { key: "f_realizados", conv: totals.f_agendados > 0 ? totals.f_realizados / totals.f_agendados : 0 },
    { key: "n_protocoladas", conv: totals.f_realizados > 0 ? totals.n_protocoladas / totals.f_realizados : 0 },
    { key: "recs", conv: "-" },
    { key: "pa", conv: "-" },
    { key: "cs", conv: "-" },
  ];

  const geralBgs = ["FFC7C7", "FFAAAA"];
  conversions.forEach((c, idx) => {
    const rowIdx = rows.length;
    const total = totals[c.key];
    const avg = weeksWithData > 0 ? Math.round(total / weeksWithData * 100) / 100 : 0;
    rows.push([METRIC_LABELS[idx], total, avg, typeof c.conv === "number" ? Math.round(c.conv * 1e10) / 1e10 : c.conv]);
    const bg = geralBgs[idx % 2];
    setStyle(rowIdx, 0, metricLabelStyle(bg));
    for (let cc = 1; cc <= 3; cc++) setStyle(rowIdx, cc, metricDataStyle(bg));
  });

  // Conversion rates
  rows.push([]);
  const convItems = [
    { label: "DELAY TOTAL", val: totals.abs_marcadas > 0 ? totals.abs_realizadas / totals.abs_marcadas : 0 },
    { label: "LIG.AT --> AB.R", val: totals.ligacoes_atendidas > 0 ? totals.abs_realizadas / totals.ligacoes_atendidas : 0 },
    { label: "AB.R --> N", val: totals.abs_realizadas > 0 ? totals.n_protocoladas / totals.abs_realizadas : 0 },
    { label: "AB.R --> F.R", val: totals.abs_realizadas > 0 ? totals.f_realizados / totals.abs_realizadas : 0 },
  ];
  convItems.forEach(item => {
    const lIdx = rows.length;
    rows.push([item.label]);
    setStyle(lIdx, 0, { fill: { fgColor: { rgb: "FFC000" }, patternType: "solid" }, font: { bold: true, sz: 11, name: "Calibri" }, border: allBorders });
    const vIdx = rows.length;
    rows.push([item.val]);
    setStyle(vIdx, 0, { fill: { fgColor: { rgb: "FFEB9C" }, patternType: "solid" }, font: { sz: 10, name: "Calibri" }, border: allBorders, numFmt: "0.0000000000" });
  });

  // Build workbook
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Apply styles
  for (const [ref, style] of Object.entries(styles)) {
    if (!ws[ref]) ws[ref] = { v: "", t: "s" };
    ws[ref].s = style;
  }

  // Column widths
  const colWidths = [{ wch: 36 }];
  for (let i = 0; i < 52; i++) colWidths.push({ wch: 10 });
  colWidths.push({ wch: 12 }, { wch: 14 });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(ano));

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=relatorio_dashboard_${ano}.xlsx`
    }
  });
  } catch (error) {
    console.error('Export error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});