import { useState, useRef } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEGURADORAS } from "./tabelasReajuste";
import html2canvas from "html2canvas";

const CM = 28.3465; // 1cm in PDF points
const MARGIN = 2 * CM; // 2cm margins
const A4_W = 21 * CM;  // 595.28
const A4_H = 29.7 * CM; // 841.89
const CONTENT_W = A4_W - 2 * MARGIN;
const CONTENT_H = A4_H - 2 * MARGIN;

const fmt = (v) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : "—";

const fmtShort = (v) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "—";

export default function RelatorioPDFButton({ projecoes, idadeInicial, valorInicial, sexo, chartRef }) {
  const [gerando, setGerando] = useState(false);

  const gerarPDF = async () => {
    setGerando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      
      let y = MARGIN;

      // ── HEADER ──
      // Background header bar
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, A4_W, 70, "F");
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("SIMULADOR DE REENQUADRAMENTO ETÁRIO", MARGIN, 30);
      
      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Projeção de reajuste na cobertura de morte por seguradora", MARGIN, 45);
      
      // Date
      const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Gerado em ${hoje}`, A4_W - MARGIN, 45, { align: "right" });

      // Logo text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(99, 102, 241); // indigo-500
      doc.text("APEX SHIELD CRM", A4_W - MARGIN, 30, { align: "right" });

      y = 85;

      // ── PARÂMETROS DA SIMULAÇÃO ──
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(MARGIN, y, CONTENT_W, 50, 4, 4, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text("PARÂMETROS DA SIMULAÇÃO", MARGIN + 12, y + 16);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      
      const sexoLabel = sexo === "masculino" ? "Masculino" : sexo === "feminino" ? "Feminino" : "Ambos";
      const colW = CONTENT_W / 4;
      const params = [
        { label: "Idade Inicial", value: `${idadeInicial} anos` },
        { label: "Sexo", value: sexoLabel },
        { label: "Cobertura Morte", value: fmtShort(valorInicial) },
        { label: "IPCA (a.a.)", value: `${projecoes.ipca}%` },
      ];
      params.forEach((p, i) => {
        const x = MARGIN + 12 + i * colW;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(p.label, x, y + 32);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(p.value, x, y + 42);
      });

      y += 62;

      // ── GRÁFICO (capturado via html2canvas) ──
      if (chartRef?.current) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("PROJEÇÃO DE REAJUSTE — COBERTURA DE MORTE", MARGIN, y + 4);
        y += 12;

        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgW = CONTENT_W;
        const imgH = (canvas.height / canvas.width) * imgW;
        const maxChartH = 220;
        const finalH = Math.min(imgH, maxChartH);
        doc.addImage(imgData, "PNG", MARGIN, y, imgW, finalH);
        y += finalH + 8;
      }

      // ── LEGENDA DAS SEGURADORAS ──
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, "F");
      
      const legendaX = MARGIN + 8;
      let lx = legendaX;
      SEGURADORAS.forEach((seg) => {
        const [r, g, b] = hexToRgb(seg.cor);
        doc.setFillColor(r, g, b);
        doc.circle(lx + 4, y + 11, 3, "F");
        doc.setFont("helvetica", seg.destaque ? "bold" : "normal");
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const nome = seg.destaque ? `${seg.nome} (IPCA)` : seg.nome;
        doc.text(nome, lx + 10, y + 13);
        lx += doc.getTextWidth(nome) + 20;
      });
      y += 30;

      // ── TABELA DE MARCOS (10, 20, 30 anos) ──
      const marcos = [10, 20, 30].filter(m => m <= projecoes.anosProjecao);
      
      if (marcos.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("COMPARATIVO POR PERÍODO", MARGIN, y + 4);
        y += 14;

        // Table header
        const tColW = CONTENT_W / (marcos.length + 1);
        doc.setFillColor(30, 41, 59); // slate-800
        doc.roundedRect(MARGIN, y, CONTENT_W, 18, 3, 3, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Seguradora", MARGIN + 8, y + 12);
        marcos.forEach((m, i) => {
          const ponto = projecoes.dados.find(p => p.ano === m);
          doc.text(`${m} anos (${ponto?.idade || ""}a)`, MARGIN + tColW * (i + 1) + 8, y + 12);
        });
        y += 20;

        // Table rows
        SEGURADORAS.forEach((seg, idx) => {
          const isEven = idx % 2 === 0;
          if (isEven) {
            doc.setFillColor(248, 250, 252);
            doc.rect(MARGIN, y, CONTENT_W, 16, "F");
          }
          
          // Seguradora name
          const [r, g, b] = hexToRgb(seg.cor);
          doc.setFillColor(r, g, b);
          doc.circle(MARGIN + 10, y + 8, 2.5, "F");
          doc.setFont("helvetica", seg.destaque ? "bold" : "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(seg.destaque ? 0 : 51, seg.destaque ? 128 : 65, seg.destaque ? 0 : 85);
          doc.text(seg.nome, MARGIN + 16, y + 10);
          
          // Values
          marcos.forEach((m, i) => {
            const ponto = projecoes.dados.find(p => p.ano === m);
            const val = ponto?.[seg.id] || 0;
            const pct = ((val / valorInicial - 1) * 100).toFixed(0);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            doc.text(fmtShort(val), MARGIN + tColW * (i + 1) + 8, y + 10);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.5);
            doc.setTextColor(seg.destaque ? 22 : 220, seg.destaque ? 163 : 38, seg.destaque ? 74 : 38);
            doc.text(`+${pct}%`, MARGIN + tColW * (i + 1) + 8 + doc.getTextWidth(fmtShort(val)) + 4, y + 10);
          });
          
          y += 16;
        });
        y += 8;
      }

      // ── TABELA DE ECONOMIA METLIFE ──
      const ultimoPonto = projecoes.dados[projecoes.dados.length - 1];
      const totaisPagos = {};
      SEGURADORAS.forEach(seg => {
        totaisPagos[seg.id] = projecoes.dados.reduce((sum, p) => sum + (p[seg.id] || 0), 0);
      });
      const metlifeTotal = totaisPagos["metlife"];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("ECONOMIA COM A METLIFE vs CONCORRENTES", MARGIN, y + 4);
      y += 14;

      // Header
      const eCols = [CONTENT_W * 0.28, CONTENT_W * 0.22, CONTENT_W * 0.25, CONTENT_W * 0.25];
      doc.setFillColor(22, 163, 74); // green-600
      doc.roundedRect(MARGIN, y, CONTENT_W, 18, 3, 3, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      const eHeaders = ["Seguradora", `Val. Final (${ultimoPonto.idade}a)`, "Total Acumulado", "Economia MetLife"];
      let ex = MARGIN + 8;
      eHeaders.forEach((h, i) => {
        doc.text(h, ex, y + 12);
        ex += eCols[i];
      });
      y += 20;

      // Rows
      SEGURADORAS.forEach((seg, idx) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.setFillColor(248, 250, 252);
          doc.rect(MARGIN, y, CONTENT_W, 16, "F");
        }
        if (seg.destaque) {
          doc.setFillColor(240, 253, 244); // green-50
          doc.rect(MARGIN, y, CONTENT_W, 16, "F");
        }

        ex = MARGIN + 8;
        
        // Name
        const [r, g, b] = hexToRgb(seg.cor);
        doc.setFillColor(r, g, b);
        doc.circle(ex + 2, y + 8, 2.5, "F");
        doc.setFont("helvetica", seg.destaque ? "bold" : "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(seg.destaque ? 22 : 51, seg.destaque ? 128 : 65, seg.destaque ? 0 : 85);
        doc.text(seg.nome, ex + 8, y + 10);
        ex += eCols[0];
        
        // Final value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(fmt(ultimoPonto[seg.id]), ex, y + 10);
        ex += eCols[1];
        
        // Accumulated
        doc.setFont("helvetica", "normal");
        doc.text(fmt(totaisPagos[seg.id]), ex, y + 10);
        ex += eCols[2];
        
        // Economy
        if (seg.destaque) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(22, 163, 74);
          doc.text("Referência", ex, y + 10);
        } else {
          const economia = totaisPagos[seg.id] - metlifeTotal;
          doc.setFont("helvetica", "bold");
          doc.setTextColor(220, 38, 38); // red-600
          doc.text(`+${fmt(economia)}`, ex, y + 10);
        }
        
        y += 16;
      });

      y += 12;

      // ── DISCLAIMER ──
      if (y + 60 > A4_H - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }

      doc.setFillColor(255, 251, 235); // amber-50
      doc.setDrawColor(253, 224, 71); // amber-300
      doc.roundedRect(MARGIN, y, CONTENT_W, 56, 3, 3, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(146, 64, 14); // amber-800
      doc.text("⚠ AVISO IMPORTANTE — SIMULAÇÃO PARA FINS DE CONSCIENTIZAÇÃO", MARGIN + 8, y + 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(
        "Esta simulação é baseada nas condições gerais de cada seguradora e tem caráter meramente informativo e educacional,",
        MARGIN + 8, y + 24
      );
      doc.text(
        "visando demonstrar o impacto financeiro do reenquadramento etário ao longo dos anos.",
        MARGIN + 8, y + 32
      );
      doc.setFont("helvetica", "bold");
      doc.text(
        "A validação real deve ser feita conforme o código do processo SUSEP de cada apólice.",
        MARGIN + 8, y + 42
      );
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6);
      doc.text(
        "Consulte sempre o contrato e as condições gerais vigentes antes de tomar qualquer decisão.",
        MARGIN + 8, y + 51
      );

      // ── FOOTER ──
      const footerY = A4_H - 20;
      doc.setDrawColor(226, 232, 240);
      doc.line(MARGIN, footerY - 8, A4_W - MARGIN, footerY - 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text("Apex Shield CRM — Simulador de Reenquadramento Etário", MARGIN, footerY);
      doc.text(`Gerado em ${hoje}`, A4_W - MARGIN, footerY, { align: "right" });

      // ── SAVE ──
      doc.save(`simulacao_reenquadramento_${idadeInicial}anos_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF: " + err.message);
    } finally {
      setGerando(false);
    }
  };

  if (!projecoes) return null;

  return (
    <Button
      onClick={gerarPDF}
      disabled={gerando}
      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold gap-2 shadow-lg"
      size="sm"
    >
      {gerando ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
      ) : (
        <><FileDown className="w-4 h-4" /> Relatório PDF</>
      )}
    </Button>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [100, 100, 100];
}