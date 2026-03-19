import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as XLSX from 'xlsx';

export default function ImportExportLeads({ open, onClose, clientes, onImportSuccess }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nome': 'João Silva',
        'Telefone': '(11) 98765-4321',
        'Email': 'joao@email.com',
      },
      {
        'Nome': 'Maria Santos',
        'Telefone': '(21) 91234-5678',
        'Email': 'maria@email.com',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, 'ApexShield_Template_Importacao.xlsx');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Preparar dados para exportação
      const exportData = clientes.map(cliente => ({
        'Código': cliente.codigo || '',
        'Nome': cliente.nome || '',
        'Status': cliente.status || '',
        'Telefone': cliente.telefone || '',
        'Email': cliente.email || '',
        'Empresa': cliente.empresa || '',
        'Cargo': cliente.cargo || '',
        'Fonte Prospecção': cliente.fonte_prospeccao || '',
        'Renda': cliente.renda || '',
        'Patrimônio': cliente.patrimonio || '',
        'Idade': cliente.idade || '',
        'Profissão': cliente.profissao || '',
        'Estado Civil': cliente.estado_civil || '',
        'Regime Casamento': cliente.regime_casamento || '',
        'Filhos': cliente.filhos || '',
        'Data Nascimento': cliente.data_nascimento || '',
        'Altura': cliente.altura || '',
        'Peso': cliente.peso || '',
        'IMC': cliente.imc || '',
        'Fuma': cliente.fuma || '',
        'Anda Moto': cliente.anda_moto || '',
        'Plano Saúde': cliente.plano_saude || '',
        'Nome Plano Saúde': cliente.plano_saude_nome || '',
        'Valor Plano Saúde': cliente.valor_plano_saude || '',
        'Seguro Vida': cliente.seguro_vida || '',
        'Seguradora': cliente.seguro_vida_seguradora || '',
        'Valor Seguro Vida': cliente.valor_seguro_vida || '',
        'Custo Mensal Fixo': cliente.custo_mensal_fixo || '',
        'Data Contato': cliente.data_contato || '',
        'Agendar Visita': cliente.agendar_visita || '',
        'Data Cadastro': cliente.data_cadastro || '',
        'Número Indicações': cliente.num_indicacoes || '0'
      }));

      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");

      // Gerar arquivo
      XLSX.writeFile(wb, `ApexShield_Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      alert(`${clientes.length} leads exportados com sucesso!`);
    } catch (error) {
      alert(`Erro ao exportar: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Por favor, selecione um arquivo Excel");
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("O arquivo está vazio");
        setImporting(false);
        return;
      }

      // Mapear dados do Excel para o formato do sistema (apenas Nome, Telefone, Email)
      const leadsToImport = jsonData.map(row => ({
        nome: row['Nome'] || '',
        status: 'AB Fone',
        telefone: row['Telefone'] ? String(row['Telefone']) : '',
        email: row['Email'] || '',
        data_cadastro: new Date().toISOString().split('T')[0],
      })).filter(lead => lead.nome); // Obrigatório: apenas nome

      // Obter leads existentes e usuário atual
      const user = await base44.auth.me();
      const alias = gerarAlias(user?.email);
      const leadsExistentes = await base44.entities.Cliente.list();

      // Gerar códigos para todos os leads
      const userLeads = leadsExistentes.filter(l => l.created_by === user.email);
      const leadsComCodigo = leadsToImport.map((lead, index) => ({
        ...lead,
        codigo: `${alias}COD${String(userLeads.length + index + 1).padStart(2, '0')}`
      }));

      // Importar em lote usando bulkCreate (evita rate limit)
      let sucessos = 0;
      let erros = 0;
      let duplicados = [];
      let outrosErros = [];

      try {
        await base44.entities.Cliente.bulkCreate(leadsComCodigo);
        sucessos = leadsComCodigo.length;
      } catch (error) {
        console.error('Erro no bulk create:', error);
        // Se falhar o bulk, tentar um por um
        for (const lead of leadsComCodigo) {
          try {
            await base44.entities.Cliente.create(lead);
            sucessos++;
          } catch (error) {
            console.error(`Erro ao importar ${lead.nome}:`, error);
            outrosErros.push({ 
              nome: lead.nome, 
              erro: error.message || 'Erro desconhecido',
              telefone: lead.telefone 
            });
            erros++;
          }
        }
      }

      setImportResults({
        total: leadsToImport.length,
        sucessos,
        erros,
        duplicados: duplicados.length,
        duplicadosDetalhes: duplicados,
        outrosErrosDetalhes: outrosErros
      });

      if (onImportSuccess) {
        onImportSuccess();
      }

      if (erros === 0) {
        alert(`Importação concluída! ${sucessos} leads importados com sucesso.`);
      } else {
        alert(`Importação concluída com avisos:\n${sucessos} leads importados\n${erros} erros`);
      }

      setSelectedFile(null);
    } catch (error) {
      alert(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" style={{ color: '#0096D8' }} />
            Importar / Exportar Leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* EXPORTAR */}
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-700">
              <Download className="w-5 h-5" />
              Exportar Leads
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Baixe todos os seus leads em formato Excel (.xlsx) para backup ou análise externa.
            </p>
            <div className="bg-white p-3 rounded border border-green-200 mb-4">
              <p className="text-sm">
                <strong>Total de leads:</strong> {clientes.length}
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting || clientes.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  EXPORTAR TODOS OS LEADS
                </>
              )}
            </Button>
          </div>

          {/* IMPORTAR */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-700">
              <Upload className="w-5 h-5" />
              Importar Leads
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Carregue múltiplos leads de uma vez através de um arquivo Excel.
            </p>

            {/* Template de Importação */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border-2 border-indigo-200 mb-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-indigo-900 mb-1">Template de Importação</h4>
                  <p className="text-sm text-gray-700 mb-3">
                   Baixe o template com as 3 colunas: <strong>Nome</strong>, <strong>Telefone</strong> e <strong>Email</strong>. Preencha com seus dados e faça o upload.
                  </p>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="w-full bg-white border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Template CSV
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-300 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-700">
                  <strong>Importante:</strong> O arquivo deve ter apenas 3 colunas: <strong className="text-red-600">Nome</strong> (obrigatório), <strong>Telefone</strong> e <strong>Email</strong>. Todos os leads serão importados com status "AB Fone".
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Selecione o arquivo Excel:</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0])}
                  className="mt-2"
                />
                {selectedFile && (
                  <p className="text-sm text-blue-600 mt-2">
                    Arquivo selecionado: {selectedFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    IMPORTAR LEADS
                  </>
                )}
              </Button>
            </div>

            {importResults && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-bold text-sm mb-2">Resultado da Importação:</h4>
                <div className="space-y-1 text-sm">
                  <p>✅ Importados com sucesso: <strong className="text-green-600">{importResults.sucessos}</strong></p>
                  {importResults.duplicados > 0 && (
                    <p>⚠️ Duplicados (celular já existe): <strong className="text-orange-600">{importResults.duplicados}</strong></p>
                  )}
                  {(importResults.erros - (importResults.duplicados || 0)) > 0 && (
                    <p>❌ Outros erros: <strong className="text-red-600">{importResults.erros - (importResults.duplicados || 0)}</strong></p>
                  )}
                  <p>📊 Total processado: <strong>{importResults.total}</strong></p>
                </div>

                {/* Detalhamento de Duplicados */}
                {importResults.duplicadosDetalhes && importResults.duplicadosDetalhes.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200 max-h-40 overflow-y-auto">
                    <h5 className="font-bold text-xs text-orange-700 mb-2">📋 Leads Duplicados (já existem no sistema):</h5>
                    <div className="space-y-1 text-xs">
                      {importResults.duplicadosDetalhes.map((d, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-1 bg-white rounded">
                          <span className="text-orange-600">•</span>
                          <div>
                            <strong>{d.nome}</strong> - Tel: {d.telefone}
                            <div className="text-orange-600 text-[10px]">💡 Solução: Verifique se este lead já existe no sistema antes de importar</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalhamento de Outros Erros */}
                {importResults.outrosErrosDetalhes && importResults.outrosErrosDetalhes.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
                    <h5 className="font-bold text-xs text-red-700 mb-2">⚠️ Erros de Importação:</h5>
                    <div className="space-y-2 text-xs">
                      {importResults.outrosErrosDetalhes.map((e, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border border-red-100">
                          <div className="font-bold text-red-700">{e.nome}</div>
                          <div className="text-red-600 text-[10px] mt-1">❌ Erro: {e.erro}</div>
                          <div className="text-blue-600 text-[10px] mt-1">
                            💡 Solução: {
                              e.erro.includes('required') || e.erro.includes('obrigatório') ? 
                                'Verifique se todos os campos obrigatórios estão preenchidos (Nome é obrigatório)' :
                              e.erro.includes('format') || e.erro.includes('formato') ?
                                'Verifique se os dados estão no formato correto (datas, telefones, emails)' :
                              e.erro.includes('permission') || e.erro.includes('permissão') ?
                                'Verifique suas permissões de acesso' :
                                'Verifique os dados deste lead e tente novamente manualmente'
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}