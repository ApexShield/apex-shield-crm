import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as XLSX from 'xlsx';

// ── All entity fields mapped to Excel column names ──
const FIELD_MAP = [
  { field: "codigo", col: "Código" },
  { field: "nome", col: "Nome" },
  { field: "cpf", col: "CPF" },
  { field: "status", col: "Status" },
  { field: "is_cliente", col: "É Cliente" },
  { field: "data_conversao_cliente", col: "Data Conversão" },
  { field: "qualificacao", col: "Qualificação" },
  { field: "telefone", col: "Telefone" },
  { field: "email", col: "Email" },
  { field: "empresa", col: "Empresa" },
  { field: "cargo", col: "Cargo" },
  { field: "fonte_prospeccao", col: "Fonte Prospecção" },
  { field: "profissao", col: "Profissão" },
  { field: "data_nascimento", col: "Data Nascimento" },
  { field: "idade", col: "Idade" },
  { field: "estado_civil", col: "Estado Civil" },
  { field: "regime_casamento", col: "Regime Casamento" },
  { field: "data_casamento", col: "Data Casamento" },
  { field: "filhos", col: "Filhos" },
  { field: "altura", col: "Altura" },
  { field: "peso", col: "Peso" },
  { field: "imc", col: "IMC" },
  { field: "fuma", col: "Fuma" },
  { field: "anda_moto", col: "Anda Moto" },
  { field: "renda", col: "Renda" },
  { field: "endereco", col: "Endereço" },
  { field: "data_cadastro", col: "Data Cadastro" },
  { field: "data_contato", col: "Data Contato" },
  { field: "agendar_visita", col: "Agendar Visita" },
  // Saúde e Seguros
  { field: "plano_saude", col: "Plano Saúde" },
  { field: "plano_saude_nome", col: "Nome Plano Saúde" },
  { field: "valor_plano_saude", col: "Valor Plano Saúde" },
  { field: "seguro_vida", col: "Seguro Vida" },
  { field: "seguro_vida_seguradora", col: "Seguradora" },
  { field: "valor_seguro_vida", col: "Valor Seguro Vida" },
  // Custos Fixos
  { field: "custo_agua", col: "Custo Água" },
  { field: "custo_energia", col: "Custo Energia" },
  { field: "custo_internet", col: "Custo Internet" },
  { field: "custo_gas", col: "Custo Gás" },
  { field: "custo_aluguel", col: "Custo Aluguel" },
  { field: "custo_escola", col: "Custo Escola" },
  { field: "custo_plano_saude_fixo", col: "Custo Plano Saúde Fixo" },
  { field: "custo_transporte", col: "Custo Transporte" },
  { field: "custo_alimentacao", col: "Custo Alimentação" },
  { field: "custo_cartao_credito", col: "Custo Cartão Crédito" },
  { field: "custo_outros_fixos", col: "Custo Outros Fixos" },
  // Custos Variáveis
  { field: "custo_lazer", col: "Custo Lazer" },
  { field: "custo_hobbies", col: "Custo Hobbies" },
  { field: "custo_vestuario", col: "Custo Vestuário" },
  { field: "custo_viagens", col: "Custo Viagens" },
  { field: "custo_outros_variaveis", col: "Custo Outros Variáveis" },
  // Patrimônio
  { field: "patrimonio_imoveis", col: "Patrimônio Imóveis" },
  { field: "patrimonio_veiculos", col: "Patrimônio Veículos" },
  { field: "patrimonio_outros", col: "Patrimônio Outros" },
  { field: "patrimonio_investimentos", col: "Patrimônio Investimentos" },
  { field: "patrimonio_poupanca", col: "Patrimônio Poupança" },
  { field: "patrimonio_previdencia", col: "Patrimônio Previdência" },
  { field: "num_indicacoes", col: "Num Indicações" },
];

