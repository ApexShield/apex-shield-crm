import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Calculator, Download, FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CalculadoraRapida() {
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [showConfigAvancadas, setShowConfigAvancadas] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analiseGerada, setAnaliseGerada] = useState(null);

  const formDataInicial = {
    data_nascimento: "",
    dependentes: 0,
    estado_civil: "",
    profissao: "",
    genero: "",
    renda_mensal: "",
    gastos_mensais: "",
    patrimonio_bruto: "",
    patrimonio_financeiro: "",
    altura: "",
    peso: "",
    fumou_12_meses: false,
    condicao_saude: false,
    template: "padrao",
    modulos: {
      sucessao: true,
      protecao_familiar: true,
      doencas_graves: true,
      cirurgias: true,
      diaria_internacao: true,
      incapacidade_temporaria: true,
      invalidez: true,
      assistencia_funeral: true
    },
    parametros: {
      taxa_juros: 0.7,
      doencas_graves_meses: 24,
      idade_aposentadoria: 65,
      calcular_sobre: "renda",
      cobertura_cirurgias: 50000,
      fator_multiplicador: 100,
      assistencia_funeral_valor: 10000,
      itcmd: 4,
      cartorio: 1.5,
      advogado: 6
    }
  };

  const [formData, setFormData] = useState(formDataInicial);

  const arredondarValor = (valor) => {
    if (valor >= 1000000) {
      // Valores acima de 1 milhão: arredondar para o milhão mais próximo
      return Math.ceil(valor / 1000000) * 1000000;
    } else if (valor >= 100000) {
      // Valores acima de 100 mil: arredondar para 100 mil
      return Math.ceil(valor / 100000) * 100000;
    } else if (valor >= 10000) {
      // Valores acima de 10 mil: arredondar para 10 mil
      return Math.ceil(valor / 10000) * 10000;
    } else if (valor >= 1000) {
      // Valores acima de 1 mil: arredondar para mil
      return Math.ceil(valor / 1000) * 1000;
    }
    return Math.ceil(valor);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const limparCalculadora = () => {
    setFormData(formDataInicial);
    setClienteSelecionado("");
    setAnaliseGerada(null);
  };

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list()
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const imc = useMemo(() => {
    if (formData.altura && formData.peso) {
      const alturaM = parseFloat(formData.altura) / 100;
      const pesoKg = parseFloat(formData.peso);
      const imcCalc = pesoKg / (alturaM * alturaM);
      return imcCalc.toFixed(1);
    }
    return "";
  }, [formData.altura, formData.peso]);

  const statusIMC = useMemo(() => {
    if (!imc) return "";
    const imcNum = parseFloat(imc);
    if (imcNum < 18.5) return "Abaixo do peso";
    if (imcNum < 25) return "Peso normal";
    if (imcNum < 30) return "Sobrepeso";
    return "Obesidade";
  }, [imc]);

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return 0;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  const getMomentoVida = (idade, dependentes, estadoCivil) => {
    if (idade >= 55) return "Momento crucial para garantir sucessão e legado";
    if (idade >= 45) return "Momento de consolidação patrimonial e planejamento sucessório";
    if (dependentes > 0) return "Momento de proteger os dependentes e garantir educação";
    if (estadoCivil === "Casado(a)") return "Momento de construir proteção familiar";
    return "Momento de estabelecer bases de proteção financeira";
  };

  const getFatoresRisco = (idade, fumou, condicaoSaude, imcNum) => {
    const fatores = [];
    if (idade >= 45) fatores.push("idade 45+");
    if (fumou) fatores.push("tabagismo");
    if (condicaoSaude) fatores.push("condição de saúde pré-existente");
    if (imcNum >= 30) fatores.push("obesidade");
    return fatores;
  };

  const handleClienteChange = (clienteId) => {
    setClienteSelecionado(clienteId);
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        data_nascimento: cliente.data_nascimento || "",
        estado_civil: cliente.estado_civil || "",
        profissao: cliente.profissao || "",
        genero: cliente.genero || "",
        renda_mensal: cliente.renda || "",
        gastos_mensais: cliente.custo_mensal_fixo || "",
        patrimonio_bruto: cliente.patrimonio || "",
        patrimonio_financeiro: "",
        altura: cliente.altura || "",
        peso: cliente.peso || "",
        fumou_12_meses: cliente.fuma === "Sim",
        condicao_saude: false,
        dependentes: cliente.filhos ? parseInt(cliente.filhos) : 0
      }));
    }
  };

  const calcularProtecao = () => {
    const idade = calcularIdade(formData.data_nascimento);
    
    // Parse correto de valores monetários removendo apenas símbolos, mantendo pontos e vírgulas
    const parseValorMonetario = (valor) => {
      if (!valor) return 0;
      // Remove R$, espaços e pontos de milhar, depois substitui vírgula por ponto
      const valorLimpo = valor.toString()
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.');
      return parseFloat(valorLimpo) || 0;
    };
    
    const renda = parseValorMonetario(formData.renda_mensal);
    const gastos = parseValorMonetario(formData.gastos_mensais);
    const patrimonioBruto = parseValorMonetario(formData.patrimonio_bruto);
    const patrimonioFinanceiro = parseValorMonetario(formData.patrimonio_financeiro);
    const base = formData.parametros.calcular_sobre === "renda" ? renda : gastos;
    const anosProtecao = formData.parametros.idade_aposentadoria - idade;

    // Sucessão
    const taxaTotal = (formData.parametros.itcmd + formData.parametros.cartorio + formData.parametros.advogado) / 100;
    const sucessao = patrimonioBruto * taxaTotal;

    // Proteção Familiar
    const rendaMensal80 = base * 0.8;
    const capitalNecessario = (rendaMensal80 * 12 * anosProtecao) / (1 + (formData.parametros.taxa_juros / 100) * anosProtecao);
    const protecaoFamiliar = capitalNecessario;

    // Doenças Graves
    const doencasGraves = base * formData.parametros.doencas_graves_meses * (formData.parametros.fator_multiplicador / 100);

    // Invalidez Total
    const invalidezTotal = (base * 12 * anosProtecao) * (formData.parametros.fator_multiplicador / 100);

    // Diárias
    const diariaIncapacidade = base / 30;
    const diariaInternacao = base / 30;

    // Cirurgias
    const cirurgias = formData.parametros.cobertura_cirurgias;

    // Assistência Funeral
    const assistenciaFuneral = formData.parametros.assistencia_funeral_valor;

    let total = 0;
    if (formData.modulos.sucessao) total += sucessao;
    if (formData.modulos.protecao_familiar) total += protecaoFamiliar;
    if (formData.modulos.doencas_graves) total += doencasGraves;
    if (formData.modulos.invalidez) total += invalidezTotal;
    if (formData.modulos.cirurgias) total += cirurgias;
    if (formData.modulos.assistencia_funeral) total += assistenciaFuneral;

    const fatoresRisco = getFatoresRisco(idade, formData.fumou_12_meses, formData.condicao_saude, parseFloat(imc));
    const momentoVida = getMomentoVida(idade, formData.dependentes, formData.estado_civil);

    // Cálculos comparativos
    const rendaPassivaSucessao = (patrimonioFinanceiro * 0.007);
    const rendaPassivaSucessaoIdeal = (sucessao * 0.007);
    const rendaPassivaFamiliar = (patrimonioFinanceiro * 0.007);
    const rendaPassivaFamiliarIdeal = (protecaoFamiliar * 0.007);

    return {
      sucessao: Math.round(sucessao),
      protecaoFamiliar: Math.round(protecaoFamiliar),
      doencasGraves: Math.round(doencasGraves),
      invalidezTotal: Math.round(invalidezTotal),
      diariaIncapacidade: Math.round(diariaIncapacidade),
      diariaInternacao: Math.round(diariaInternacao),
      cirurgias,
      assistenciaFuneral,
      total: Math.round(total),
      idade,
      imc: parseFloat(imc) || 0,
      statusIMC,
      renda,
      gastos,
      patrimonioBruto,
      patrimonioFinanceiro,
      fatoresRisco,
      momentoVida,
      anosProtecao,
      rendaMensal80,
      rendaPassivaSucessao,
      rendaPassivaSucessaoIdeal,
      rendaPassivaFamiliar,
      rendaPassivaFamiliarIdeal,
      taxaTotal: taxaTotal * 100
    };
  };

  const gerarApresentacao = async () => {
    setGenerating(true);
    const analise = calcularProtecao();
    setAnaliseGerada(analise);
    
    setTimeout(() => {
      setGenerating(false);
      // Scroll suave para a apresentação
      setTimeout(() => {
        document.getElementById("apresentacao-completa")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 1500);
  };

  const downloadPDF = async () => {
    const elemento = document.getElementById("apresentacao-completa");
    if (!elemento) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const elementsToCapture = elemento.querySelectorAll(".pdf-page");
    
    for (let i = 0; i < elementsToCapture.length; i++) {
      const canvas = await html2canvas(elementsToCapture[i], { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    const cliente = clientes.find(c => c.id === clienteSelecionado);
    const nomeArquivo = cliente ? 
      `Analise_Seguro_${cliente.nome.replace(/\s/g, "_")}.pdf` : 
      "Analise_Seguro.pdf";
    
    pdf.save(nomeArquivo);
  };

  const clienteInfo = useMemo(() => {
    return clientes.find(c => c.id === clienteSelecionado);
  }, [clienteSelecionado, clientes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Calculadora Rápida</h1>
              <p className="text-indigo-300">Faça uma cotação diretamente do dashboard • Resultados instantâneos</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Cálculo de Seguro de Vida
            </CardTitle>
            <p className="text-indigo-300 text-sm">Preencha seus dados para uma análise profissional personalizada</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Cliente */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border-2 border-indigo-400">
              <Label className="text-white mb-2 block text-lg font-bold">Selecione um contato existente ou crie um novo</Label>
              <p className="text-sm text-indigo-200 mb-3">Busque por nome, email ou telefone para encontrar um contato existente</p>
              <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
                <SelectTrigger className="bg-white border-2 border-indigo-400 text-gray-900 font-semibold h-12 text-base shadow-lg">
                  <SelectValue placeholder="🔍 Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dados Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Dependentes</Label>
                <Select value={formData.dependentes.toString()} onValueChange={(v) => setFormData({ ...formData, dependentes: parseInt(v) })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} dependente{n !== 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Estado Civil</Label>
                <Select value={formData.estado_civil} onValueChange={(v) => setFormData({ ...formData, estado_civil: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Profissão (opcional)</Label>
                <Input
                  value={formData.profissao}
                  onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Ex: Empresário"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Gênero</Label>
              <Select value={formData.genero} onValueChange={(v) => setFormData({ ...formData, genero: v })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dados Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Renda Mensal (R$)</Label>
                <Input
                  value={formData.renda_mensal}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value ? `R$ ${parseInt(value).toLocaleString('pt-BR')}` : '';
                    setFormData({ ...formData, renda_mensal: formatted });
                  }}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="R$ 35.000"
                />
              </div>
              <div>
                <Label className="text-white">Gastos Mensais (R$)</Label>
                <Input
                  value={formData.gastos_mensais}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value ? `R$ ${parseInt(value).toLocaleString('pt-BR')}` : '';
                    setFormData({ ...formData, gastos_mensais: formatted });
                  }}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="R$ 20.000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Patrimônio Bruto (R$)</Label>
                <Input
                  value={formData.patrimonio_bruto}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value ? `R$ ${parseInt(value).toLocaleString('pt-BR')}` : '';
                    setFormData({ ...formData, patrimonio_bruto: formatted });
                  }}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="R$ 2.000.000"
                />
              </div>
              <div>
                <Label className="text-white">Patrimônio Financeiro (R$)</Label>
                <Input
                  value={formData.patrimonio_financeiro}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value ? `R$ ${parseInt(value).toLocaleString('pt-BR')}` : '';
                    setFormData({ ...formData, patrimonio_financeiro: formatted });
                  }}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="R$ 100.000"
                />
              </div>
            </div>

            {/* Dados de Saúde */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Altura (cm)</Label>
                <Input
                  type="number"
                  value={formData.altura}
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="174"
                />
              </div>
              <div>
                <Label className="text-white">Peso (kg)</Label>
                <Input
                  type="number"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="90"
                />
              </div>
              <div>
                <Label className="text-white">IMC</Label>
                <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white">
                  {imc ? `${imc} - ${statusIMC}` : "—"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.fumou_12_meses}
                  onCheckedChange={(v) => setFormData({ ...formData, fumou_12_meses: v })}
                />
                <Label className="text-white">Fumou nos últimos 12 meses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.condicao_saude}
                  onCheckedChange={(v) => setFormData({ ...formData, condicao_saude: v })}
                />
                <Label className="text-white">Diabetes, Pressão Alta ou outro fator de saúde</Label>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="border-t border-white/10 pt-6">
              <Button
                variant="ghost"
                onClick={() => setShowConfigAvancadas(!showConfigAvancadas)}
                className="text-white hover:bg-white/10 w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  ⚙️ Configurações Avançadas
                </span>
                {showConfigAvancadas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <AnimatePresence>
                {showConfigAvancadas && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-6"
                  >
                    {/* Módulos Visíveis */}
                    <div>
                      <Label className="text-white mb-3 block">Módulos Visíveis</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries({
                          sucessao: "Sucessão",
                          protecao_familiar: "Proteção Familiar",
                          doencas_graves: "Doenças Graves",
                          cirurgias: "Cirurgias",
                          diaria_internacao: "Diária de Internação",
                          incapacidade_temporaria: "Incapacidade Temporária",
                          invalidez: "Invalidez",
                          assistencia_funeral: "Assistência Funeral"
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                            <Label className="text-white text-sm">{label}</Label>
                            <Switch
                              checked={formData.modulos[key]}
                              onCheckedChange={(v) => setFormData({
                                ...formData,
                                modulos: { ...formData.modulos, [key]: v }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Parâmetros */}
                    <div className="space-y-4">
                      <Label className="text-white">Parâmetros de Cálculo</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-white text-sm">Taxa de Juros Mensal (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.parametros.taxa_juros}
                            onChange={(e) => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, taxa_juros: parseFloat(e.target.value) }
                            })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Doenças Graves (Meses)</Label>
                          <Input
                            type="number"
                            value={formData.parametros.doencas_graves_meses}
                            onChange={(e) => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, doencas_graves_meses: parseInt(e.target.value) }
                            })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Idade da Aposentadoria</Label>
                          <Input
                            type="number"
                            value={formData.parametros.idade_aposentadoria}
                            onChange={(e) => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, idade_aposentadoria: parseInt(e.target.value) }
                            })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white text-sm mb-2 block">Calcular sobre</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, calcular_sobre: "renda" }
                            })}
                            className={formData.parametros.calcular_sobre === "renda" ? 
                              "bg-blue-600 hover:bg-blue-700" : "bg-white/10 hover:bg-white/20 text-white"}
                          >
                            Renda
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, calcular_sobre: "despesa" }
                            })}
                            className={formData.parametros.calcular_sobre === "despesa" ? 
                              "bg-blue-600 hover:bg-blue-700" : "bg-white/10 hover:bg-white/20 text-white"}
                          >
                            Despesa
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-white text-sm">Fator Multiplicador para Doenças Graves e Invalidez (%)</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Slider
                            value={[formData.parametros.fator_multiplicador]}
                            onValueChange={([v]) => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, fator_multiplicador: v }
                            })}
                            min={50}
                            max={150}
                            step={10}
                            className="flex-1"
                          />
                          <span className="text-white font-bold w-16">{formData.parametros.fator_multiplicador}%</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">Sem agravo (valor padrão)</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                onClick={gerarApresentacao}
                disabled={generating}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-6 text-lg"
              >
                {generating ? "Gerando Análise Completa..." : "Gerar Análise Completa"}
              </Button>
              <Button
                onClick={limparCalculadora}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold py-6 px-8"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado - Apresentação Completa */}
        {analiseGerada && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex gap-3">
              <Button
                onClick={downloadPDF}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Baixar Apresentação (PDF)
              </Button>
            </div>

            {/* Apresentação Completa */}
            <div id="apresentacao-completa" className="space-y-4">
              {/* Página 1 - Capa e Contexto */}
              <div className="pdf-page bg-white p-12 rounded-xl space-y-8">
                {/* Capa */}
                <div className="text-center py-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white">
                  <h1 className="text-5xl font-black mb-4">Análise de Necessidades de Proteção</h1>
                  <p className="text-2xl mb-8 opacity-90">Estudo Personalizado de Seguro de Vida</p>
                  <div className="bg-white/20 backdrop-blur-sm inline-block px-8 py-4 rounded-xl">
                    <p className="text-xl font-bold">Apresentado por: {user?.full_name || "MetLife Seguros"}</p>
                  </div>
                </div>

                {/* Contexto Personalizado */}
                <div className="border-l-8 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-r-2xl shadow-lg">
                  <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                    <span className="text-4xl">📊</span> Seu Contexto Personalizado
                  </h2>
                  <div className="space-y-3 text-lg">
                    <p className="text-gray-800">
                      <strong className="text-orange-700">Situação Familiar:</strong> Com {formData.dependentes} dependente(s)
                    </p>
                    <p className="text-gray-800">
                      <strong className="text-orange-700">Momento de Vida:</strong> {analiseGerada.momentoVida}
                    </p>
                    <p className="text-gray-800">
                      <strong className="text-orange-700">Fatores de Risco:</strong> {
                        analiseGerada.fatoresRisco.length > 0 
                          ? `${analiseGerada.fatoresRisco.join(", ")} (${analiseGerada.fatoresRisco.length} fator${analiseGerada.fatoresRisco.length > 1 ? 'es' : ''} identificado${analiseGerada.fatoresRisco.length > 1 ? 's' : ''})`
                          : "Nenhum fator de risco identificado"
                      }
                    </p>
                  </div>
                </div>

                {/* Proteção Total Recomendada */}
                <div className="text-center py-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-4 border-indigo-200 shadow-xl">
                  <h3 className="text-gray-600 text-2xl mb-4 font-semibold">Proteção Total Recomendada</h3>
                  <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                    {formatarMoeda(analiseGerada.total)}
                  </p>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                    Soma de todas as coberturas sugeridas para proteção completa da sua família e patrimônio
                  </p>
                </div>

                {/* Perfil e Situação */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
                    <h3 className="text-2xl font-black text-blue-900 mb-4 flex items-center gap-2">
                      <span className="text-3xl">👤</span> Perfil Pessoal
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Idade:</strong> {analiseGerada.idade} anos</p>
                      <p><strong>Estado Civil:</strong> {formData.estado_civil || "—"}</p>
                      <p><strong>Dependentes:</strong> {formData.dependentes}</p>
                      {analiseGerada.imc > 0 && (
                        <p><strong>IMC:</strong> {analiseGerada.imc} - {analiseGerada.statusIMC}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                    <h3 className="text-2xl font-black text-green-900 mb-4 flex items-center gap-2">
                      <span className="text-3xl">💰</span> Situação Financeira
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Renda:</strong> {formatarMoeda(analiseGerada.renda)}</p>
                      <p><strong>Gastos:</strong> {formatarMoeda(analiseGerada.gastos)}</p>
                      <p><strong>Patrimônio:</strong> {formatarMoeda(analiseGerada.patrimonioBruto)}</p>
                    </div>
                  </div>
                </div>

                {/* Fatores de Atenção */}
                <div className={`p-6 rounded-xl border-2 ${
                  analiseGerada.fatoresRisco.length > 0 
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                }`}>
                  <h3 className={`text-2xl font-black mb-3 flex items-center gap-2 ${
                    analiseGerada.fatoresRisco.length > 0 ? 'text-red-800' : 'text-green-800'
                  }`}>
                    <span className="text-3xl">{analiseGerada.fatoresRisco.length > 0 ? '⚠️' : '✅'}</span> 
                    Fatores de Atenção
                  </h3>
                  <p className="text-gray-700 text-lg">
                    {analiseGerada.fatoresRisco.length > 0 
                      ? `Identificamos ${analiseGerada.fatoresRisco.length} fator${analiseGerada.fatoresRisco.length > 1 ? 'es' : ''} que podem impactar sua proteção: ${analiseGerada.fatoresRisco.join(", ")}`
                      : "Excelente! Nenhum fator de risco identificado no momento"}
                  </p>
                </div>
              </div>

              {/* Detalhamento das Coberturas */}
              <div className="pdf-page bg-white p-12 rounded-xl">
                <h2 className="text-4xl font-black text-center text-gray-800 mb-12 pb-4 border-b-4 border-indigo-600">
                  Detalhamento das Coberturas
                </h2>

                {/* Sucessão */}
                {formData.modulos.sucessao && (
                  <div className="mb-12 border-l-8 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📋</span>
                      </div>
                      <h3 className="text-3xl font-black text-purple-900">Sucessão</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-purple-600 mb-6">
                      {formatarMoeda(analiseGerada.sucessao)}
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      <strong>Custos de inventário:</strong><br/>
                      ITCMD - Imposto sobre Transmissão Causa Mortis e Doação ({formData.parametros.itcmd}%) + 
                      cartório ({formData.parametros.cartorio}%) + 
                      advogado ({formData.parametros.advogado}%) = 
                      <strong> {analiseGerada.taxaTotal}% do patrimônio</strong>
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
                      <h4 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>❓</span> Por que essa proteção?
                      </h4>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Quando uma pessoa falece, seus bens ficam indisponíveis até a conclusão do inventário, 
                        que pode durar anos. Além disso, há custos significativos que reduzem o patrimônio deixado para a família.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>ITCMD - Imposto sobre Transmissão Causa Mortis e Doação ({formData.parametros.itcmd}%) + cartório ({formData.parametros.cartorio}%) + advogado ({formData.parametros.advogado}%)</li>
                        <li>Custos cartoriais podem chegar a 1-3% do patrimônio</li>
                        <li>Processo de inventário pode durar de 6 meses a 3 anos</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-6 rounded-lg">
                      <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Para você especificamente
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Número mágico familiar</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Apenas {((analiseGerada.patrimonioFinanceiro / analiseGerada.sucessao) * 100).toFixed(0)}% do necessário 
                              ({formatarMoeda(analiseGerada.patrimonioFinanceiro)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              100% completo ({formatarMoeda(analiseGerada.sucessao)})
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Renda passiva mensal</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              {formatarMoeda(analiseGerada.rendaPassivaSucessao)}/mês - insuficiente
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              {formatarMoeda(analiseGerada.rendaPassivaSucessaoIdeal)}/mês - vida garantida
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Proteção Familiar */}
              {formData.modulos.protecao_familiar && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">❤️</span>
                      </div>
                      <h3 className="text-3xl font-black text-green-900">Proteção Familiar</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-green-600 mb-6">
                      {formatarMoeda(analiseGerada.protecaoFamiliar)}
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Capital para gerar 80% da renda mensal atual (desconto de 20% pelo custo da pessoa falecida).<br/>
                      <strong>Mantém o padrão de vida da sua família por {analiseGerada.anosProtecao} anos.</strong>
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
                      <h4 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>❓</span> Por que essa proteção?
                      </h4>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        A perda do principal provedor pode comprometer drasticamente o padrão de vida da família, 
                        especialmente quando há dependentes e compromissos financeiros de longo prazo.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>65% das famílias brasileiras dependem de um único provedor principal</li>
                        <li>Padrão de vida familiar pode cair 70% com a perda do provedor</li>
                        <li>Famílias com filhos pequenos precisam de 10-15 anos de proteção integral</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-6 rounded-lg">
                      <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Para você especificamente
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Número mágico familiar</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Apenas {((analiseGerada.patrimonioFinanceiro / analiseGerada.protecaoFamiliar) * 100).toFixed(0)}% do necessário 
                              ({formatarMoeda(analiseGerada.patrimonioFinanceiro)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              100% completo ({formatarMoeda(analiseGerada.protecaoFamiliar)})
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Renda passiva mensal</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              {formatarMoeda(analiseGerada.rendaPassivaFamiliar)}/mês - insuficiente
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              {formatarMoeda(analiseGerada.rendaMensal80)}/mês - vida garantida
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Doenças Graves */}
              {formData.modulos.doencas_graves && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-red-500 bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">💔</span>
                      </div>
                      <h3 className="text-3xl font-black text-red-900">Doenças Graves</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-red-600 mb-6">
                      {formatarMoeda(analiseGerada.doencasGraves)}
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Cobertura de até {formData.parametros.doencas_graves_meses} meses da sua renda/despesa para garantir seu padrão de vida e dar 
                      tranquilidade enquanto você se recupera.<br/>
                      <strong>Além da redução ou interrupção temporária de sua renda, o tratamento de doenças graves pode 
                      ainda aumentar as suas despesas.</strong>
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
                      <h4 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>❓</span> Por que essa proteção?
                      </h4>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Doenças graves como câncer, infarto e AVC têm alta incidência e podem gerar custos elevados, 
                        além de reduzir significativamente a capacidade de trabalho e renda.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Estima-se que um em cada cinco homens ou mulheres desenvolverão câncer durante suas vidas</li>
                        <li>Custo médio de tratamento de câncer no Brasil: R$ 200 mil a R$ 500 mil</li>
                        <li>70% dos pacientes com doenças graves reduzem sua renda durante tratamento</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-6 rounded-lg">
                      <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Para você especificamente
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Durante o tratamento</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Consumo de {formatarMoeda(analiseGerada.gastos * formData.parametros.doencas_graves_meses)} das reservas
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              {formatarMoeda(analiseGerada.doencasGraves)} disponível imediatamente
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Escolha do tratamento</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Limitado ao que o plano cobre ou pode pagar
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              Liberdade para os melhores especialistas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invalidez Total */}
              {formData.modulos.invalidez && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">🦽</span>
                      </div>
                      <h3 className="text-3xl font-black text-orange-900">Invalidez Total</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-orange-600 mb-6">
                      {formatarMoeda(analiseGerada.invalidezTotal)}
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Garantia de independência financeira permanente em caso de perda da capacidade de trabalhar.<br/>
                      <strong>Uma incapacidade permanente para o trabalho interrompe completamente sua renda. 
                      Este capital garante sua independência financeira.</strong>
                    </p>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-6 rounded-lg">
                      <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Para você especificamente
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Adaptações necessárias</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Família custeia reformas e equipamentos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              {formatarMoeda(analiseGerada.invalidezTotal)} para todas as adaptações
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Manutenção da dignidade</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Dependência de terceiros e doações
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              Independência financeira preservada
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Incapacidade Temporária */}
              {formData.modulos.incapacidade_temporaria && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📋</span>
                      </div>
                      <h3 className="text-3xl font-black text-blue-900">Renda por Incapacidade Temporária</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-blue-600 mb-6">
                      {formatarMoeda(analiseGerada.diariaIncapacidade)}/dia
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Esta cobertura fornece substituição de renda diária enquanto você estiver 
                      temporariamente impossibilitado de trabalhar devido a doença ou acidente.
                    </p>
                  </div>
                </div>
              )}

              {/* Diária de Internação */}
              {formData.modulos.diaria_internacao && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-pink-500 bg-gradient-to-r from-pink-50 to-rose-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">🏥</span>
                      </div>
                      <h3 className="text-3xl font-black text-pink-900">Diária de Internação Hospitalar</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-pink-600 mb-6">
                      {formatarMoeda(analiseGerada.diariaInternacao)}/dia
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Isso fornece um benefício diário para ajudar a cobrir despesas durante internações hospitalares.
                    </p>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-6 rounded-lg">
                      <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Para você especificamente
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Renda durante internação</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Perda de {formatarMoeda(analiseGerada.renda / 30)}/dia
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              {formatarMoeda(analiseGerada.diariaInternacao)}/dia garantidos
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Despesas do acompanhante</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Família arca com custos extras
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              Diária cobre todas as despesas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cirurgias */}
              {formData.modulos.cirurgias && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">🩺</span>
                      </div>
                      <h3 className="text-3xl font-black text-teal-900">Cirurgias</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-teal-600 mb-6">
                      {formatarMoeda(analiseGerada.cirurgias)}
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Cobertura para procedimentos cirúrgicos simples ou de alta complexidade listados pelo seguro.<br/>
                      <strong>Essa cobertura pode complementar um plano de saúde ou ser a única proteção para quem não o tem, 
                      e o valor pode ser usado livremente para cobrir custos de medicamentos, tratamentos, e recompor a renda.</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Assistência Funeral */}
              {formData.modulos.assistencia_funeral && (
                <div className="pdf-page bg-white p-12 rounded-xl">
                  <div className="mb-12 border-l-8 border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-r-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">⛪</span>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900">Assistência Funeral</h3>
                    </div>
                    
                    <p className="text-5xl font-black text-gray-600 mb-6">
                      {formatarMoeda(analiseGerada.assistenciaFuneral)}
                    </p>
                    
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      Plano Familiar<br/>
                      <strong>Em momentos difíceis, sua família não deve se preocupar com despesas.</strong>
                    </p>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-6 rounded-lg">
                      <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Para você especificamente
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Momento do luto</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              Sua família paga {formatarMoeda(analiseGerada.assistenciaFuneral)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              Seguradora cobre 100% dos custos
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Impacto financeiro</p>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">
                              {Math.ceil(analiseGerada.assistenciaFuneral / analiseGerada.gastos)} meses de despesas comprometidas
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">
                              Zero impacto no orçamento familiar
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso Final e Encerramento */}
              <div className="pdf-page bg-white p-12 rounded-xl space-y-8">
                {/* Aviso Importante */}
                <div className="border-4 border-red-400 bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl shadow-xl">
                  <h3 className="text-3xl font-black text-red-800 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-10 h-10" />
                    AVISO IMPORTANTE
                  </h3>
                  <div className="space-y-4 text-gray-800 text-lg leading-relaxed">
                    <p>
                      <strong>Este documento apresenta uma análise de necessidades de proteção financeira</strong>, elaborado com 
                      base nas informações fornecidas pelo cliente. Os valores e coberturas aqui apresentados são 
                      sugestões orientativas e podem variar significativamente dependendo da seguradora, do produto 
                      contratado e das condições específicas de cada apólice.
                    </p>
                    <p>
                      <strong>Não constitui proposta comercial vinculante.</strong> As coberturas, valores de prêmio, carências, 
                      exclusões e demais condições devem ser consultadas diretamente com as seguradoras ou corretores 
                      autorizados. Diferentes seguradoras podem oferecer produtos com características, preços e 
                      condições distintas para as mesmas necessidades identificadas nesta análise.
                    </p>
                    <p>
                      <strong>Este estudo tem finalidade exclusivamente educacional e consultiva</strong>, visando auxiliar na 
                      compreensão das necessidades de proteção financeira. Como especialista com mais de 20 anos de experiência 
                      no mercado de seguros, recomendo sempre consultar um corretor qualificado antes de tomar qualquer decisão de contratação.
                    </p>
                    <p className="text-base italic text-gray-600 mt-4">
                      Os cálculos apresentados foram realizados seguindo metodologia técnica reconhecida pelo mercado segurador, 
                      considerando sua situação familiar, financeira e expectativa de vida. Cada família é única, 
                      e esta análise foi personalizada especialmente para você.
                    </p>
                  </div>
                </div>

                {/* Call to Action Final */}
                <div className="text-center py-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl text-white shadow-2xl">
                  <h2 className="text-5xl font-black mb-6">Proteja seu futuro hoje mesmo</h2>
                  <p className="text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
                    Nossa análise identificou os riscos específicos do seu perfil e criou 
                    uma proteção sob medida para você e sua família.
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm inline-block px-8 py-4 rounded-xl mb-8">
                    <p className="text-xl font-semibold">
                      Entre em contato para uma proposta personalizada
                    </p>
                  </div>
                  <p className="text-sm opacity-80">
                    Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                  </p>
                  <p className="text-xs opacity-70 mt-2">
                    Análise Personalizada de Seguro de Vida | Consultor: {user?.full_name || "MetLife Seguros"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}