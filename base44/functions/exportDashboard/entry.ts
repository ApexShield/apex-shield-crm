import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
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

function buildSheet(data) {
  const ws = {};
  const numWeeks = 52;
  const totalCol = numWeeks + 1;
  const avgCol = numWeeks + 2;
  let currentRow = 0;

  const dayColors = ["006400", "006400", "006400", "006400", "006400"];
  const metricBgs = ["E2EFDA", "C6E0B4"];

  DIAS.forEach((dia, diaIdx) => {
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
      const excelRow = currentRow + 1;
      setCell(ws, currentRow, 0, METRIC_LABELS[mIdx], metricLabelStyle(bg));
      for (let w = 1; w <= numWeeks; w++) {
        const val = dayData.filter(d => Number(d.semana) === w).reduce((s, d) => s + (Number(d[key]) || 0), 0);
        setCell(ws, currentRow, w, val, metricDataStyle(bg));
      }
      const lastWeekCol = colLetter(numWeeks);
      setCell(ws, currentRow, totalCol, `SUM(B${excelRow}:${lastWeekCol}${excelRow})`, totalStyle(), true);
      setCell(ws, currentRow, avgCol, `IF(COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0")=0,0,${colLetter(totalCol)}${excelRow}/COUNTIF(B${excelRow}:${lastWeekCol}${excelRow},">0"))`, totalStyle(), true);
      currentRow++;
    });
    currentRow++;
  });

  currentRow += 2;

  // INDICADOR DE ATIVIDADES
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

  currentRow += 5;

  // FUNIL SEMANAL (DETALHADO)
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

  // FUNIL GERAL
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
      setCell(ws, currentRow, 3, c.conv, { ...metricDataStyle(bg), numFmt: "0.00%" });
    } else {
      setCell(ws, currentRow, 3, c.conv, metricDataStyle(bg));
    }
    currentRow++;
  });

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
      numFmt: "0.00%"
    });
    currentRow++;
  });

  ws["!ref"] = `A1:${cellRef(currentRow - 1, avgCol)}`;
  const colWidths = [{ wch: 36 }];
  for (let i = 0; i < numWeeks; i++) colWidths.push({ wch: 10 });
  colWidths.push({ wch: 12 }, { wch: 14 });
  ws["!cols"] = colWidths;

  return ws;
}

// Sanitize sheet name for Excel (max 31 chars, no special chars)
function sanitizeSheetName(name) {
  return (name || "Sem Nome").replace(/[\\\/\?\*\[\]:]/g, "").substring(0, 31);
}

// Helper functions for hierarchy (same as getDashboardEquipe)
function findSubordinates(allUsers, leaderEmail, leaderId) {
  return allUsers.filter(u => {
    if (u.email === leaderEmail) return false;
    const lEmail = u.lider_email || (u.data && u.data.lider_email);
    const lId = u.lider_id || (u.data && u.data.lider_id);
    return (lEmail === leaderEmail || (leaderId && lId === leaderId));
  });
}

function findAllDescendants(allUsers, leaderEmail, leaderId) {
  const directSubs = findSubordinates(allUsers, leaderEmail, leaderId);
  let all = [...directSubs];
  for (const sub of directSubs) {
    const subSubs = findAllDescendants(allUsers, sub.email, sub.id);
    all = all.concat(subSubs);
  }
  return all;
}