// Apólice fields (nested in dados_apolice)
const APOLICE_FIELDS = [
  "produto", "numero_apolice", "numero_proposta", "seguradora", "data_assinatura",
  "data_inicio_vigencia", "data_fim_vigencia", "forma_pagamento",
  "periodicidade", "premio_total", "premio_mensal", "premio_anual",
  "capital_segurado_total", "classe_ajuste", "tipo_cobertura",
  "cobertura_morte", "cobertura_invalidez", "cobertura_doencas_graves",
  "cobertura_diaria_incapacidade", "cobertura_funeral", "cobertura_pensao",
  "cobertura_educacao", "cobertura_outros",
  "beneficiario_1_nome", "beneficiario_1_parentesco", "beneficiario_1_percentual",
  "beneficiario_2_nome", "beneficiario_2_parentesco", "beneficiario_2_percentual",
  "beneficiario_3_nome", "beneficiario_3_parentesco", "beneficiario_3_percentual",
];

const STATUS_VALIDOS = ['Novo', 'AB Fone', 'AB Visita', 'AB Fechamento', 'Delay', 'Análise', 'Venda Feita', 'Entrega de Apólice', 'Encerrado'];

const gerarAlias = (email) => {
  if (!email) return "USER";
  const parts = email.split('@')[0].split(/[._-]/);
  let alias = "";
  parts.forEach(part => {
    if (/\d/.test(part)) alias += part.match(/\d+/)[0];
    else alias += part.charAt(0).toUpperCase();
  });
  return alias.substring(0, 6);
};

// ── Serialize complex fields for export ──
function serializeArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "";
  return JSON.stringify(arr);
}

