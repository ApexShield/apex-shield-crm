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
    const inicioDia = new Date(dataSelecionada);
    inicioDia.setHours(0, 0, 1, 0);
    const fimDia = new Date(dataSelecionada);
    fimDia.setHours(23, 59, 59, 999);
    
    // Contadores por status ATUAIS
    const statusCount = {};
    const statusList = ["Novo", "AB Fone", "AB Visita", "AB Fechamento", "Delay", "Análise", "Venda Feita", "Entrega de Apólice", "Encerrado"];
    statusList.forEach(s => statusCount[s] = 0);
    
    clientes.forEach(c => {
      if (statusCount[c.status] !== undefined) {
        statusCount[c.status]++;
      }
    });
    
    // ANÁLISE DE MOVIMENTAÇÃO - contar mudanças no histórico do dia
    const mudancasHoje = [];
    const contagemStatus = {};
    
    clientes.forEach(cliente => {
      if (cliente.historico_status && Array.isArray(cliente.historico_status)) {
        cliente.historico_status.forEach(mudanca => {
          const dataMudanca = new Date(mudanca.timestamp || 0);
          if (dataMudanca >= inicioDia && dataMudanca <= fimDia) {
            mudancasHoje.push(mudanca);
            
            // Contar para o status de destino
            const key = mudanca.para;
            if (!contagemStatus[key]) {
              contagemStatus[key] = { total: 0, mudancas: [] };
            }
            contagemStatus[key].total++;
            contagemStatus[key].mudancas.push(`${mudanca.de} → ${mudanca.para}`);
          }
        });
      }
    });
    
    // HOT40 - Leads com contato marcado para o dia
    const hot40 = clientes.filter(c => 
      c.status === "AB Fone" && c.data_contato === dataSelecionada
    );
    
    // Mudanças de status detalhadas
    const mudancasFluxo = [
      { de: "Novo", para: "AB Fone" },
      { de: "AB Fone", para: "AB Visita" },
      { de: "AB Visita", para: "AB Fechamento" },
      { de: "AB Fechamento", para: "Delay" },
      { de: "AB Fechamento", para: "Análise" },
      { de: "Análise", para: "Venda Feita" },
      { de: "Venda Feita", para: "Entrega de Apólice" },
    ];
    
    const mudancasDetalhadas = mudancasFluxo.map(fluxo => ({
      ...fluxo,
      quantidade: mudancasHoje.filter(m => m.de === fluxo.de && m.para === fluxo.para).length
    }));
    
    // Mudanças para Encerrado (de qualquer status)
    const mudancasEncerrado = mudancasHoje.filter(m => m.para === "Encerrado").length;
    
    // Mudanças fora do fluxo
    const mudancasForaFluxo = mudancasHoje.filter(m => {
      const noFluxo = mudancasFluxo.some(f => f.de === m.de && f.para === m.para);
      return !noFluxo && m.para !== "Encerrado";
    }).length;

    const html = `
      <div id="relatorio-container" style="padding: 30px; font-family: Arial, sans-serif; background: white; width: 750px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #0096D8;">
          <h1 style="color: #0096D8; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">📊 APEX SHIELD</h1>
          <h2 style="color: #666; font-size: 18px; margin: 0 0 5px 0;">Relatório do Dia</h2>
          <p style="color: #666; margin: 0; font-size: 12px;">Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        <!-- Informações da Referência -->
        <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Data de referência:</strong> ${dataFormatada}</p>
        <p style="text-align: center; color: #999; font-size: 11px; margin-bottom: 20px;">${format(inicioDia, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} até ${format(fimDia, "HH:mm:ss", { locale: ptBR })}</p>

        <!-- Análise de Movimentação -->
        <div style="margin-bottom: 20px; background: #fff3cd; padding: 15px; border-radius: 8px; border: 2px solid #AFCB3A;">
          <h3 style="color: #AFCB3A; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">📈 Análise de Movimentação</h3>
          ${Object.keys(contagemStatus).length > 0 ? `
            ${Object.entries(contagemStatus).map(([status, info]) => `
              <div style="padding: 8px; background: white; margin-bottom: 5px; border-radius: 4px; border-left: 3px solid #0096D8; font-size: 13px;">
                <strong style="color: #0096D8;">${status}</strong> ${statusCount[status] || 0} agora tem ${statusCount[status] || 0} total de <strong style="color: #AFCB3A;">${info.total} movimentações</strong>
              </div>
            `).join('')}
          ` : '<p style="text-align: center; color: #666; font-size: 12px; margin: 0;">Nenhuma movimentação registrada hoje</p>'}
        </div>

        <!-- Variações por Status -->
        <div style="margin-bottom: 20px; background: #e7f3ff; padding: 15px; border-radius: 8px;">
          <h3 style="color: #0096D8; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">🔄 Variações por Status</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #0096D8; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">De</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Para</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${mudancasDetalhadas.map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f0f8ff'};">
                  <td style="padding: 6px; border: 1px solid #ddd;"><strong>${m.de}</strong></td>
                  <td style="padding: 6px; border: 1px solid #ddd;"><strong>${m.para}</strong></td>
                  <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 14px; color: #0096D8;"><strong>${m.quantidade}</strong></td>
                </tr>
              `).join('')}
              <tr style="background: #fff;">
                <td style="padding: 6px; border: 1px solid #ddd;"><strong>Qualquer Status</strong></td>
                <td style="padding: 6px; border: 1px solid #ddd;"><strong>Encerrado</strong></td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 14px; color: #0096D8;"><strong>${mudancasEncerrado}</strong></td>
              </tr>
              <tr style="background: #f0f8ff;">
                <td style="padding: 6px; border: 1px solid #ddd;"><strong>Fora do Fluxo</strong></td>
                <td style="padding: 6px; border: 1px solid #ddd;"><strong>Outros</strong></td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 14px; color: #0096D8;"><strong>${mudancasForaFluxo}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Resumo de Totais por Status -->
        <div style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <h3 style="color: #0096D8; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">📋 Resumo de Totais por Status</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #0096D8; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${statusList.map((status, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                  <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${status}</td>
                  <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 14px; color: #0096D8;"><strong>${statusCount[status]}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${hot40.length > 0 ? `
        <!-- HOT40 do Dia -->
        <div style="margin-bottom: 20px; background: #fff3cd; padding: 15px; border-radius: 8px; border: 2px solid #AFCB3A;">
          <h3 style="color: #AFCB3A; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">🔥 HOT40 - Contatos Agendados para Hoje</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #AFCB3A; color: white;">
                <th style="padding: 6px; border: 1px solid #ddd;">Nome</th>
                <th style="padding: 6px; border: 1px solid #ddd;">Telefone</th>
                <th style="padding: 6px; border: 1px solid #ddd;">Email</th>
              </tr>
            </thead>
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
        </div>
        ` : ''}

        <!-- Rodapé -->
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #0096D8; color: #666;">
          <p style="margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Apex Shield - CRM para Corretores de Seguro de Vida</p>
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
    
    const hoje = dataSelecionada || new Date().toISOString().split('T')[0];
    const hot40 = clientes.filter(c => c.status === "AB Fone" && c.data_contato === hoje);
    const dataHojeParsed = new Date(hoje + 'T12:00:00');

    const html = `
      <div id="relatorio-container" style="padding: 30px; font-family: Arial, sans-serif; background: white; width: 750px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #AFCB3A;">
          <h1 style="color: #AFCB3A; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">🔥 APEX SHIELD</h1>
          <h2 style="color: #666; font-size: 18px; margin: 0 0 5px 0;">Relatório HOT40</h2>
          <p style="color: #666; margin: 0; font-size: 12px;">Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        <!-- Título -->
        <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 20px;"><strong>Leads AB FONE com Data de Contato: ${format(dataHojeParsed, "dd/MM/yyyy", { locale: ptBR })}</strong></p>

        ${hot40.length === 0 ? `
          <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 10px;">
            <p style="color: #666; font-size: 16px;">Nenhum lead AB FONE com contato agendado para esta data.</p>
          </div>
        ` : `
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #AFCB3A; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">📋 Nome</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">📞 Celular</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">📧 Email</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">🏢 Empresa</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">💼 Cargo</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">💍 Est. Civil</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">👶 Filhos</th>
              </tr>
            </thead>
            <tbody>
              ${hot40.map((lead, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fffbf0'};">
                  <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${lead.nome}</td>
                  <td style="padding: 6px; border: 1px solid #ddd;">${lead.telefone ? `<a href="https://wa.me/55${lead.telefone.replace(/\D/g, '')}" style="color: #25D366; text-decoration: underline; font-weight: bold;">${lead.telefone}</a>` : '—'}</td>
                  <td style="padding: 6px; border: 1px solid #ddd; font-size: 10px;">${lead.email ? `<a href="mailto:${lead.email}" style="color: #0096D8; text-decoration: underline;">${lead.email}</a>` : '—'}</td>
                  <td style="padding: 6px; border: 1px solid #ddd;">${lead.empresa || '—'}</td>
                  <td style="padding: 6px; border: 1px solid #ddd;">${lead.cargo || '—'}</td>
                  <td style="padding: 6px; border: 1px solid #ddd;">${lead.estado_civil || '—'}</td>
                  <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${lead.filhos || '0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${hot40.some(l => l.observacoes && l.observacoes.length > 0) ? `
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #AFCB3A;">
              <h4 style="color: #0096D8; margin: 0 0 10px 0; font-size: 14px;">📝 Observações Recentes</h4>
              ${hot40.filter(l => l.observacoes && l.observacoes.length > 0).map((lead, idx) => `
                <div style="margin-bottom: 15px; ${idx > 0 ? 'border-top: 1px solid #eee; padding-top: 10px;' : ''}">
                  <strong style="color: #0096D8; font-size: 12px;">${lead.nome}:</strong>
                  ${lead.observacoes.slice(-2).map(obs => `
                    <div style="margin: 5px 0 5px 15px; padding: 6px; background: #f8f9fa; border-radius: 4px; font-size: 11px;">
                      <div style="color: #666; font-size: 10px; margin-bottom: 2px;">${obs.data}</div>
                      <div>${obs.texto}</div>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          ` : ''}
        `}

        <!-- Rodapé -->
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #AFCB3A; color: #666;">
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
                  ? 'Relatório completo com análise de movimentação, quantidade de leads por etapa e variações detalhadas de status.'
                  : 'Leads no status AB FONE com data de contato marcada para o dia selecionado.'}
              </p>
            </div>

            <div>
              <Label>Selecione a data {tipoRelatorio === 'resumo' ? 'de referência' : 'do contato'}:</Label>
              <Input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="mt-2"
              />
            </div>

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