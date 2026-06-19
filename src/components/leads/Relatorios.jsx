import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
const LOGO_URL = "https://media.base44.com/images/public/69587402a43b69a04695a178/ba9af73af_Gemini_Generated_Image_qu3wkyqu3wkyqu3w-removebg.png";

export default function Relatorios({ open, onClose, clientes }) {
  const [tipoRelatorio, setTipoRelatorio] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [gerando, setGerando] = useState(false);

  const gerarResumoDoDia = async () => {
    setGerando(true);
    
    const dataReferencia = new Date(dataSelecionada + 'T12:00:00');
    const dataFormatada = format(dataReferencia, "dd/MM/yyyy", { locale: ptBR });
    const inicioDia = new Date(dataSelecionada + 'T00:00:01');
    const fimDia = new Date(dataSelecionada + 'T23:59:59');
    
    const statusCount = {};
    const statusList = ["Novo", "AB Fone", "AB Visita", "AB Fechamento", "Delay", "Análise", "Venda Feita", "Entrega de Apólice", "Encerrado"];
    statusList.forEach(s => statusCount[s] = 0);
    clientes.forEach(c => { if (statusCount[c.status] !== undefined) statusCount[c.status]++; });
    
    const mudancasHoje = [];
    const contagemStatus = {};
    clientes.forEach(cliente => {
      if (cliente.historico_status && Array.isArray(cliente.historico_status)) {
        cliente.historico_status.forEach(mudanca => {
          const dataMudanca = new Date(mudanca.timestamp || 0);
          if (dataMudanca >= inicioDia && dataMudanca <= fimDia) {
            mudancasHoje.push(mudanca);
            const key = mudanca.para;
            if (!contagemStatus[key]) contagemStatus[key] = { total: 0, mudancas: [] };
            contagemStatus[key].total++;
            contagemStatus[key].mudancas.push(`${mudanca.de} → ${mudanca.para}`);
          }
        });
      }
    });
    
    const hot40 = clientes.filter(c => c.status === "AB Fone" && c.data_contato === dataSelecionada);
    
    const mudancasFluxo = [
      { de: "Novo", para: "AB Fone" }, { de: "AB Fone", para: "AB Visita" },
      { de: "AB Visita", para: "AB Fechamento" }, { de: "AB Fechamento", para: "Delay" },
      { de: "AB Fechamento", para: "Análise" }, { de: "Análise", para: "Venda Feita" },
      { de: "Venda Feita", para: "Entrega de Apólice" },
    ];
    const mudancasDetalhadas = mudancasFluxo.map(fluxo => ({
      ...fluxo, quantidade: mudancasHoje.filter(m => m.de === fluxo.de && m.para === fluxo.para).length
    }));
    const mudancasEncerrado = mudancasHoje.filter(m => m.para === "Encerrado").length;
    const mudancasForaFluxo = mudancasHoje.filter(m => {
      const noFluxo = mudancasFluxo.some(f => f.de === m.de && f.para === m.para);
      return !noFluxo && m.para !== "Encerrado";
    }).length;

    const html = `
      <div id="relatorio-container" style="padding: 30px; font-family: Arial, sans-serif; background: white; width: 750px;">
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #0096D8;">
          <h1 style="color: #0096D8; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">📊 APEX SHIELD</h1>
          <h2 style="color: #666; font-size: 18px; margin: 0 0 5px 0;">Relatório do Dia</h2>
          <p style="color: #666; margin: 0; font-size: 12px;">Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Data de referência:</strong> ${dataFormatada}</p>
        <p style="text-align: center; color: #999; font-size: 11px; margin-bottom: 20px;">${format(inicioDia, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} até ${format(fimDia, "HH:mm:ss", { locale: ptBR })}</p>
        <div style="margin-bottom: 15px; background: #f8f9fa; padding: 12px; border-radius: 6px;">
          <h3 style="color: #0096D8; font-size: 14px; margin: 0 0 8px 0; font-weight: bold;">📈 Análise de Movimentação</h3>
          ${Object.keys(contagemStatus).length > 0 ? Object.entries(contagemStatus).map(([status, info]) => `
            <div style="padding: 5px; background: white; margin-bottom: 3px; border-radius: 3px; border-left: 3px solid #0096D8; font-size: 10px;">
              <strong style="color: #0096D8;">${status}</strong> tem <strong>${statusCount[status] || 0}</strong>, total <strong style="color: #AFCB3A;">${info.total} movim.</strong>
            </div>
          `).join('') : '<p style="text-align: center; color: #666; font-size: 10px; margin: 0;">Nenhuma movimentação</p>'}
        </div>
        <div style="margin-bottom: 15px;">
          <h3 style="color: #0096D8; font-size: 14px; margin: 0 0 8px 0; font-weight: bold;">🔄 Variações</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <thead><tr style="background: #0096D8; color: white;">
              <th style="padding: 4px; border: 1px solid #ddd;">De</th>
              <th style="padding: 4px; border: 1px solid #ddd;">Para</th>
              <th style="padding: 4px; border: 1px solid #ddd;">Total</th>
            </tr></thead>
            <tbody>
              ${mudancasDetalhadas.filter(m => m.quantidade > 0).map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f0f8ff'};">
                  <td style="padding: 3px; border: 1px solid #ddd;">${m.de}</td>
                  <td style="padding: 3px; border: 1px solid #ddd;">${m.para}</td>
                  <td style="padding: 3px; border: 1px solid #ddd; text-align: center;"><strong>${m.quantidade}</strong></td>
                </tr>
              `).join('')}
              ${mudancasEncerrado > 0 ? `<tr style="background: #fff;"><td style="padding: 3px; border: 1px solid #ddd;">Qualquer</td><td style="padding: 3px; border: 1px solid #ddd;">Encerrado</td><td style="padding: 3px; border: 1px solid #ddd; text-align: center;"><strong>${mudancasEncerrado}</strong></td></tr>` : ''}
              ${mudancasForaFluxo > 0 ? `<tr style="background: #f0f8ff;"><td style="padding: 3px; border: 1px solid #ddd;">Fora Fluxo</td><td style="padding: 3px; border: 1px solid #ddd;">Outros</td><td style="padding: 3px; border: 1px solid #ddd; text-align: center;"><strong>${mudancasForaFluxo}</strong></td></tr>` : ''}
            </tbody>
          </table>
        </div>
        <div style="margin-bottom: 15px;">
          <h3 style="color: #0096D8; font-size: 14px; margin: 0 0 8px 0; font-weight: bold;">📋 Totais</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; font-size: 9px;">
            ${statusList.map(status => `
              <div style="background: #e7f3ff; padding: 4px; border-radius: 3px; text-align: center; border: 1px solid #0096D8;">
                <div style="font-weight: bold; color: #0096D8;">${status}</div>
                <div style="font-size: 11px; font-weight: bold;">${statusCount[status]}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ${hot40.length > 0 ? `
        <div style="margin-bottom: 20px; background: #fff3cd; padding: 15px; border-radius: 8px; border: 2px solid #AFCB3A;">
          <h3 style="color: #AFCB3A; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">🔥 HOT40 - Contatos Agendados para Hoje</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead><tr style="background: #AFCB3A; color: white;">
              <th style="padding: 6px; border: 1px solid #ddd;">Nome</th>
              <th style="padding: 6px; border: 1px solid #ddd;">Telefone</th>
              <th style="padding: 6px; border: 1px solid #ddd;">Email</th>
            </tr></thead>
            <tbody>
              ${hot40.map((lead, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fffbf0'};">
                  <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">${lead.nome}</td>
                  <td style="padding: 5px; border: 1px solid #ddd;">${lead.telefone || '—'}</td>
                  <td style="padding: 5px; border: 1px solid #ddd; font-size: 10px;">${lead.email || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : ''}
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #0096D8; color: #666;">
          <p style="margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Apex Shield - CRM para Corretores de Seguro de Vida</p>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container.querySelector('#relatorio-container'), { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 0;
      const pageHeight = 295;
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          if (heightLeft > 0) { pdf.addPage(); position = -pageHeight * Math.ceil((imgHeight - heightLeft) / pageHeight); }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      pdf.save(`Apex_Shield_Resumo_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } finally {
      document.body.removeChild(container);
      setGerando(false);
    }
  };

  const gerarHOT40 = async () => {
    setGerando(true);

    const hoje = dataSelecionada || new Date().toISOString().split('T')[0];
    const hot40 = clientes.filter(c => c.status === "AB Fone" && c.data_contato === hoje);
    const dataFormatada = format(new Date(hoje + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });

    // Preencher até 50 linhas
    const leads = [...hot40];
    while (leads.length < 50) leads.push(null);

    const buildRow = (lead, idx) => {
      if (!lead) {
        return `
          <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f0f4f8'};">
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;color:#94a3b8;">${idx + 1}</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:6px;">☐S ☐N</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:6px;">☐S ☐N</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:6px;">☐S ☐N</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
            <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;">&nbsp;</td>
          </tr>`;
      }
      const lastObs = lead.observacoes?.length > 0 ? lead.observacoes[lead.observacoes.length - 1]?.texto?.substring(0, 30) : "";
      const visitaDate = lead.agendar_visita ? format(new Date(lead.agendar_visita), "dd/MM", { locale: ptBR }) : "";
      const visitaHora = lead.agendar_visita ? format(new Date(lead.agendar_visita), "HH:mm") : "";
      const dataCriacao = lead.data_cadastro ? lead.data_cadastro.substring(5).replace("-", "/") : "";
      return `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f0f4f8'};">
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;font-weight:bold;color:#0f172a;">${idx + 1}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;max-width:110px;">${(lead.nome || "").substring(0, 24)}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;color:#059669;">${lead.telefone || '—'}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:6px;color:#2563eb;max-width:90px;overflow:hidden;">${(lead.email || '—').substring(0, 22)}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;">&nbsp;</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:6px;">☐S ☐N</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;">&nbsp;</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:6px;">☐S ☐N</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:7px;">&nbsp;</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;text-align:center;font-size:6px;">☐S ☐N</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;text-align:center;">${dataCriacao}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;text-align:center;">${visitaDate}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:7px;text-align:center;">${visitaHora}</td>
          <td style="padding:1px 3px;border:1px solid #d1d5db;font-size:6px;color:#475569;max-width:80px;overflow:hidden;">${lastObs}</td>
        </tr>`;
    };

    const html = `
      <div id="relatorio-container" style="width:1120px;padding:12px 16px;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;box-sizing:border-box;">
        
        <!-- HEADER BAND -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;padding-bottom:8px;border-bottom:3px solid #0f172a;">
          <img src="${LOGO_URL}" style="width:50px;height:50px;object-fit:contain;" crossorigin="anonymous" />
          <div style="flex:1;">
            <div style="display:flex;align-items:baseline;gap:8px;">
              <span style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:1px;">APEX SHIELD CRM</span>
              <span style="font-size:9px;color:#64748b;letter-spacing:0.5px;">CORRETORA DE SEGUROS</span>
            </div>
            <div style="font-size:12px;font-weight:700;color:#AFCB3A;margin-top:1px;">Relatório Hot40</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:8px;color:#94a3b8;">Data de Contato</div>
            <div style="font-size:14px;font-weight:800;color:#0f172a;">${dataFormatada}</div>
            <div style="font-size:7px;color:#94a3b8;">Gerado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
          </div>
        </div>

        <!-- STATS BAR -->
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <div style="flex:1;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:4px;padding:4px 8px;text-align:center;">
            <div style="font-size:7px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Total Leads</div>
            <div style="font-size:16px;font-weight:900;color:#ffffff;">${hot40.length}</div>
          </div>
          <div style="flex:1;background:linear-gradient(135deg,#AFCB3A,#84cc16);border-radius:4px;padding:4px 8px;text-align:center;">
            <div style="font-size:7px;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;">C/ Telefone</div>
            <div style="font-size:16px;font-weight:900;color:#ffffff;">${hot40.filter(l => l?.telefone).length}</div>
          </div>
          <div style="flex:1;background:linear-gradient(135deg,#0096D8,#0284c7);border-radius:4px;padding:4px 8px;text-align:center;">
            <div style="font-size:7px;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;">C/ Email</div>
            <div style="font-size:16px;font-weight:900;color:#ffffff;">${hot40.filter(l => l?.email).length}</div>
          </div>
          <div style="flex:1;background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:4px;padding:4px 8px;text-align:center;">
            <div style="font-size:7px;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;">C/ Visita</div>
            <div style="font-size:16px;font-weight:900;color:#ffffff;">${hot40.filter(l => l?.agendar_visita).length}</div>
          </div>
        </div>

        <!-- TABLE -->
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
          <colgroup>
            <col style="width:22px"/>
            <col style="width:115px"/>
            <col style="width:82px"/>
            <col style="width:95px"/>
            <col style="width:38px"/>
            <col style="width:40px"/>
            <col style="width:38px"/>
            <col style="width:40px"/>
            <col style="width:38px"/>
            <col style="width:40px"/>
            <col style="width:48px"/>
            <col style="width:42px"/>
            <col style="width:36px"/>
            <col style="width:85px"/>
          </colgroup>
          <thead>
            <tr style="background:linear-gradient(90deg,#0f172a,#1e3a5f);color:#ffffff;">
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;">Nº</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:left;">📋 NOME</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:left;">📞 CELULAR</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:left;">📧 EMAIL</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:center;background:#AFCB3A;color:#0f172a;">1ª</th>
              <th style="padding:3px 2px;font-size:5px;border:1px solid #334155;font-weight:700;text-align:center;background:#AFCB3A;color:#0f172a;">ATENDEU?</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:center;background:#0096D8;">2ª</th>
              <th style="padding:3px 2px;font-size:5px;border:1px solid #334155;font-weight:700;text-align:center;background:#0096D8;">ATENDEU?</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:center;background:#7c3aed;">3ª</th>
              <th style="padding:3px 2px;font-size:5px;border:1px solid #334155;font-weight:700;text-align:center;background:#7c3aed;">ATENDEU?</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:center;">📅 CRIAÇÃO</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:center;">📅 VISITA</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:center;">🕐 HORA</th>
              <th style="padding:3px 2px;font-size:6px;border:1px solid #334155;font-weight:700;text-align:left;">📝 OBS</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map((lead, idx) => buildRow(lead, idx)).join('')}
          </tbody>
        </table>

        <!-- FOOTER -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:2px solid #0f172a;">
          <div style="display:flex;align-items:center;gap:6px;">
            <img src="${LOGO_URL}" style="width:16px;height:16px;object-fit:contain;" crossorigin="anonymous" />
            <span style="font-size:7px;color:#64748b;font-weight:600;">APEX SHIELD CRM — Gestão Profissional de Seguros</span>
          </div>
          <span style="font-size:6px;color:#94a3b8;">© ${new Date().getFullYear()} Todos os direitos reservados</span>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      // Wait for logo to load
      const imgs = container.querySelectorAll('img');
      await Promise.all([...imgs].map(img => new Promise(r => { if (img.complete) r(); else { img.onload = r; img.onerror = r; } })));

      const canvas = await html2canvas(container.querySelector('#relatorio-container'), {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
      const pageW = 297;
      const pageH = 210;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgW, Math.min(imgH, pageH));
      pdf.save(`Apex_Shield_HOT40_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } finally {
      document.body.removeChild(container);
      setGerando(false);
    }
  };

  const handleGerar = () => {
    if (tipoRelatorio === 'resumo') gerarResumoDoDia();
    else if (tipoRelatorio === 'hot40') gerarHOT40();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: '#0096D8' }} />
            Relatórios
          </DialogTitle>
        </DialogHeader>

        {!tipoRelatorio ? (
          <div className="space-y-4 p-4">
            <p className="text-gray-600 text-center text-lg mb-6">Selecione o tipo de relatório que deseja gerar:</p>
            <div className="grid grid-cols-2 gap-6">
              <Button onClick={() => setTipoRelatorio('resumo')}
                className="py-12 text-lg font-bold flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}>
                <Calendar className="w-12 h-12" />
                <div>
                  <div className="text-xl">Resumo do Dia</div>
                  <div className="text-xs font-normal opacity-90 mt-1">Análise completa de movimentação</div>
                </div>
              </Button>
              <Button onClick={() => setTipoRelatorio('hot40')}
                className="py-12 text-lg font-bold flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #AFCB3A, #0096D8)' }}>
                <Download className="w-12 h-12" />
                <div>
                  <div className="text-xl">HOT40</div>
                  <div className="text-xs font-normal opacity-90 mt-1">PDF profissional de contatos</div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-4">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-l-4" style={{ borderLeftColor: '#0096D8' }}>
              <h3 className="font-bold text-2xl mb-3 flex items-center gap-2">
                {tipoRelatorio === 'resumo' ? '📊 Resumo do Dia' : '🔥 HOT40'}
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">
                {tipoRelatorio === 'resumo' 
                  ? 'Relatório completo com análise de movimentação, quantidade de leads por etapa e variações detalhadas de status.'
                  : 'PDF profissional com até 50 leads AB FONE, colunas de tentativas com check de atendimento, data de visita e observações.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
              <Label className="text-base font-bold">Selecione a data {tipoRelatorio === 'resumo' ? 'de referência' : 'do contato'}:</Label>
              <Input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)}
                max={new Date().toISOString().split('T')[0]} className="mt-3 h-12 text-base" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleGerar} disabled={gerando} className="py-8 font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}>
                {gerando ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando...</>
                ) : (
                  <><Download className="w-5 h-5 mr-2" />Gerar PDF</>
                )}
              </Button>
              <Button onClick={() => setTipoRelatorio(null)} variant="outline" className="py-8 font-bold text-lg">
                Voltar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}