function parseJsonSafe(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

export default function ImportExportLeads({ open, onClose, clientes, onImportSuccess, mode = "lead" }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const isClienteMode = mode === "cliente";
  const label = isClienteMode ? "Clientes" : "Leads";

  // ── EXPORT ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = clientes.map(c => {
        const row = {};
        // Basic fields
        FIELD_MAP.forEach(({ field, col }) => {
          let val = c[field];
          if (val === null || val === undefined) val = "";
          if (typeof val === "boolean") val = val ? "SIM" : "NÃO";
          row[col] = String(val);
        });
        // Filhos info (JSON)
        row["Filhos Info (JSON)"] = serializeArray(c.filhos_info);
        // Indicações (JSON)
        row["Indicações (JSON)"] = serializeArray(c.indicacoes);
        // Observações (JSON)
        row["Observações (JSON)"] = serializeArray(c.observacoes);
        // Histórico Status (JSON)
        row["Histórico Status (JSON)"] = serializeArray(c.historico_status);
        // Apólice fields
        const ap = c.dados_apolice || {};
        APOLICE_FIELDS.forEach(f => {
          const colName = "Apólice_" + f;
          row[colName] = ap[f] != null ? String(ap[f]) : "";
        });
        // Metadata
        row["created_by"] = c.created_by || "";
        row["created_date"] = c.created_date || "";
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, label);
      XLSX.writeFile(wb, `ApexShield_${label}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert(`${clientes.length} ${label.toLowerCase()} exportados com sucesso!`);
    } catch (error) {
      alert(`Erro ao exportar: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // ── IMPORT ──
  const handleImport = async () => {
    if (!selectedFile) { alert("Selecione um arquivo"); return; }
    setImporting(true);
    setImportResults(null);
    setValidationErrors([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) { alert("O arquivo está vazio"); setImporting(false); return; }

      const user = await base44.auth.me();
      const alias = gerarAlias(user?.email);
      const leadsExistentes = await base44.entities.Cliente.list();
      const userLeads = leadsExistentes.filter(l => l.created_by === user.email);
      let nextNum = userLeads.length + 1;

      const errors = [];
      const leadsToImport = [];

      jsonData.forEach((row, idx) => {
        const rowNum = idx + 2; // Excel row (1-indexed header + data)
        const record = {};

        // Map basic fields
        FIELD_MAP.forEach(({ field, col }) => {
          let val = row[col];
          if (val === undefined || val === null || String(val).trim() === "") return;
          val = String(val).trim();
          // Boolean fields
          if (field === "is_cliente") {
            record[field] = val === "SIM" || val === "true" || val === "1";
            return;
          }
          record[field] = val;
        });

        // Filhos info
        const filhosJson = parseJsonSafe(row["Filhos Info (JSON)"]);
        if (filhosJson) record.filhos_info = filhosJson;

        // Indicações
        const indJson = parseJsonSafe(row["Indicações (JSON)"]);
        if (indJson) record.indicacoes = indJson;

        // Observações
        const obsJson = parseJsonSafe(row["Observações (JSON)"]);
        if (obsJson) record.observacoes = obsJson;

        // Histórico Status
        const histJson = parseJsonSafe(row["Histórico Status (JSON)"]);
        if (histJson) record.historico_status = histJson;

        // Apólice
        const apolice = {};
        let hasApolice = false;
        APOLICE_FIELDS.forEach(f => {
          const colName = "Apólice_" + f;
          const val = row[colName];
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            apolice[f] = String(val).trim();
            hasApolice = true;
          }
        });
        if (hasApolice) record.dados_apolice = apolice;

        // Validations
        const rowErrors = [];
        if (!record.nome) rowErrors.push("Nome é obrigatório");

        // Status validation
        if (record.status && !STATUS_VALIDOS.includes(record.status)) {
          rowErrors.push(`Status "${record.status}" inválido`);
        }
        if (!record.status) record.status = "Novo";

        // Data cadastro
        if (!record.data_cadastro) record.data_cadastro = new Date().toISOString().split('T')[0];

        // Client mode validations
        if (isClienteMode) {
          if (!record.email) rowErrors.push("Email é obrigatório para clientes");
          if (!record.telefone) rowErrors.push("Telefone é obrigatório para clientes");
          // Auto-mark as client
          record.is_cliente = true;
          if (!record.data_conversao_cliente) record.data_conversao_cliente = new Date().toISOString();
        }

        // Generate code if missing
        if (!record.codigo) {
          record.codigo = `${alias}COD${String(nextNum).padStart(2, '0')}`;
          nextNum++;
        }

        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, nome: record.nome || "(sem nome)", errors: rowErrors });
        } else {
          leadsToImport.push(record);
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      }

      // Import valid records
      let sucessos = 0;
      let erros = 0;
      const outrosErros = [];

      if (leadsToImport.length > 0) {
        try {
          await base44.entities.Cliente.bulkCreate(leadsToImport);
          sucessos = leadsToImport.length;
        } catch (error) {
          console.error('Bulk create error, trying individually:', error);
          for (const lead of leadsToImport) {
            try {
              await base44.entities.Cliente.create(lead);
              sucessos++;
            } catch (err) {
              outrosErros.push({ nome: lead.nome, erro: err.message });
              erros++;
            }
          }
        }
      }

      setImportResults({
        total: jsonData.length,
        sucessos,
        erros: erros + errors.length,
        validationSkipped: errors.length,
        outrosErrosDetalhes: outrosErros
      });

      if (onImportSuccess) onImportSuccess();
      setSelectedFile(null);
    } catch (error) {
      alert(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const row1 = {};
    FIELD_MAP.forEach(({ col }) => { row1[col] = ""; });
    row1["Nome"] = "João Silva";
    row1["Telefone"] = "(11) 98765-4321";
    row1["Email"] = "joao@email.com";
    row1["Status"] = "AB Fone";
    row1["Data Cadastro"] = "2025-01-15";
    row1["Filhos Info (JSON)"] = "";
    row1["Indicações (JSON)"] = "";
    row1["Observações (JSON)"] = "";
    row1["Histórico Status (JSON)"] = "";
    APOLICE_FIELDS.forEach(f => { row1["Apólice_" + f] = ""; });

    const ws = XLSX.utils.json_to_sheet([row1]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `ApexShield_Template_${label}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Importar / Exportar {label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* EXPORTAR */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2 text-green-700">
              <Download className="w-4 h-4" /> Exportar {label}
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Exporta <strong>TODOS os dados</strong> incluindo apólice, custos, patrimônio, indicações e observações.
            </p>
            <div className="bg-white p-2 rounded border border-green-200 mb-2 text-xs">
              <strong>Total:</strong> {clientes.length} {label.toLowerCase()}
            </div>
            <Button onClick={handleExport} disabled={exporting || clientes.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-sm">
              {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando...</> : <><Download className="w-4 h-4 mr-2" /> EXPORTAR TODOS OS {label.toUpperCase()}</>}
            </Button>
          </div>

          {/* IMPORTAR */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2 text-blue-700">
              <Upload className="w-4 h-4" /> Importar {label}
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Importa todos os dados da planilha exportada. Use o template para novos registros.
            </p>

            {/* Template */}
            <div className="bg-indigo-50 p-2 rounded border border-indigo-200 mb-2">
              <p className="text-xs text-gray-700 mb-1.5">
                <strong>Template:</strong> Baixe o modelo com todas as colunas.
              </p>
              <Button onClick={handleDownloadTemplate} variant="outline" size="sm"
                className="w-full bg-white border-indigo-300 text-indigo-700 text-xs">
                <Download className="w-3 h-3 mr-1" /> Baixar Template
              </Button>
            </div>

            {/* Aviso obrigatórios */}
            <div className="bg-yellow-50 p-2 rounded border border-yellow-300 mb-2">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-gray-700">
                  <strong>Obrigatórios:</strong> <span className="text-red-600 font-bold">Nome</span>
                  {isClienteMode && <>, <span className="text-red-600 font-bold">Email</span>, <span className="text-red-600 font-bold">Telefone</span></>}
                  . Campos JSON (indicações, observações, etc) são importados automaticamente da exportação.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs">Selecione o arquivo Excel:</Label>
                <Input type="file" accept=".xlsx,.xls" onChange={(e) => { setSelectedFile(e.target.files?.[0]); setImportResults(null); setValidationErrors([]); }} className="mt-1" />
              </div>
              <Button onClick={handleImport} disabled={!selectedFile || importing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm">
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</> : <><Upload className="w-4 h-4 mr-2" /> IMPORTAR {label.toUpperCase()}</>}
              </Button>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
                <h5 className="font-bold text-xs text-red-700 mb-1">⚠️ Linhas com erros ({validationErrors.length}):</h5>
                <div className="space-y-1 text-[11px]">
                  {validationErrors.map((v, i) => (
                    <div key={i} className="p-1.5 bg-white rounded border border-red-100">
                      <div className="font-bold text-red-700">Linha {v.row}: {v.nome}</div>
                      {v.errors.map((e, j) => (
                        <div key={j} className="text-red-600">❌ {e}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="mt-3 p-2 bg-white rounded border text-xs space-y-1">
                <h4 className="font-bold text-sm">Resultado:</h4>
                <p><CheckCircle2 className="w-3 h-3 inline text-green-500 mr-1" />Importados: <strong className="text-green-600">{importResults.sucessos}</strong></p>
                {importResults.validationSkipped > 0 && (
                  <p><AlertCircle className="w-3 h-3 inline text-orange-500 mr-1" />Pulados (erros validação): <strong className="text-orange-600">{importResults.validationSkipped}</strong></p>
                )}
                {importResults.outrosErrosDetalhes?.length > 0 && (
                  <div className="mt-1 p-1.5 bg-red-50 rounded border border-red-100 max-h-28 overflow-y-auto">
                    {importResults.outrosErrosDetalhes.map((e, i) => (
                      <div key={i} className="text-red-600 text-[11px]">❌ {e.nome}: {e.erro}</div>
                    ))}
                  </div>
                )}
                <p>📊 Total processado: <strong>{importResults.total}</strong></p>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={onClose} className="w-full text-sm">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}