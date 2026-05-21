import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Trash2, FileText, Shield, Users, DollarSign, Heart, Activity, Save, XCircle, Eraser, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const formatCurrency = (value) => {
  const numbers = value.replace(/\D/g, "");
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function ApoliceDialog({ open, onClose, cliente, onSave, isLoading }) {
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    produto: "",
    capital_morte: "",
    tipo_cobertura: "",
    periodo_cobertura: "",
    frequencia_pagamento: "",
    plano_singular: "",
    pessoas_asseguradas: "",
    data_implantacao: "",
    
    // Prêmio e Beneficiários
    total_premio_iof: "",
    beneficiarios: [],
    
    // Prêmios das coberturas
    premio_morte: "",
    premio_morte_decrescente: "",
    premio_morte_acidental: "",
    premio_invalidez_acidental: "",
    premio_invalidez_majorada: "",
    premio_amparo_funeral: "",
    premio_cirurgias: "",
    premio_ipdf: "",
    premio_doencas_graves_mais: "",
    premio_doencas_graves_cirurgicos: "",
    premio_doencas_graves_cirurgicos_premium: "",
    premio_fratura_ossea: "",
    premio_dit: "",
    premio_dih: "",
    premio_temporaria_morte: "",
    premio_funeral_individual: "",
    premio_doencas_incapacitantes: "",
    
    // Coberturas
    morte_decrescente_capital: "",
    morte_decrescente_periodo: "",
    
    morte_acidental_capital: "",
    invalidez_acidental_capital: "",
    invalidez_acidental_majorada_capital: "",
    
    amparo_funeral_cobertura: "",
    amparo_funeral_capital: "",
    
    cirurgias_capital: "",
    ipdf_capital: "",
    
    doencas_graves_mais_capital: "",
    doencas_graves_cirurgicos_capital: "",
    doencas_graves_cirurgicos_premium_capital: "",
    
    fratura_ossea_capital: "",
    
    dit_cobertura: "",
    dit_franquia: "",
    dit_renda: "",
    dit_diaria: "",
    
    dih_capital: "",
    
    temporaria_morte_capital: "",
    temporaria_morte_vigencia: "",
    temporaria_morte_periodo: "",
    
    funeral_individual_capital: "",
    funeral_individual_conjuge: "",
    
    doencas_incapacitantes_cobertura: "",
    doencas_incapacitantes_renda: "",
    doencas_incapacitantes_capital: "",
    
    total_premio_iof: "",
    beneficiarios: [],
    premio_morte: "",
    premio_morte_decrescente: "",
    premio_morte_acidental: "",
    premio_invalidez_acidental: "",
    premio_invalidez_majorada: "",
    premio_amparo_funeral: "",
    premio_cirurgias: "",
    premio_ipdf: "",
    premio_doencas_graves_mais: "",
    premio_doencas_graves_cirurgicos: "",
    premio_doencas_graves_cirurgicos_premium: "",
    premio_fratura_ossea: "",
    premio_dit: "",
    premio_dih: "",
    premio_temporaria_morte: "",
    premio_funeral_individual: "",
    premio_doencas_incapacitantes: ""
  });

  useEffect(() => {
    if (cliente?.dados_apolice) {
      setFormData({ ...formData, ...cliente.dados_apolice });
    } else {
      // Reset form
      setFormData({
        produto: "",
        capital_morte: "",
        tipo_cobertura: "",
        periodo_cobertura: "",
        frequencia_pagamento: "",
        plano_singular: "",
        pessoas_asseguradas: "",
        data_implantacao: "",
        morte_decrescente_capital: "",
        morte_decrescente_periodo: "",
        morte_acidental_capital: "",
        invalidez_acidental_capital: "",
        invalidez_acidental_majorada_capital: "",
        amparo_funeral_cobertura: "",
        amparo_funeral_capital: "",
        cirurgias_capital: "",
        ipdf_capital: "",
        doencas_graves_mais_capital: "",
        doencas_graves_cirurgicos_capital: "",
        doencas_graves_cirurgicos_premium_capital: "",
        fratura_ossea_capital: "",
        dit_cobertura: "",
        dit_franquia: "",
        dit_renda: "",
        dit_diaria: "",
        dih_capital: "",
        temporaria_morte_capital: "",
        temporaria_morte_vigencia: "",
        temporaria_morte_periodo: "",
        funeral_individual_capital: "",
        funeral_individual_conjuge: "",
        doencas_incapacitantes_cobertura: "",
        doencas_incapacitantes_renda: "",
        doencas_incapacitantes_capital: ""
      });
    }
  }, [cliente, open]);

  const handleCurrencyChange = (field, value) => {
    setFormData({ ...formData, [field]: formatCurrency(value) });
  };

  const addBeneficiario = () => {
    setFormData({
      ...formData,
      beneficiarios: [...(formData.beneficiarios || []), { nome: "", parentesco: "", data_nascimento: "", distribuicao: "" }]
    });
  };

  const removeBeneficiario = (index) => {
    const newBeneficiarios = formData.beneficiarios.filter((_, i) => i !== index);
    setFormData({ ...formData, beneficiarios: newBeneficiarios });
  };

  const updateBeneficiario = (index, field, value) => {
    const newBeneficiarios = [...formData.beneficiarios];
    newBeneficiarios[index][field] = value;
    setFormData({ ...formData, beneficiarios: newBeneficiarios });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    toast.info("Processando arquivo...");

    try {
      // 1. Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Extrair dados do arquivo com schema detalhado
      const schema = {
        type: "object",
        properties: {
          cpf: { type: "string", description: "CPF do segurado" },
          data_apolice: { type: "string", description: "Data de início de vigência / data da apólice / data de emissão no formato DD/MM/YYYY. Pode aparecer como 'Início de Vigência', 'Data de Emissão', 'Vigência a partir de' ou similar." },
          produto_nome: { type: "string", description: "Nome do produto/seguro exatamente como aparece no documento (ex: VIDA SEGURA, Vida Singular, Vida Total, Vida Total Singular). Geralmente está no topo da primeira página." },
          plano_codigo: { type: "string", description: "Código do plano se houver (ex: VS20, VT10, VSG25)" },
          periodicidade_premio: { type: "string", description: "Periodicidade de pagamento dos prêmios - Mensal ou Anual" },
          total_premio_iof: { type: "string", description: "Valor Total (R$) da linha 'Total' na tabela de prêmios por coberturas, que é a soma de todos os prêmios totais + IOF" },
          
          beneficiarios: {
            type: "array",
            description: "Lista de TODOS os beneficiários. Extrair TODOS os campos de cada beneficiário da tabela de beneficiários.",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome completo do beneficiário" },
                parentesco: { type: "string", description: "Parentesco exato como aparece no documento (ex: Filha, Filho (a), Cônjuge, Pai, Mãe)" },
                data_nascimento: { type: "string", description: "Data de nascimento no formato DD/MM/YYYY" },
                percentual: { type: "string", description: "Percentual de participação, apenas o número sem % (ex: 20, 50, 15)" }
              }
            }
          },
          
          coberturas_capitais: {
            type: "array",
            description: "Extrair da tabela 'Cobertura(s) e capital(is) segurado(s)': cada linha com o nome da cobertura, capital segurado e período de vigência.",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome da cobertura exatamente como no documento" },
                capital_segurado: { type: "string", description: "Valor do capital segurado (R$)" },
                periodo_vigencia: { type: "string", description: "Período de vigência (ex: '25 Anos', '5 Anos')" }
              }
            }
          },
          
          coberturas_premios: {
            type: "array",
            description: "Extrair da tabela 'Prêmio(s) por cobertura(s)': cada linha com o nome da cobertura e o valor da coluna 'Prêmio total (R$)' que inclui IOF.",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome da cobertura" },
                premio_total: { type: "string", description: "Valor da coluna 'Prêmio total (R$)' que é o prêmio líquido + IOF" },
                prazo_pagamento: { type: "string", description: "Prazo de pagamento do prêmio (ex: '25 Anos', '5 Anos')" }
              }
            }
          }
        }
      };

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === "success" && result.output) {
        const data = result.output;
        console.log("Dados extraídos da apólice:", JSON.stringify(data, null, 2));
        
        // ── Helpers ──
        const normalizarValor = (val) => {
          if (!val) return "";
          if (val.includes("R$")) return val.trim();
          const numStr = val.replace(/[^\d,\.]/g, "");
          let num;
          if (numStr.includes(",")) {
            num = parseFloat(numStr.replace(/\./g, "").replace(",", "."));
          } else {
            num = parseFloat(numStr);
          }
          if (isNaN(num)) return val;
          return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        };
        
        const matchSelect = (rawValue, options) => {
          if (!rawValue) return "";
          const numStr = rawValue.replace(/[^\d,\.]/g, "");
          let num;
          if (numStr.includes(",")) {
            num = parseFloat(numStr.replace(/\./g, "").replace(",", "."));
          } else {
            num = parseFloat(numStr);
          }
          if (isNaN(num)) return "";
          let best = "";
          let bestDiff = Infinity;
          for (const opt of options) {
            const optNum = parseFloat(opt.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(",", "."));
            if (isNaN(optNum)) continue;
            const diff = Math.abs(optNum - num);
            if (diff < bestDiff) { bestDiff = diff; best = opt; }
          }
          return bestDiff <= (num * 0.05 + 1) ? best : "";
        };
        
        const strip = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        // ── Produto ──
        let produtoFinal = "";
        const prodNome = strip(data.produto_nome || "");
        if (prodNome.includes("vida segura")) produtoFinal = "Vida Segura";
        else if (prodNome.includes("vida total singular") || prodNome.includes("total singular")) produtoFinal = "Vida Total Singular";
        else if (prodNome.includes("vida singular")) produtoFinal = "Vida Singular";
        else if (prodNome.includes("vida total")) produtoFinal = "Vida Total";
        // Fallback por código do plano
        if (!produtoFinal && data.plano_codigo) {
          const pc = data.plano_codigo.toUpperCase();
          if (pc.includes("VSG")) produtoFinal = "Vida Segura";
          else if (pc.includes("VTS")) produtoFinal = "Vida Total Singular";
          else if (pc.includes("VS")) produtoFinal = "Vida Singular";
          else if (pc.includes("VT")) produtoFinal = "Vida Total";
        }
        
        // ── Mesclar tabelas de capitais e prêmios por nome ──
        const cobMap = {};
        (data.coberturas_capitais || []).forEach(c => {
          const key = strip(c.nome);
          if (!cobMap[key]) cobMap[key] = { nome: c.nome };
          cobMap[key].capital = c.capital_segurado;
          cobMap[key].vigencia = c.periodo_vigencia;
        });
        (data.coberturas_premios || []).forEach(c => {
          const key = strip(c.nome);
          if (!cobMap[key]) cobMap[key] = { nome: c.nome };
          cobMap[key].premio = c.premio_total;
          cobMap[key].prazo = c.prazo_pagamento;
        });
        
        // ── Mapear coberturas ──
        const formUpdates = {};
        let capitalMorte = "";
        let premioMorte = "";
        let vigenciaPrincipal = "";
        
        Object.values(cobMap).forEach(cob => {
          const n = strip(cob.nome || "");
          
          if (n.includes("morte") && n.includes("decrescente")) {
            if (cob.capital) formUpdates.morte_decrescente_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_morte_decrescente = normalizarValor(cob.premio);
            if (cob.vigencia) { const m = cob.vigencia.match(/\d+/); if (m) formUpdates.morte_decrescente_periodo = m[0]; }
          }
          else if (n.includes("morte") && n.includes("acidental")) {
            if (cob.capital) formUpdates.morte_acidental_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_morte_acidental = normalizarValor(cob.premio);
          }
          else if (n.includes("invalidez") && n.includes("majorada")) {
            if (cob.capital) formUpdates.invalidez_acidental_majorada_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_invalidez_majorada = normalizarValor(cob.premio);
          }
          else if (n.includes("invalidez") && (n.includes("acident") || n.includes("parcial"))) {
            if (cob.capital) formUpdates.invalidez_acidental_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_invalidez_acidental = normalizarValor(cob.premio);
          }
          else if (n.includes("amparo") && n.includes("funeral")) {
            const amparoCapOpts = ["R$ 7.000,00", "R$ 10.000,00", "R$ 15.000,00", "R$ 20.000,00"];
            if (cob.capital) formUpdates.amparo_funeral_capital = matchSelect(cob.capital, amparoCapOpts);
            if (cob.premio) formUpdates.premio_amparo_funeral = normalizarValor(cob.premio);
            // Detectar tipo (Familiar, Individual, etc)
            if (n.includes("familiar") && n.includes("pais")) formUpdates.amparo_funeral_cobertura = "Familiar + Pais";
            else if (n.includes("familiar")) formUpdates.amparo_funeral_cobertura = "Familiar";
            else if (n.includes("conjuge") || n.includes("cônjuge")) formUpdates.amparo_funeral_cobertura = "Individual + Conjuge";
            else if (n.includes("individual")) formUpdates.amparo_funeral_cobertura = "Individual";
          }
          else if (n.includes("cirurgia") && !n.includes("doenca") && !n.includes("grave")) {
            if (cob.capital) formUpdates.cirurgias_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_cirurgias = normalizarValor(cob.premio);
          }
          else if (n.includes("ipdf")) {
            if (cob.capital) formUpdates.ipdf_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_ipdf = normalizarValor(cob.premio);
          }
          else if (n.includes("doenca") && n.includes("grave") && n.includes("premium")) {
            if (cob.capital) formUpdates.doencas_graves_cirurgicos_premium_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_doencas_graves_cirurgicos_premium = normalizarValor(cob.premio);
          }
          else if (n.includes("doenca") && n.includes("grave") && (n.includes("cirurgic") || n.includes("procedimento"))) {
            if (cob.capital) formUpdates.doencas_graves_cirurgicos_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_doencas_graves_cirurgicos = normalizarValor(cob.premio);
          }
          else if (n.includes("doenca") && n.includes("grave")) {
            if (cob.capital) formUpdates.doencas_graves_mais_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_doencas_graves_mais = normalizarValor(cob.premio);
          }
          else if (n.includes("fratura") && (n.includes("ossea") || n.includes("óssea"))) {
            if (cob.capital) formUpdates.fratura_ossea_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_fratura_ossea = normalizarValor(cob.premio);
          }
          else if (n.includes("diaria") && n.includes("incapacidade")) {
            if (cob.premio) formUpdates.premio_dit = normalizarValor(cob.premio);
            if (cob.capital) formUpdates.dit_diaria = normalizarValor(cob.capital);
          }
          else if (n.includes("diaria") && n.includes("internacao")) {
            const dihOpts = ["R$ 200,00", "R$ 250,00", "R$ 300,00", "R$ 350,00", "R$ 450,00", "R$ 550,00", "R$ 750,00", "R$ 1.000,00", "R$ 2.000,00", "R$ 3.000,00"];
            if (cob.capital) formUpdates.dih_capital = matchSelect(cob.capital, dihOpts);
            if (cob.premio) formUpdates.premio_dih = normalizarValor(cob.premio);
          }
          else if (n.includes("temporaria") && n.includes("morte")) {
            if (cob.capital) formUpdates.temporaria_morte_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_temporaria_morte = normalizarValor(cob.premio);
            const vig = cob.vigencia || cob.prazo || "";
            const vm = vig.match(/\d+/);
            if (vm) {
              formUpdates.temporaria_morte_periodo = vm[0];
              formUpdates.temporaria_morte_vigencia = ["75", "65", "99"].includes(vm[0]) ? "Idade Alcançada" : "Fixado";
            }
          }
          else if (n.includes("funeral") && n.includes("individual")) {
            const funOpts = ["R$ 10.000,00", "R$ 15.000,00", "R$ 20.000,00"];
            if (cob.capital) formUpdates.funeral_individual_capital = matchSelect(cob.capital, funOpts);
            if (cob.premio) formUpdates.premio_funeral_individual = normalizarValor(cob.premio);
          }
          else if (n.includes("doenca") && n.includes("incapacitante")) {
            if (cob.capital) formUpdates.doencas_incapacitantes_capital = normalizarValor(cob.capital);
            if (cob.premio) formUpdates.premio_doencas_incapacitantes = normalizarValor(cob.premio);
          }
          // Morte principal (apenas "morte" sem qualificadores)
          else if (n.includes("morte") && !n.includes("decrescente") && !n.includes("acidental") && !n.includes("temporaria")) {
            capitalMorte = cob.capital || "";
            premioMorte = cob.premio || "";
            vigenciaPrincipal = cob.vigencia || cob.prazo || "";
          }
        });
        
        // ── Vigência principal → tipo e período ──
        let tipoCobertura = "";
        let periodoCobertura = "";
        const vigMatch = (vigenciaPrincipal || "").match(/\d+/);
        if (vigMatch) {
          periodoCobertura = vigMatch[0];
          tipoCobertura = ["75", "65", "99"].includes(vigMatch[0]) ? "Idade Alcançada" : "Fixado";
        }
        
        // ── Beneficiários ──
        const parentescoMap = {
          "conjuge": "Cônjuge", "cônjuge": "Cônjuge", "companheiro": "Cônjuge", "companheira": "Cônjuge",
          "esposo": "Cônjuge", "esposa": "Cônjuge", "marido": "Cônjuge",
          "filho": "Filho(a)", "filha": "Filho(a)", "filho(a)": "Filho(a)", "filho (a)": "Filho(a)",
          "pai": "Pai", "mãe": "Mãe", "mae": "Mãe",
          "irmão": "Irmão(ã)", "irmã": "Irmão(ã)", "irmao": "Irmão(ã)", "irma": "Irmão(ã)",
          "sobrinho": "Sobrinho(a)", "sobrinha": "Sobrinho(a)",
        };
        const normParentesco = (p) => {
          if (!p) return "";
          return parentescoMap[p.toLowerCase().trim()] || "Outro";
        };
        const normData = (d) => {
          if (!d) return "";
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          const m = d.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
          if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
          return d;
        };
        
        let beneficiarios = [];
        if (data.beneficiarios?.length > 0) {
          beneficiarios = data.beneficiarios.map(b => ({
            nome: (b.nome || "").toUpperCase(),
            parentesco: normParentesco(b.parentesco),
            data_nascimento: normData(b.data_nascimento),
            distribuicao: (b.percentual || b.distribuicao || "").replace(/[^0-9]/g, "")
          }));
        }
        
        // ── Frequência ──
        let freq = "";
        if (data.periodicidade_premio) {
          const fp = data.periodicidade_premio.toLowerCase();
          if (fp.includes("mensal")) freq = "Mensal";
          else if (fp.includes("anual")) freq = "Anual";
        }
        
        console.log("Produto:", produtoFinal, "| Vigência:", periodoCobertura, tipoCobertura);
        console.log("Coberturas mapeadas:", JSON.stringify(formUpdates, null, 2));
        console.log("Beneficiários:", JSON.stringify(beneficiarios, null, 2));
        
        // Data de implantação
        let dataImplantacao = "";
        if (data.data_apolice) {
          dataImplantacao = normData(data.data_apolice);
        }
        
        // Mesclar dados extraídos
        setFormData(prev => ({
          ...prev,
          produto: produtoFinal || prev.produto,
          data_implantacao: dataImplantacao || prev.data_implantacao,
          tipo_cobertura: tipoCobertura || prev.tipo_cobertura,
          periodo_cobertura: periodoCobertura || prev.periodo_cobertura,
          frequencia_pagamento: freq || prev.frequencia_pagamento,
          capital_morte: capitalMorte ? normalizarValor(capitalMorte) : prev.capital_morte,
          premio_morte: premioMorte ? normalizarValor(premioMorte) : prev.premio_morte,
          total_premio_iof: data.total_premio_iof ? normalizarValor(data.total_premio_iof) : prev.total_premio_iof,
          beneficiarios: beneficiarios.length > 0 ? beneficiarios : prev.beneficiarios,
          ...formUpdates
        }));
        
        // Atualizar CPF do cliente se extraído
        if (data.cpf && cliente?.id) {
          try {
            // Formatar CPF
            const cpfNumeros = data.cpf.replace(/\D/g, "").slice(0, 11);
            const cpfFormatado = cpfNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/-$/, "");
            
            await base44.entities.Cliente.update(cliente.id, { cpf: cpfFormatado });
            toast.success("Dados extraídos e CPF atualizado no cadastro!");
          } catch (err) {
            console.error("Erro ao atualizar CPF:", err);
            toast.success("Dados extraídos! (CPF não pôde ser atualizado)");
          }
        } else {
          toast.success("Dados extraídos e preenchidos automaticamente!");
        }
      } else {
        toast.error("Erro ao extrair dados: " + (result.details || "Formato inválido"));
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao processar arquivo: " + error.message);
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ dados_apolice: formData });
  };

  const handleLimpar = () => {
    setFormData({
      produto: "",
      capital_morte: "",
      tipo_cobertura: "",
      periodo_cobertura: "",
      frequencia_pagamento: "",
      plano_singular: "",
      pessoas_asseguradas: "",
      data_implantacao: "",
      total_premio_iof: "",
      beneficiarios: [],
      premio_morte: "",
      premio_morte_decrescente: "",
      premio_morte_acidental: "",
      premio_invalidez_acidental: "",
      premio_invalidez_majorada: "",
      premio_amparo_funeral: "",
      premio_cirurgias: "",
      premio_ipdf: "",
      premio_doencas_graves_mais: "",
      premio_doencas_graves_cirurgicos: "",
      premio_doencas_graves_cirurgicos_premium: "",
      premio_fratura_ossea: "",
      premio_dit: "",
      premio_dih: "",
      premio_temporaria_morte: "",
      premio_funeral_individual: "",
      premio_doencas_incapacitantes: "",
      morte_decrescente_capital: "",
      morte_decrescente_periodo: "",
      morte_acidental_capital: "",
      invalidez_acidental_capital: "",
      invalidez_acidental_majorada_capital: "",
      amparo_funeral_cobertura: "",
      amparo_funeral_capital: "",
      cirurgias_capital: "",
      ipdf_capital: "",
      doencas_graves_mais_capital: "",
      doencas_graves_cirurgicos_capital: "",
      doencas_graves_cirurgicos_premium_capital: "",
      fratura_ossea_capital: "",
      dit_cobertura: "",
      dit_franquia: "",
      dit_renda: "",
      dit_diaria: "",
      dih_capital: "",
      temporaria_morte_capital: "",
      temporaria_morte_vigencia: "",
      temporaria_morte_periodo: "",
      funeral_individual_capital: "",
      funeral_individual_conjuge: "",
      doencas_incapacitantes_cobertura: "",
      doencas_incapacitantes_renda: "",
      doencas_incapacitantes_capital: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800">DADOS DA APÓLICE - {cliente?.nome}</DialogTitle>
          </motion.div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Produto Principal */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-400 to-blue-500 p-5 rounded-2xl shadow-lg border-2 border-blue-300 space-y-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-6 h-6 text-white" />
              <h3 className="font-black text-lg text-white">PRODUTO</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Produto:</Label>
                <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vida Segura">Vida Segura</SelectItem>
                    <SelectItem value="Vida Singular">Vida Singular</SelectItem>
                    <SelectItem value="Vida Total">Vida Total</SelectItem>
                    <SelectItem value="Vida Total Singular">Vida Total Singular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Capital Segurado para Cobertura de Morte:</Label>
                <Input
                  value={formData.capital_morte}
                  onChange={(e) => handleCurrencyChange('capital_morte', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Data de Implantação (Início de Vigência):</Label>
              <Input
                type="date"
                value={formData.data_implantacao || ""}
                onChange={(e) => setFormData({...formData, data_implantacao: e.target.value})}
              />
            </div>

            <div>
              <Label className="text-xs">Pessoas Asseguradas:</Label>
              <Select value={formData.pessoas_asseguradas || ""} onValueChange={(v) => setFormData({...formData, pessoas_asseguradas: v})}>
                <SelectTrigger><SelectValue placeholder="Automático (baseado na apólice)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ambos com Seguro">Ambos com Seguro</SelectItem>
                  <SelectItem value="Cônjuge sem Seguro">Cônjuge sem Seguro</SelectItem>
                  <SelectItem value="Titular sem Seguro">Titular sem Seguro</SelectItem>
                  <SelectItem value="Ambos sem Seguro">Ambos sem Seguro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.produto === "Vida Total Singular" && (
              <div>
                <Label className="text-xs">Plano:</Label>
                <Select value={formData.plano_singular} onValueChange={(v) => setFormData({...formData, plano_singular: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Singular">Singular</SelectItem>
                    <SelectItem value="Singular Legado">Singular Legado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.produto === "Vida Segura" || formData.produto === "Vida Singular" || formData.produto === "Vida Total") && (
              <>
                <div>
                  <Label className="text-xs">Tipo de Cobertura:</Label>
                  <Select value={formData.tipo_cobertura} onValueChange={(v) => setFormData({...formData, tipo_cobertura: v, periodo_cobertura: ""})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixado">Fixado</SelectItem>
                      <SelectItem value="Idade Alcançada">Idade Alcançada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_cobertura === "Fixado" && (
                  <div>
                    <Label className="text-xs">Período de Cobertura e Pagamento:</Label>
                    <Select value={formData.periodo_cobertura} onValueChange={(v) => setFormData({...formData, periodo_cobertura: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(formData.produto === "Vida Singular" || formData.produto === "Vida Segura") ? (
                          <>
                            <SelectItem value="5">5 anos</SelectItem>
                            <SelectItem value="10">10 anos</SelectItem>
                            <SelectItem value="15">15 anos</SelectItem>
                            <SelectItem value="20">20 anos</SelectItem>
                            <SelectItem value="25">25 anos</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="5">5 anos</SelectItem>
                            <SelectItem value="10">10 anos</SelectItem>
                            <SelectItem value="15">15 anos</SelectItem>
                            <SelectItem value="20">20 anos</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.tipo_cobertura === "Idade Alcançada" && (
                  <div>
                    <Label className="text-xs">Idade:</Label>
                    <Select value={formData.periodo_cobertura} onValueChange={(v) => setFormData({...formData, periodo_cobertura: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(formData.produto === "Vida Singular" || formData.produto === "Vida Segura") ? (
                          <SelectItem value="75">75 anos</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="65">65 anos</SelectItem>
                            <SelectItem value="99">99 anos</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Frequência de Pagamento:</Label>
                  <Select value={formData.frequencia_pagamento} onValueChange={(v) => setFormData({...formData, frequencia_pagamento: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Anual">Anual</SelectItem>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </motion.div>

          <Separator />

          {/* BENEFICIÁRIOS */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-indigo-400 to-indigo-500 p-5 rounded-2xl shadow-lg border-2 border-indigo-300 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-white" />
                <h3 className="font-black text-lg text-white">BENEFICIÁRIOS</h3>
              </div>
              <Button type="button" onClick={addBeneficiario} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                + Adicionar Beneficiário
              </Button>
            </div>

            {formData.beneficiarios && formData.beneficiarios.length > 0 ? (
              <div className="space-y-3">
                {formData.beneficiarios.map((beneficiario, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">Beneficiário {index + 1}</span>
                      <Button
                        type="button"
                        onClick={() => removeBeneficiario(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Label className="text-xs">Nome Civil ou Social Completo:</Label>
                        <Input
                          value={beneficiario.nome}
                          onChange={(e) => updateBeneficiario(index, "nome", e.target.value.toUpperCase())}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Parentesco:</Label>
                        <Select
                          value={beneficiario.parentesco}
                          onValueChange={(v) => updateBeneficiario(index, "parentesco", v)}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                            <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                            <SelectItem value="Pai">Pai</SelectItem>
                            <SelectItem value="Mãe">Mãe</SelectItem>
                            <SelectItem value="Irmão(ã)">Irmão(ã)</SelectItem>
                            <SelectItem value="Sobrinho(a)">Sobrinho(a)</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Data de Nascimento:</Label>
                        <Input
                          type="date"
                          value={beneficiario.data_nascimento}
                          onChange={(e) => updateBeneficiario(index, "data_nascimento", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Distribuição % (*):</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={beneficiario.distribuicao}
                          onChange={(e) => updateBeneficiario(index, "distribuicao", e.target.value)}
                          placeholder="%"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/80 text-center py-4">Nenhum beneficiário cadastrado</p>
            )}
          </motion.div>

          <Separator />

          {/* PRÊMIO TOTAL */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-400 to-emerald-500 p-5 rounded-2xl shadow-lg border-2 border-emerald-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-6 h-6 text-white" />
              <h3 className="font-black text-lg text-white">VALORES</h3>
            </div>
            <div>
              <Label className="text-xs font-bold">Total de prêmio(s) do(s) seguro(s) contratado(s) + IOF:</Label>
              <Input
                value={formData.total_premio_iof}
                onChange={(e) => handleCurrencyChange('total_premio_iof', e.target.value)}
                className="font-bold text-lg bg-white"
              />
            </div>
          </motion.div>

          <Separator />

          {/* COBERTURAS */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2"
            >
              <Activity className="w-6 h-6 text-purple-600" />
              <h3 className="font-black text-2xl text-slate-800">COBERTURAS E PRÊMIOS</h3>
            </motion.div>

            {/* Cobertura de Morte Principal */}
            <div className="bg-blue-100 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Cobertura de Morte Principal</h4>
              <div>
                <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                <Input value={formData.premio_morte} onChange={(e) => handleCurrencyChange('premio_morte', e.target.value)} />
              </div>
            </div>

            {/* Morte com Capital Decrescente */}
            <div className="bg-purple-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Morte com Capital Decrescente</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.morte_decrescente_capital} onChange={(e) => handleCurrencyChange('morte_decrescente_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Período de Cobertura e Pagamento:</Label>
                  <Select value={formData.morte_decrescente_periodo} onValueChange={(v) => setFormData({...formData, morte_decrescente_periodo: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 anos</SelectItem>
                      <SelectItem value="10">10 anos</SelectItem>
                      <SelectItem value="15">15 anos</SelectItem>
                      <SelectItem value="20">20 anos</SelectItem>
                      <SelectItem value="25">25 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_morte_decrescente} onChange={(e) => handleCurrencyChange('premio_morte_decrescente', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Morte Acidental */}
            <div className="bg-red-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Morte Acidental</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.morte_acidental_capital} onChange={(e) => handleCurrencyChange('morte_acidental_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_morte_acidental} onChange={(e) => handleCurrencyChange('premio_morte_acidental', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Invalidez Acidental */}
            <div className="bg-orange-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Invalidez Acidental</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.invalidez_acidental_capital} onChange={(e) => handleCurrencyChange('invalidez_acidental_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_invalidez_acidental} onChange={(e) => handleCurrencyChange('premio_invalidez_acidental', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Invalidez Acidental Majorada */}
            <div className="bg-yellow-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Invalidez Acidental Majorada</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.invalidez_acidental_majorada_capital} onChange={(e) => handleCurrencyChange('invalidez_acidental_majorada_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_invalidez_majorada} onChange={(e) => handleCurrencyChange('premio_invalidez_majorada', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Amparo Funeral */}
            <div className="bg-green-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Amparo Funeral</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Cobertura:</Label>
                  <Select value={formData.amparo_funeral_cobertura} onValueChange={(v) => setFormData({...formData, amparo_funeral_cobertura: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Individual + Conjuge">Individual + Cônjuge</SelectItem>
                      <SelectItem value="Familiar">Familiar</SelectItem>
                      <SelectItem value="Familiar + Pais">Familiar + Pais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Select value={formData.amparo_funeral_capital} onValueChange={(v) => setFormData({...formData, amparo_funeral_capital: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R$ 7.000,00">R$ 7.000,00</SelectItem>
                      <SelectItem value="R$ 10.000,00">R$ 10.000,00</SelectItem>
                      <SelectItem value="R$ 15.000,00">R$ 15.000,00</SelectItem>
                      <SelectItem value="R$ 20.000,00">R$ 20.000,00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_amparo_funeral} onChange={(e) => handleCurrencyChange('premio_amparo_funeral', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Cirurgias, IPDF, Doenças Graves */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded space-y-2">
                <h4 className="font-bold text-sm">Cirurgias</h4>
                <p className="text-[10px] text-slate-600 leading-tight bg-blue-100 p-2 rounded">
                  Garante indenização caso o Segurado passe por procedimento cirúrgico invasivo, por acidente pessoal ou doença, com internação pós-operatória de 48h. Carência de 90 dias. Cobre: cirurgia cardíaca, vascular, ortopédica, aparelho digestivo, neurocirurgia, entre outras.
                </p>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.cirurgias_capital} onChange={(e) => handleCurrencyChange('cirurgias_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_cirurgias} onChange={(e) => handleCurrencyChange('premio_cirurgias', e.target.value)} />
                </div>
              </div>

              <div className="bg-indigo-50 p-3 rounded space-y-2">
                <h4 className="font-bold text-sm">IPDF</h4>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.ipdf_capital} onChange={(e) => handleCurrencyChange('ipdf_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_ipdf} onChange={(e) => handleCurrencyChange('premio_ipdf', e.target.value)} />
                </div>
              </div>

              <div className="bg-pink-50 p-3 rounded space-y-2">
                <h4 className="font-bold text-sm">Doenças Graves Mais Proteção</h4>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.doencas_graves_mais_capital} onChange={(e) => handleCurrencyChange('doencas_graves_mais_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_doencas_graves_mais} onChange={(e) => handleCurrencyChange('premio_doencas_graves_mais', e.target.value)} />
                </div>
              </div>

              <div className="bg-rose-50 p-3 rounded space-y-2">
                <h4 className="font-bold text-sm">Doenças Graves Proc. Cirúrgicos</h4>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.doencas_graves_cirurgicos_capital} onChange={(e) => handleCurrencyChange('doencas_graves_cirurgicos_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_doencas_graves_cirurgicos} onChange={(e) => handleCurrencyChange('premio_doencas_graves_cirurgicos', e.target.value)} />
                </div>
              </div>

              <div className="bg-violet-50 p-3 rounded space-y-2">
                <h4 className="font-bold text-sm">Doenças Graves Proc. Cirúrgicos Premium</h4>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.doencas_graves_cirurgicos_premium_capital} onChange={(e) => handleCurrencyChange('doencas_graves_cirurgicos_premium_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_doencas_graves_cirurgicos_premium} onChange={(e) => handleCurrencyChange('premio_doencas_graves_cirurgicos_premium', e.target.value)} />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded space-y-2">
                <h4 className="font-bold text-sm">Fratura Óssea</h4>
                <p className="text-[10px] text-slate-600 leading-tight bg-amber-100 p-2 rounded">
                  Recurso destinado à manutenção do padrão de vida e despesas de reabilitação. Franquia de 4%. Indenização conforme % do capital segurado: Crânio/Vértebras 100% · Pelve/Quadril/Fêmur 50% · Mandíbula/Ossos da Face/Clavícula/Escápula/Braço/Antebraço/Perna/Calcâneo/Cóccix/Esterno 25% · Punho/Mão/Tornozelo/Pés/Costelas 5% · Dedos Mãos/Pés 2%.
                </p>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.fratura_ossea_capital} onChange={(e) => handleCurrencyChange('fratura_ossea_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_fratura_ossea} onChange={(e) => handleCurrencyChange('premio_fratura_ossea', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Diária por Incapacidade Temporária */}
            <div className="bg-cyan-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Diária por Incapacidade Temporária</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Cobertura:</Label>
                  <Select value={formData.dit_cobertura} onValueChange={(v) => setFormData({...formData, dit_cobertura: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sem LER/DORT">Sem LER/DORT</SelectItem>
                      <SelectItem value="Com LER/DORT">Com LER/DORT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Franquia:</Label>
                  <Select value={formData.dit_franquia} onValueChange={(v) => setFormData({...formData, dit_franquia: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10 dias">10 dias</SelectItem>
                      <SelectItem value="15 dias">15 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Renda Mensal:</Label>
                  <Input value={formData.dit_renda} onChange={(e) => handleCurrencyChange('dit_renda', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Diária:</Label>
                  <Input value={formData.dit_diaria} onChange={(e) => handleCurrencyChange('dit_diaria', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_dit} onChange={(e) => handleCurrencyChange('premio_dit', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Diária por Internação Hospitalar */}
            <div className="bg-teal-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Diária por Internação Hospitalar</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Select value={formData.dih_capital} onValueChange={(v) => setFormData({...formData, dih_capital: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R$ 200,00">R$ 200,00</SelectItem>
                      <SelectItem value="R$ 250,00">R$ 250,00</SelectItem>
                      <SelectItem value="R$ 300,00">R$ 300,00</SelectItem>
                      <SelectItem value="R$ 350,00">R$ 350,00</SelectItem>
                      <SelectItem value="R$ 450,00">R$ 450,00</SelectItem>
                      <SelectItem value="R$ 550,00">R$ 550,00</SelectItem>
                      <SelectItem value="R$ 750,00">R$ 750,00</SelectItem>
                      <SelectItem value="R$ 1.000,00">R$ 1.000,00</SelectItem>
                      <SelectItem value="R$ 2.000,00">R$ 2.000,00</SelectItem>
                      <SelectItem value="R$ 3.000,00">R$ 3.000,00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_dih} onChange={(e) => handleCurrencyChange('premio_dih', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Temporária por Morte */}
            <div className="bg-lime-50 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Temporária por Morte</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.temporaria_morte_capital} onChange={(e) => handleCurrencyChange('temporaria_morte_capital', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Tipo de Vigência:</Label>
                  <Select value={formData.temporaria_morte_vigencia} onValueChange={(v) => setFormData({...formData, temporaria_morte_vigencia: v, temporaria_morte_periodo: ""})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixado">Fixado</SelectItem>
                      <SelectItem value="Idade Alcançada">Idade Alcançada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.temporaria_morte_vigencia && (
                  <div>
                    <Label className="text-xs">{formData.temporaria_morte_vigencia === "Fixado" ? "Período:" : "Idade:"}</Label>
                    <Select value={formData.temporaria_morte_periodo} onValueChange={(v) => setFormData({...formData, temporaria_morte_periodo: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {formData.temporaria_morte_vigencia === "Fixado" ? (
                          <>
                            <SelectItem value="5">5 anos</SelectItem>
                            <SelectItem value="10">10 anos</SelectItem>
                            <SelectItem value="15">15 anos</SelectItem>
                            <SelectItem value="20">20 anos</SelectItem>
                            <SelectItem value="25">25 anos</SelectItem>
                          </>
                        ) : (
                          <SelectItem value="75">75 anos</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="col-span-3">
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_temporaria_morte} onChange={(e) => handleCurrencyChange('premio_temporaria_morte', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Funeral Individual */}
            <div className="bg-slate-100 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Funeral Individual</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Select value={formData.funeral_individual_capital} onValueChange={(v) => setFormData({...formData, funeral_individual_capital: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R$ 10.000,00">R$ 10.000,00</SelectItem>
                      <SelectItem value="R$ 15.000,00">R$ 15.000,00</SelectItem>
                      <SelectItem value="R$ 20.000,00">R$ 20.000,00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Contratação Cônjuge:</Label>
                  <Select value={formData.funeral_individual_conjuge} onValueChange={(v) => setFormData({...formData, funeral_individual_conjuge: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_funeral_individual} onChange={(e) => handleCurrencyChange('premio_funeral_individual', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Doenças Incapacitantes */}
            <div className="bg-gray-100 p-3 rounded space-y-2">
              <h4 className="font-bold text-sm">Doenças Incapacitantes</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Cobertura:</Label>
                  <Select value={formData.doencas_incapacitantes_cobertura} onValueChange={(v) => setFormData({...formData, doencas_incapacitantes_cobertura: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Doenças Incapacitantes">Doenças Incapacitantes</SelectItem>
                      <SelectItem value="Ampliada">Ampliada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Renda Mensal:</Label>
                  <Input value={formData.doencas_incapacitantes_renda} onChange={(e) => handleCurrencyChange('doencas_incapacitantes_renda', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Capital Segurado:</Label>
                  <Input value={formData.doencas_incapacitantes_capital} onChange={(e) => handleCurrencyChange('doencas_incapacitantes_capital', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Prêmio Bruto Contratado:</Label>
                  <Input value={formData.premio_doencas_incapacitantes} onChange={(e) => handleCurrencyChange('premio_doencas_incapacitantes', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 pt-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-black text-lg py-6 shadow-xl rounded-xl"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> SALVANDO...</>
                ) : (
                  <><Save className="w-5 h-5 mr-2" /> SALVAR</>
                )}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="button"
                onClick={handleLimpar}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 font-black text-lg py-6 shadow-xl rounded-xl"
              >
                <Eraser className="w-5 h-5 mr-2" />
                LIMPAR
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <input
                type="file"
                id="file-upload-apolice"
                accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('file-upload-apolice').click()}
                disabled={uploadingFile}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-black text-lg py-6 shadow-xl rounded-xl"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    IMPORTAR
                  </>
                )}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="button"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-black text-lg py-6 shadow-xl rounded-xl"
              >
                <XCircle className="w-5 h-5 mr-2" />
                CANCELAR
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}