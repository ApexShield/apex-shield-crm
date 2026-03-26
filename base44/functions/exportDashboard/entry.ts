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
  let i = idx + 1;
  while (i > 0) { i--; s = String.fromCharCode(65 + (i % 26)) + s; i = Math.floor(i / 26); }
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

// Helper to set a cell value + style on the worksheet
function setCell(ws, r, c, value, style, isFormula) {
  const ref = cellRef(r, c);
  if (isFormula) {
    ws[ref] = { f: value, t: "n", s: style || {} };
  } else if (typeof value === "number") {
    ws[ref] = { v: value, t: "n", s: style || {} };
  } else {
    ws[ref] = { v: value || "", t: "s", s: style || {} };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ano } = await req.json();
    if (!ano) return Response.json({ error: 'ano obrigatório' }, { status: 400 });

    console.log('Fetching data for ano:', ano, 'user:', user.email);
    const data = await base44.entities.DashboardDiario.filter({ ano, created_by: user.email });
    console.log('Data found:', data.length, 'records');
    if (data.length > 0) {
      console.log('Sample record:', JSON.stringify(data[0]));
    }

    const ws = {};
    const numWeeks = 52;
    const totalCol = numWeeks + 1; // col index 53
    const avgCol = numWeeks + 2;   // col index 54
    let currentRow = 0;

    const dayColors = ["006400", "006400", "006400", "006400", "006400"];
    const metricBgs = ["E2EFDA", "C6E0B4"];

    // ===== PER-DAY BLOCKS =====
    DIAS.forEach((dia, diaIdx) => {
      // Header row
      setCell(ws, currentRow, 0, dia, hdrStyle(dayColors[diaIdx]));
      for (let w = 0; w < numWeeks; w++) {
        setCell(ws, currentRow, w + 1, `Semana ${w + 1}`, hdrStyle(dayColors[diaIdx]));
      }
      setCell(ws, currentRow, totalCol, "TOTAL", hdrStyle(dayColors[diaIdx]));
      setCell(ws, currentRow, avgCol, "MÉDIA DO DIA", hdrStyle(dayColors[diaIdx]));
      currentRow++;

      const dayData = data.filter(d => d.dia_semana === dia);

      METRIC_KEYS.forEach((key, mIdx) => {
        const bg = metricBgs[mIdx % 2];
        const excelRow = currentRow + 1; // 1-indexed for formulas

        // Label
        setCell(ws, currentRow, 0, METRIC_LABELS[mIdx], metricLabelStyle(bg));

        // Weekly data
        for (let w = 1; w <= numWeeks; w++) {
          const val = dayData.filter(d => Number(d.semana) === w).reduce((s, d) => s + (Number(d[key]) || 0), 0);
          setCell(ws, currentRow, w, val, metricDataStyle(bg));
        }

        // TOTAL formula
        const lastWeekCol = colLetter(numWeeks);
        setCell(ws, currentRow, totalCol, `SUM(B${excelRow}:${lastWeekCol}${excelRow})`, totalStyle(), true);

        // AVERAGE formula
        setCell(ws, currentRow, avgCol, `IF(COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0")=0,0,${colLetter(totalCol)}${excelRow}/COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0"))`, totalStyle(), true);

        currentRow++;
      });

      currentRow++; // separator
    });

    // Empty rows
    currentRow += 2;

    // ===== INDICADOR DE ATIVIDADES =====
    setCell(ws, currentRow, 0, " ", {});
    setCell(ws, currentRow, 1, 1, {});
    currentRow++;

    const indHdr = currentRow;
    setCell(ws, indHdr, 0, "INDICADOR DE ATIVIDADES", hdrStyle("2F75B5"));
    for (let w = 0; w < numWeeks; w++) {
      setCell(ws, indHdr, w + 1, `Semana ${w + 1}`, hdrStyle("2F75B5"));
    }
    setCell(ws, indHdr, numWeeks + 1, "MÉDIAS", hdrStyle("2F75B5"));
    currentRow++;

    const indicadorLabels = ["Abs Realizadas", "RECS", "Propostas", "Soma dos prêmios", "PA", "Capital Segurado Total"];
    const indicadorKeys = [
      (d) => Number(d.abs_realizadas) || 0,
      (d) => Number(d.recs) || 0,
      (d) => Number(d.n_protocoladas) || 0,
      null,
      (d) => Number(d.pa) || 0,
      (d) => Number(d.cs) || 0,
    ];
    const indBgs = ["BDD7EE", "9BC2E6"];

    indicadorLabels.forEach((label, idx) => {
      const bg = indBgs[idx % 2];
      const excelRow = currentRow + 1;

      setCell(ws, currentRow, 0, label, metricLabelStyle(bg));
      for (let w = 1; w <= numWeeks; w++) {
        const wd = data.filter(d => Number(d.semana) === w);
        let val = 0;
        if (idx === 3) {
          val = Math.round(wd.reduce((s, d) => s + (Number(d.pa) || 0), 0) / 12 * 100) / 100;
        } else {
          val = wd.reduce((s, d) => s + (indicadorKeys[idx]?.(d) || 0), 0);
        }
        setCell(ws, currentRow, w, val, metricDataStyle(bg));
      }

      const lastWeekCol = colLetter(numWeeks);
      setCell(ws, currentRow, numWeeks + 1, `IF(COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0")=0,0,SUM(B${excelRow}:${lastWeekCol}${excelRow})/COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0"))`, metricDataStyle(bg), true);

      currentRow++;
    });

    // Empty rows
    currentRow += 5;

    // ===== FUNIL SEMANAL (DETALHADO) =====
    const funilHdr = currentRow;
    setCell(ws, funilHdr, 0, "FUNIL SEMANAL (DETALHADO)", hdrStyle("7030A0"));
    for (let w = 0; w < numWeeks; w++) {
      setCell(ws, funilHdr, w + 1, `Semana ${w + 1}`, hdrStyle("7030A0"));
    }
    setCell(ws, funilHdr, totalCol, "TOTAL", hdrStyle("7030A0"));
    setCell(ws, funilHdr, avgCol, "MÉDIA DO DIA", hdrStyle("7030A0"));
    currentRow++;

    const funilBgs = ["E4D0F5", "D2B4EB"];
    METRIC_KEYS.forEach((key, mIdx) => {
      const bg = funilBgs[mIdx % 2];
      const excelRow = currentRow + 1;

      setCell(ws, currentRow, 0, METRIC_LABELS[mIdx], metricLabelStyle(bg));
      for (let w = 1; w <= numWeeks; w++) {
        const val = data.filter(d => Number(d.semana) === w).reduce((s, d) => s + (Number(d[key]) || 0), 0);
        setCell(ws, currentRow, w, val, metricDataStyle(bg));
      }

      const lastWeekCol = colLetter(numWeeks);
      setCell(ws, currentRow, totalCol, `SUM(B${excelRow}:${lastWeekCol}${excelRow})`, totalStyle(), true);
      setCell(ws, currentRow, avgCol, `IF(COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0")=0,0,${colLetter(totalCol)}${excelRow}/COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0"))`, totalStyle(), true);

      currentRow++;
    });

    // ===== FUNIL SEMANAL (GERAL EQUIPE) =====
    currentRow++;
    const geralHdr = currentRow;
    setCell(ws, geralHdr, 0, "FUNIL SEMANAL (GERAL EQUIPE)", hdrStyle("C00000"));
    setCell(ws, geralHdr, 1, "TOTAL", hdrStyle("C00000"));
    setCell(ws, geralHdr, 2, "MÉDIA", hdrStyle("C00000"));
    setCell(ws, geralHdr, 3, "CONVERSÃO", hdrStyle("C00000"));
    currentRow++;

    const totals = {};
    METRIC_KEYS.forEach(k => { totals[k] = data.reduce((s, d) => s + (Number(d[k]) || 0), 0); });
    const weeksWithData = [...new Set(data.map(d => Number(d.semana)))].length;

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
      const bg = geralBgs[idx % 2];
      const total = totals[c.key];
      const avg = weeksWithData > 0 ? Math.round(total / weeksWithData * 100) / 100 : 0;

      setCell(ws, currentRow, 0, METRIC_LABELS[idx], metricLabelStyle(bg));
      setCell(ws, currentRow, 1, total, metricDataStyle(bg));
      setCell(ws, currentRow, 2, avg, metricDataStyle(bg));
      if (typeof c.conv === "number") {
        setCell(ws, currentRow, 3, Math.round(c.conv * 1e10) / 1e10, metricDataStyle(bg));
      } else {
        setCell(ws, currentRow, 3, c.conv, metricDataStyle(bg));
      }
      currentRow++;
    });

    // Conversion rates
    currentRow++;
    const convItems = [
      { label: "DELAY TOTAL", val: totals.abs_marcadas > 0 ? totals.abs_realizadas / totals.abs_marcadas : 0 },
      { label: "LIG.AT --> AB.R", val: totals.ligacoes_atendidas > 0 ? totals.abs_realizadas / totals.ligacoes_atendidas : 0 },
      { label: "AB.R --> N", val: totals.abs_realizadas > 0 ? totals.n_protocoladas / totals.abs_realizadas : 0 },
      { label: "AB.R --> F.R", val: totals.abs_realizadas > 0 ? totals.f_realizados / totals.abs_realizadas : 0 },
    ];
    convItems.forEach(item => {
      setCell(ws, currentRow, 0, item.label, {
        fill: { fgColor: { rgb: "FFC000" }, patternType: "solid" },
        font: { bold: true, sz: 11, name: "Calibri" },
        border: allBorders
      });
      currentRow++;
      setCell(ws, currentRow, 0, item.val, {
        fill: { fgColor: { rgb: "FFEB9C" }, patternType: "solid" },
        font: { sz: 10, name: "Calibri" },
        border: allBorders,
        numFmt: "0.0000000000"
      });
      currentRow++;
    });

    // Set worksheet range
    ws["!ref"] = `A1:${cellRef(currentRow - 1, avgCol)}`;

    // Column widths
    const colWidths = [{ wch: 36 }];
    for (let i = 0; i < numWeeks; i++) colWidths.push({ wch: 10 });
    colWidths.push({ wch: 12 }, { wch: 14 });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(ano));

    const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    return Response.json({ base64: buf, filename: `relatorio_dashboard_${ano}.xlsx` });
  } catch (error) {
    console.error('Export error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});