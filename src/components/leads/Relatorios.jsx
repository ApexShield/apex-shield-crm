import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Relatorios({ open, onClose, clientes }) {
  const [tipoRelatorio, setTipoRelatorio] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [gerando, setGerando] = useState(false);

  const gerarAlias = (email) => {
    if (!email) return "USER";
    const parts = email.split('@')[0].split(/[._-]/);
    let alias = "";
    parts.forEach(part => {
      if (/\d/.test(part)) {
        alias += part.match(/\d+/)[0];
      } else {
        alias += part.charAt(0).toUpperCase();
      }
    });
    return alias.substring(0, 6);
  };

  const gerarResumoDoDia = async () => {
    setGerando(true);
    
    const dataFormatada = format(new Date(dataSelecionada), "dd/MM/yyyy", { locale: ptBR });
    
    // Contadores por status
    const statusCount = {};
    const statusList = ["Novo", "AB Fone", "AB Visita", "AB Fechamento", "Delay", "Análise", "Venda Feita", "Entrega de Apólice", "Encerrado"];
    statusList.forEach(s => statusCount[s] = 0);
    
    clientes.forEach(c => {
      if (statusCount[c.status] !== undefined) {
        statusCount[c.status]++;
      }
    });
    
    // HOT40 - Leads com visita marcada para o dia
    const hot40 = clientes.filter(c => 
      c.status === "AB Fone" && c.data_visita === dataSelecionada
    );
    
    // Mudanças de status (simulação - na prática precisaria de histórico)
    const mudancas = [
      { de: "Novo", para: "AB Fone", quantidade: 0 },
      { de: "AB Fone", para: "AB Visita", quantidade: 0 },
      { de: "AB Visita", para: "AB Fechamento", quantidade: 0 },
      { de: "AB Fechamento", para: "Delay", quantidade: 0 },
      { de: "AB Fechamento", para: "Análise", quantidade: 0 },
      { de: "Análise", para: "Venda Feita", quantidade: 0 },
      { de: "Venda Feita", para: "Entrega de Apólice", quantidade: 0 },
      { de: "Qualquer", para: "Encerrado", quantidade: 0 },
      { de: "Fora do fluxo", para: "Outros", quantidade: 0 }
    ];

    const html = `
      <div id="relatorio-container" style="padding: 40px; font-family: Arial, sans-serif; background: white; width: 794px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0096D8;">
          <div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #0096D8, #AFCB3A); border-radius: 10px; margin-bottom: 15px;">
            <h1 style="color: white; font-size: 32px; margin: 0;">APEX SHIELD</h1>
          </div>
          <p style="color: #666; margin: 5px 0;">Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        <!-- Título -->
        <h2 style="color: #0096D8; font-size: 28px; margin-bottom: 25px; text-align: center;">📊 RESUMO DO DIA</h2>
        <p style="text-align: center; color: #666; font-size: 18px; margin-bottom: 30px;"><strong>Data de referência:</strong> ${dataFormatada}</p>

        <!-- Quantidade de Leads por Etapa -->
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h3 style="color: #0096D8; font-size: 20px; margin-bottom: 15px;">📈 Leads por Etapa</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${statusList.map((status, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${status}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 18px; color: #0096D8;"><strong>${statusCount[status]}</strong></td>
              </tr>
            `).join('')}
          </table>
        </div>

        <!-- HOT40 -->
        ${hot40.length > 0 ? `
        <div style="margin-bottom: 30px; background: #fff3cd; padding: 20px; border-radius: 10px; border: 2px solid #AFCB3A;">
          <h3 style="color: #AFCB3A; font-size: 20px; margin-bottom: 15px;">🔥 HOT40 - Visitas Agendadas para Hoje</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #AFCB3A; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd;">Nome</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Telefone</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Email</th>
              </tr>
            </thead>
            <tbody>
              ${hot40.map((lead, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fffbf0'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${lead.nome}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${lead.telefone || '—'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${lead.email || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Mudanças de Status -->
        <div style="margin-bottom: 30px; background: #e7f3ff; padding: 20px; border-radius: 10px;">
          <h3 style="color: #0096D8; font-size: 20px; margin-bottom: 15px;">🔄 Mudanças de Status no Dia</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #0096D8; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd;">De</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Para</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${mudancas.map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f0f8ff'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${m.de}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${m.para}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${m.quantidade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Rodapé -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #0096D8; color: #666;">
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} Apex Shield - CRM para Corretores de Seguro de Vida</p>
        </div>
      </div>
    `;

    // Criar elemento temporário
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container.querySelector('#relatorio-container'), {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Apex_Shield_Resumo_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } finally {
      document.body.removeChild(container);
      setGerando(false);
    }
  };

  const gerarHOT40 = async () => {
    setGerando(true);
    
    const hoje = new Date().toISOString().split('T')[0];
    const hot40 = clientes.filter(c => c.data_visita === hoje);

    const html = `
      <div id="relatorio-container" style="padding: 40px; font-family: Arial, sans-serif; background: white; width: 794px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #AFCB3A;">
          <div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #AFCB3A, #0096D8); border-radius: 10px; margin-bottom: 15px;">
            <h1 style="color: white; font-size: 32px; margin: 0;">APEX SHIELD</h1>
          </div>
          <p style="color: #666; margin: 5px 0;">Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        <!-- Título -->
        <h2 style="color: #AFCB3A; font-size: 28px; margin-bottom: 25px; text-align: center;">🔥 RELATÓRIO HOT40</h2>
        <p style="text-align: center; color: #666; font-size: 18px; margin-bottom: 30px;"><strong>Visitas Agendadas para Hoje</strong></p>

        ${hot40.length === 0 ? `
          <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 10px;">
            <p style="color: #666; font-size: 18px;">Nenhuma visita agendada para hoje.</p>
          </div>
        ` : hot40.map((lead, idx) => `
          <div style="margin-bottom: 25px; padding: 20px; background: ${idx % 2 === 0 ? '#fffbf0' : '#fff'}; border-radius: 10px; border-left: 5px solid #AFCB3A;">
            <h3 style="color: #0096D8; margin: 0 0 15px 0; font-size: 22px;">${idx + 1}. ${lead.nome}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <p style="margin: 5px 0;"><strong>📞 Telefone:</strong> ${lead.telefone || '—'}</p>
              <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${lead.email || '—'}</p>
              <p style="margin: 5px 0;"><strong>🏢 Empresa:</strong> ${lead.empresa || '—'}</p>
              <p style="margin: 5px 0;"><strong>💼 Cargo:</strong> ${lead.cargo || '—'}</p>
              <p style="margin: 5px 0;"><strong>💍 Estado Civil:</strong> ${lead.estado_civil || '—'}</p>
              <p style="margin: 5px 0;"><strong>👶 Filhos:</strong> ${lead.filhos || '—'}</p>
              <p style="margin: 5px 0; grid-column: 1 / -1;"><strong>📅 Data da Visita:</strong> ${lead.data_visita ? format(new Date(lead.data_visita), "dd/MM/yyyy", { locale: ptBR }) : '—'}</p>
            </div>
            ${lead.observacoes && lead.observacoes.length > 0 ? `
              <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px; border: 1px solid #ddd;">
                <strong style="color: #0096D8;">📝 Observações:</strong>
                ${lead.observacoes.slice(-3).map(obs => `
                  <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${obs.data}</div>
                    <div style="font-size: 13px;">${obs.texto}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <!-- Rodapé -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #AFCB3A; color: #666;">
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} Apex Shield - CRM para Corretores de Seguro de Vida</p>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container.querySelector('#relatorio-container'), {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
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
          if (heightLeft > 0) {
            pdf.addPage();
            position = -pageHeight * Math.ceil((imgHeight - heightLeft) / pageHeight);
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      
      pdf.save(`Apex_Shield_HOT40_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } finally {
      document.body.removeChild(container);
      setGerando(false);
    }
  };

  const handleGerar = () => {
    if (tipoRelatorio === 'resumo') {
      gerarResumoDoDia();
    } else if (tipoRelatorio === 'hot40') {
      gerarHOT40();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: '#0096D8' }} />
            Relatórios
          </DialogTitle>
        </DialogHeader>

        {!tipoRelatorio ? (
          <div className="space-y-4">
            <p className="text-gray-600">Selecione o tipo de relatório que deseja gerar:</p>
            
            <Button
              onClick={() => setTipoRelatorio('resumo')}
              className="w-full py-8 text-lg font-bold flex items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}
            >
              <Calendar className="w-6 h-6" />
              Resumo do Dia
            </Button>

            <Button
              onClick={() => setTipoRelatorio('hot40')}
              className="w-full py-8 text-lg font-bold flex items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg, #AFCB3A, #0096D8)' }}
            >
              <Download className="w-6 h-6" />
              HOT40 - Visitas de Hoje
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4" style={{ borderLeftColor: '#0096D8' }}>
              <h3 className="font-bold text-lg mb-2">
                {tipoRelatorio === 'resumo' ? '📊 Resumo do Dia' : '🔥 HOT40'}
              </h3>
              <p className="text-sm text-gray-600">
                {tipoRelatorio === 'resumo' 
                  ? 'Relatório completo com quantidade de leads por etapa, HOT40 e mudanças de status.'
                  : 'Lista de clientes com visitas agendadas para hoje com informações completas.'}
              </p>
            </div>

            {tipoRelatorio === 'resumo' && (
              <div>
                <Label>Selecione a data de referência:</Label>
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleGerar}
                disabled={gerando}
                className="flex-1 py-6 font-bold"
                style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}
              >
                {gerando ? 'Gerando...' : 'Gerar PDF'}
              </Button>
              <Button
                onClick={() => setTipoRelatorio(null)}
                variant="outline"
                className="flex-1 py-6 font-bold"
              >
                Voltar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}