function getUserField(u, field) {
  if (u[field] !== undefined && u[field] !== null && u[field] !== '') return u[field];
  if (u.data && u.data[field] !== undefined && u.data[field] !== null && u.data[field] !== '') return u.data[field];
  return undefined;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ano, modo } = await req.json();
    if (!ano) return Response.json({ error: 'ano obrigatório' }, { status: 400 });

    const anoNum = (ano === "todos" || ano === null) ? null : parseInt(ano);
    const tipoHierarquia = user.tipo_hierarquia;
    const isEquipe = modo === "equipe";
    console.log('Export for user:', user.email, '| tipo:', tipoHierarquia, '| ano:', anoNum, '| modo:', modo);

    // ────────────────────────────────
    // INDIVIDUAL: relatório pessoal (corretor ou líder em "meus dados")
    // ────────────────────────────────
    if (!isEquipe || !tipoHierarquia || tipoHierarquia === "Corretor") {
      let data;
      if (anoNum) {
        data = await base44.entities.DashboardDiario.filter({ ano: anoNum }, '-data', 5000);
      } else {
        data = await base44.entities.DashboardDiario.list('-data', 5000);
      }
      console.log('Corretor data:', data.length, 'records');

      const wb = XLSX.utils.book_new();
      if (anoNum) {
        XLSX.utils.book_append_sheet(wb, buildSheet(data), String(anoNum));
      } else {
        const years = [...new Set(data.map(d => Number(d.ano)))].sort();
        if (years.length === 0) {
          XLSX.utils.book_append_sheet(wb, buildSheet([]), "Sem Dados");
        } else {
          for (const year of years) {
            XLSX.utils.book_append_sheet(wb, buildSheet(data.filter(d => Number(d.ano) === year)), String(year));
          }
        }
      }

      const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      return Response.json({ base64: buf, filename: `relatorio_dashboard_${anoNum || 'todos'}.xlsx` });
    }

    // ────────────────────────────────
    // LÍDER: relatório da equipe
    // ────────────────────────────────
    const allUsers = await base44.asServiceRole.entities.User.list();
    let allRecords;
    if (anoNum) {
      allRecords = await base44.asServiceRole.entities.DashboardDiario.filter({ ano: anoNum }, '-data', 5000);
    } else {
      allRecords = await base44.asServiceRole.entities.DashboardDiario.list('-data', 5000);
    }
    console.log('All records fetched:', allRecords.length);

    // Normalize records (flatten .data if present)
    const normalizedRecords = allRecords.map(r => {
      if (r.data && typeof r.data === 'object' && r.data.dia_semana) {
        return { ...r.data, created_by: r.created_by };
      }
      return r;
    });

    const wb = XLSX.utils.book_new();
    const usedSheetNames = new Set();
    function uniqueSheetName(base) {
      let name = sanitizeSheetName(base);
      let counter = 1;
      while (usedSheetNames.has(name)) {
        const suffix = ` (${counter})`;
        name = sanitizeSheetName(base).substring(0, 31 - suffix.length) + suffix;
        counter++;
      }
      usedSheetNames.add(name);
      return name;
    }

    if (tipoHierarquia === "Líder de Unidade") {
      // ── Líder de Unidade ──
      const subordinates = findSubordinates(allUsers, user.email, user.id);
      const allUnitEmails = [user.email, ...subordinates.map(u => u.email)];
      const unitRecords = normalizedRecords.filter(r => allUnitEmails.includes(r.created_by));

      // Aba 1: TOTAL DA EQUIPE
      const totalSheetName = uniqueSheetName("TOTAL EQUIPE");
      XLSX.utils.book_append_sheet(wb, buildSheet(unitRecords), totalSheetName);

      // Aba do próprio líder
      const leaderRecords = normalizedRecords.filter(r => r.created_by === user.email);
      if (leaderRecords.length > 0) {
        const leaderSheetName = uniqueSheetName(user.full_name || user.email);
        XLSX.utils.book_append_sheet(wb, buildSheet(leaderRecords), leaderSheetName);
      }

      // Uma aba por corretor subordinado
      for (const sub of subordinates) {
        const subRecords = normalizedRecords.filter(r => r.created_by === sub.email);
        const sheetName = uniqueSheetName(sub.full_name || sub.email);
        XLSX.utils.book_append_sheet(wb, buildSheet(subRecords), sheetName);
      }

      console.log(`Líder de Unidade: ${subordinates.length} corretores, ${unitRecords.length} registros total`);

    } else if (tipoHierarquia === "Líder de Agência") {
      // ── Líder de Agência ──
      const allDescendants = findAllDescendants(allUsers, user.email, user.id);
      const allTeamEmails = [user.email, ...allDescendants.map(u => u.email)];
      const allTeamRecords = normalizedRecords.filter(r => allTeamEmails.includes(r.created_by));

      // Aba 1: TOTAL AGÊNCIA
      const totalSheetName = uniqueSheetName("TOTAL AGÊNCIA");
      XLSX.utils.book_append_sheet(wb, buildSheet(allTeamRecords), totalSheetName);

      // Abas por unidade + corretores dentro de cada unidade
      const directSubs = findSubordinates(allUsers, user.email, user.id);
      const unitLeaders = directSubs.filter(u => getUserField(u, 'tipo_hierarquia') === "Líder de Unidade");
      const directBrokers = directSubs.filter(u => getUserField(u, 'tipo_hierarquia') !== "Líder de Unidade");

      for (const leader of unitLeaders) {
        const unitMembers = findSubordinates(allUsers, leader.email, leader.id);
        const allUnitEmails = [leader.email, ...unitMembers.map(u => u.email)];
        const unitRecords = normalizedRecords.filter(r => allUnitEmails.includes(r.created_by));
        const unitName = getUserField(leader, 'unidade_nome') || `Unidade ${leader.full_name || leader.email}`;

        // Aba da unidade (total)
        const unitSheetName = uniqueSheetName(`UN - ${unitName}`);
        XLSX.utils.book_append_sheet(wb, buildSheet(unitRecords), unitSheetName);

        // Aba do líder de unidade
        const leaderRecords = normalizedRecords.filter(r => r.created_by === leader.email);
        if (leaderRecords.length > 0) {
          const leaderSheet = uniqueSheetName(leader.full_name || leader.email);
          XLSX.utils.book_append_sheet(wb, buildSheet(leaderRecords), leaderSheet);
        }

        // Abas dos corretores da unidade
        for (const m of unitMembers) {
          const memberRecords = normalizedRecords.filter(r => r.created_by === m.email);
          const memberSheet = uniqueSheetName(m.full_name || m.email);
          XLSX.utils.book_append_sheet(wb, buildSheet(memberRecords), memberSheet);
        }
      }

      // Corretores diretos (sem unidade)
      for (const b of directBrokers) {
        const bRecords = normalizedRecords.filter(r => r.created_by === b.email);
        const bSheet = uniqueSheetName(b.full_name || b.email);
        XLSX.utils.book_append_sheet(wb, buildSheet(bRecords), bSheet);
      }

      console.log(`Líder de Agência: ${allDescendants.length} membros, ${allTeamRecords.length} registros total`);
    }

    const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const label = anoNum || 'todos';
    const filename = tipoHierarquia === "Líder de Agência"
      ? `relatorio_agencia_${label}.xlsx`
      : `relatorio_equipe_${label}.xlsx`;

    return Response.json({ base64: buf, filename });
  } catch (error) {
    console.error('Export error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});