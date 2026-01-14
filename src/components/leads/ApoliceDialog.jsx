import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

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
          plano: { type: "string", description: "Código do plano (ex: VS20, VT10, etc)" },
          periodicidade_premio: { type: "string", description: "Periodicidade do(s) prêmio(s) - Mensal ou Anual" },
          capital_segurado_morte: { type: "string", description: "Capital segurado para morte" },
          premio_bruto_morte: { type: "string", description: "Prêmio bruto da cobertura de morte" },
          total_premio_iof: { type: "string", description: "Total de prêmio(s) + IOF" },
          
          beneficiarios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                parentesco: { type: "string" },
                data_nascimento: { type: "string" },
                distribuicao: { type: "string" }
              }
            }
          },
          
          coberturas: {
            type: "array",
            description: "Lista de coberturas contratadas",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome da cobertura" },
                capital_segurado: { type: "string", description: "Capital segurado (R$)" },
                premio_bruto: { type: "string", description: "Prêmio Bruto (R$)" }
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
        
        // Processar o campo Plano (ex: VS20, VT10, VS75)
        let produtoFinal = "";
        let tipoCobertura = "";
        let periodoCobertura = "";
        
        if (data.plano) {
          const planoUpper = data.plano.toUpperCase();
          if (planoUpper.includes("VS")) {
            produtoFinal = "Vida Singular";
          } else if (planoUpper.includes("VT")) {
            produtoFinal = "Vida Total";
          }
          
          // Extrair número do plano
          const numeroMatch = planoUpper.match(/\d+/);
          if (numeroMatch) {
            const numero = numeroMatch[0];
            periodoCobertura = numero;
            
            // Se for 75, 65 ou 99 = Idade Alcançada, caso contrário = Fixado
            if (numero === "75" || numero === "65" || numero === "99") {
              tipoCobertura = "Idade Alcançada";
            } else {
              tipoCobertura = "Fixado";
            }
          }
        }
        
        // Processar coberturas
        const coberturasMap = {};
        if (data.coberturas && Array.isArray(data.coberturas)) {
          data.coberturas.forEach(cob => {
            const nomeLower = (cob.nome || "").toLowerCase();
            
            if (nomeLower.includes("morte") && nomeLower.includes("decrescente")) {
              coberturasMap.morte_decrescente_capital = cob.capital_segurado;
              coberturasMap.premio_morte_decrescente = cob.premio_bruto;
            } else if (nomeLower.includes("morte") && nomeLower.includes("acidental")) {
              coberturasMap.morte_acidental_capital = cob.capital_segurado;
              coberturasMap.premio_morte_acidental = cob.premio_bruto;
            } else if (nomeLower.includes("invalidez") && nomeLower.includes("majorada")) {
              coberturasMap.invalidez_acidental_majorada_capital = cob.capital_segurado;
              coberturasMap.premio_invalidez_majorada = cob.premio_bruto;
            } else if (nomeLower.includes("invalidez") && nomeLower.includes("acidental")) {
              coberturasMap.invalidez_acidental_capital = cob.capital_segurado;
              coberturasMap.premio_invalidez_acidental = cob.premio_bruto;
            } else if (nomeLower.includes("amparo") && nomeLower.includes("funeral")) {
              coberturasMap.amparo_funeral_capital = cob.capital_segurado;
              coberturasMap.premio_amparo_funeral = cob.premio_bruto;
            } else if (nomeLower.includes("cirurgia")) {
              coberturasMap.cirurgias_capital = cob.capital_segurado;
              coberturasMap.premio_cirurgias = cob.premio_bruto;
            } else if (nomeLower.includes("ipdf")) {
              coberturasMap.ipdf_capital = cob.capital_segurado;
              coberturasMap.premio_ipdf = cob.premio_bruto;
            } else if (nomeLower.includes("doenças graves") && nomeLower.includes("premium")) {
              coberturasMap.doencas_graves_cirurgicos_premium_capital = cob.capital_segurado;
              coberturasMap.premio_doencas_graves_cirurgicos_premium = cob.premio_bruto;
            } else if (nomeLower.includes("doenças graves") && nomeLower.includes("cirúrgico")) {
              coberturasMap.doencas_graves_cirurgicos_capital = cob.capital_segurado;
              coberturasMap.premio_doencas_graves_cirurgicos = cob.premio_bruto;
            } else if (nomeLower.includes("doenças graves")) {
              coberturasMap.doencas_graves_mais_capital = cob.capital_segurado;
              coberturasMap.premio_doencas_graves_mais = cob.premio_bruto;
            } else if (nomeLower.includes("fratura") && nomeLower.includes("óssea")) {
              coberturasMap.fratura_ossea_capital = cob.capital_segurado;
              coberturasMap.premio_fratura_ossea = cob.premio_bruto;
            } else if (nomeLower.includes("dit") || nomeLower.includes("incapacidade temporária")) {
              coberturasMap.premio_dit = cob.premio_bruto;
            } else if (nomeLower.includes("dih") || nomeLower.includes("internação hospitalar")) {
              coberturasMap.dih_capital = cob.capital_segurado;
              coberturasMap.premio_dih = cob.premio_bruto;
            } else if (nomeLower.includes("temporária") && nomeLower.includes("morte")) {
              coberturasMap.temporaria_morte_capital = cob.capital_segurado;
              coberturasMap.premio_temporaria_morte = cob.premio_bruto;
            } else if (nomeLower.includes("funeral") && nomeLower.includes("individual")) {
              coberturasMap.funeral_individual_capital = cob.capital_segurado;
              coberturasMap.premio_funeral_individual = cob.premio_bruto;
            } else if (nomeLower.includes("doenças incapacitantes")) {
              coberturasMap.doencas_incapacitantes_capital = cob.capital_segurado;
              coberturasMap.premio_doencas_incapacitantes = cob.premio_bruto;
            }
          });
        }
        
        // Mesclar dados extraídos com dados atuais
        setFormData(prev => ({
          ...prev,
          produto: produtoFinal || prev.produto,
          tipo_cobertura: tipoCobertura || prev.tipo_cobertura,
          periodo_cobertura: periodoCobertura || prev.periodo_cobertura,
          frequencia_pagamento: data.periodicidade_premio || prev.frequencia_pagamento,
          capital_morte: data.capital_segurado_morte || prev.capital_morte,
          premio_morte: data.premio_bruto_morte || prev.premio_morte,
          total_premio_iof: data.total_premio_iof || prev.total_premio_iof,
          beneficiarios: data.beneficiarios || prev.beneficiarios,
          ...coberturasMap
        }));
        
        // Atualizar CPF do cliente se extraído
        if (data.cpf && cliente?.id) {
          try {
            await base44.entities.Cliente.update(cliente.id, { cpf: data.cpf });
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">DADOS DA APÓLICE - {cliente?.nome}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Produto Principal */}
          <div className="bg-blue-100 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-sm">PRODUTO</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Produto:</Label>
                <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
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

            {(formData.produto === "Vida Singular" || formData.produto === "Vida Total") && (
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
                        {formData.produto === "Vida Singular" ? (
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
                        {formData.produto === "Vida Singular" ? (
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
          </div>

          <Separator />

          {/* BENEFICIÁRIOS */}
          <div className="bg-indigo-100 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">BENEFICIÁRIOS</h3>
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
              <p className="text-sm text-gray-500 text-center py-4">Nenhum beneficiário cadastrado</p>
            )}
          </div>

          <Separator />

          {/* PRÊMIO TOTAL */}
          <div className="bg-emerald-100 p-4 rounded-lg">
            <h3 className="font-bold text-sm mb-3">VALORES</h3>
            <div>
              <Label className="text-xs font-bold">Total de prêmio(s) do(s) seguro(s) contratado(s) + IOF:</Label>
              <Input
                value={formData.total_premio_iof}
                onChange={(e) => handleCurrencyChange('total_premio_iof', e.target.value)}
                className="font-bold text-lg"
              />
            </div>
          </div>

          <Separator />

          {/* COBERTURAS */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">COBERTURAS E PRÊMIOS</h3>

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
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              SALVAR
            </Button>
            
            <Button 
              type="button"
              onClick={handleLimpar}
              className="flex-1 bg-gray-500 hover:bg-gray-600 font-bold"
            >
              LIMPAR
            </Button>
            
            <div className="flex-1">
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
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Dados
                  </>
                )}
              </Button>
            </div>
            
            <Button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
            >
              CANCELAR
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}