import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Calculator, Download, FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CalculadoraRapida() {
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [showConfigAvancadas, setShowConfigAvancadas] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analiseGerada, setAnaliseGerada] = useState(null);
  const [buscaCliente, setBuscaCliente] = useState("");

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
    imc_manual: "",
    fumou_12_meses: false,
    condicao_saude: false,
    template: "padrao",
    modulos: {
      sucessao: true,
      protecao_familiar: true,
      doencas_graves: true,
      cirurgias: true,
      fratura_ossea: true,
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
      cobertura_cirurgias: 100000,
      fator_multiplicador: 100,
      assistencia_funeral_valor: 10000,
      itcmd: 8,
      cartorio: 2,
      advogado: 5,
      protecao_familiar_tipo: "individual",
      protecao_familiar_valor: 5000,
      diaria_internacao_valor: 500,
      fratura_ossea_valor: 100000
    }
  };

  const [formData, setFormData] = useState(formDataInicial);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-calculadora", user?.email],
    queryFn: () => base44.entities.Cliente.filter({ created_by: user.email }),
    enabled: !!user?.email
  });

  // Lista de clientes ordenada alfabeticamente e filtrada pela busca
  const clientesFiltrados = useMemo(() => {
    const sorted = [...clientes].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    if (!buscaCliente.trim()) return sorted;
    const termo = buscaCliente.toLowerCase();
    return sorted.filter(c =>
      (c.nome || "").toLowerCase().includes(termo) ||
      (c.email || "").toLowerCase().includes(termo) ||
      (c.telefone || "").toLowerCase().includes(termo)
    );
  }, [clientes, buscaCliente]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const parseValorMonetario = (valor) => {
    if (!valor) return 0;
    const valorLimpo = valor.toString()
      .replace(/R\$/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');
    return parseFloat(valorLimpo) || 0;
  };

  const calcularDependentes = (cliente) => {
    let deps = 0;
    const hoje = new Date();
    // Filhos menores de 18
    if (cliente.filhos_info && cliente.filhos_info.length > 0) {
      for (const filho of cliente.filhos_info) {
        if (filho.data_nascimento) {
          const nascFilho = new Date(filho.data_nascimento);
          const idadeFilho = hoje.getFullYear() - nascFilho.getFullYear();
          const mesFilho = hoje.getMonth() - nascFilho.getMonth();
          const idadeReal = mesFilho < 0 || (mesFilho === 0 && hoje.getDate() < nascFilho.getDate()) ? idadeFilho - 1 : idadeFilho;
          if (idadeReal < 18) deps++;
        }
      }
    } else if (cliente.filhos) {
      // Fallback: se não tiver info detalhada, usar o número de filhos
      const numFilhos = parseInt(cliente.filhos);
      if (!isNaN(numFilhos)) deps += numFilhos;
    }
    // Cônjuge conta como +1 dependente
    const ec = (cliente.estado_civil || "").toLowerCase();
    if (ec.includes("casado") || ec.includes("casada")) {
      deps += 1;
    }
    return deps;
  };

  const handleClienteChange = (clienteId) => {
    setClienteSelecionado(clienteId);
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      const deps = calcularDependentes(cliente);
      setFormData(prev => ({
        ...prev,
        data_nascimento: cliente.data_nascimento || "",
        estado_civil: cliente.estado_civil || "",
        profissao: cliente.profissao || "",
        genero: cliente.genero || prev.genero,
        renda_mensal: cliente.renda || "",
        gastos_mensais: cliente.custo_mensal_fixo || "",
        patrimonio_bruto: cliente.patrimonio || "",
        patrimonio_financeiro: prev.patrimonio_financeiro,
        altura: cliente.altura || "",
        peso: cliente.peso || "",
        imc_manual: cliente.imc || "",
        fumou_12_meses: (cliente.fuma || "").toLowerCase() === "sim",
        condicao_saude: prev.condicao_saude,
        dependentes: deps
      }));
    }
  };

  const limparCalculadora = () => {
    setFormData(formDataInicial);
    setClienteSelecionado("");
    setAnaliseGerada(null);
    setBuscaCliente("");
  };

  const imc = useMemo(() => {
    if (formData.imc_manual) return parseFloat(formData.imc_manual).toFixed(1);
    if (formData.altura && formData.peso) {
      const alturaM = parseFloat(formData.altura) / 100;
      const pesoKg = parseFloat(formData.peso);
      if (alturaM > 0 && pesoKg > 0) return (pesoKg / (alturaM * alturaM)).toFixed(1);
    }
    return "";
  }, [formData.altura, formData.peso, formData.imc_manual]);

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
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const getMomentoVida = (idade, dependentes, estadoCivil) => {
    if (idade >= 55) return "Momento crucial para garantir sucessão e legado";
    if (idade >= 45) return "Momento de consolidação patrimonial e planejamento sucessório";
    if (dependentes > 0) return "Momento de proteger os dependentes e garantir educação";
    if ((estadoCivil || "").toLowerCase().includes("casado")) return "Momento de construir proteção familiar";
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

  const calcularProtecao = () => {
    const idade = calcularIdade(formData.data_nascimento);
    const renda = parseValorMonetario(formData.renda_mensal);
    const gastos = parseValorMonetario(formData.gastos_mensais);
    const patrimonioBruto = parseValorMonetario(formData.patrimonio_bruto);
    const patrimonioFinanceiro = parseValorMonetario(formData.patrimonio_financeiro);
    const base = formData.parametros.calcular_sobre === "renda" ? renda : gastos;
    const anosProtecao = Math.max(formData.parametros.idade_aposentadoria - idade, 1);

    // Sucessão: ITCMD + Advogado + Cartório => % do patrimônio
    const taxaTotal = (formData.parametros.itcmd + formData.parametros.cartorio + formData.parametros.advogado) / 100;
    const sucessao = Math.round(patrimonioBruto * taxaTotal);

    // Proteção Familiar: valor fixo selecionado pelo tipo
    const protecaoFamiliar = formData.parametros.protecao_familiar_valor;

    // Doenças Graves: 18 a 24 vezes o rendimento mensal
    const doencasGraves = Math.round(renda * formData.parametros.doencas_graves_meses);

    // Invalidez: rendimento mensal - 20%, resultado * 100
    const rendaReduzida20 = renda * 0.8;
    const invalidezTotal = Math.round(rendaReduzida20 * 100);

    // Incapacidade Temporária: renda mensal / 30
    const diariaIncapacidade = Math.round(renda / 30);

    // Diária de Internação: valor selecionado (200 a 1000)
    const diariaInternacao = formData.parametros.diaria_internacao_valor;

    // Cirurgias: mesmo valor de fratura óssea
    const cirurgias = formData.parametros.fratura_ossea_valor;

    // Fratura Óssea: fixo 100.000
    const fraturaOssea = formData.parametros.fratura_ossea_valor;

    // Assistência Funeral
    const assistenciaFuneral = formData.parametros.assistencia_funeral_valor;

    let total = 0;
    if (formData.modulos.sucessao) total += sucessao;
    if (formData.modulos.protecao_familiar) total += protecaoFamiliar;
    if (formData.modulos.doencas_graves) total += doencasGraves;
    if (formData.modulos.invalidez) total += invalidezTotal;
    if (formData.modulos.cirurgias) total += cirurgias;
    if (formData.modulos.fratura_ossea) total += fraturaOssea;
    if (formData.modulos.assistencia_funeral) total += assistenciaFuneral;

    const fatoresRisco = getFatoresRisco(idade, formData.fumou_12_meses, formData.condicao_saude, parseFloat(imc));
    const momentoVida = getMomentoVida(idade, formData.dependentes, formData.estado_civil);

    return {
      sucessao,
      protecaoFamiliar,
      protecaoFamiliarTipo: formData.parametros.protecao_familiar_tipo,
      doencasGraves,
      doencasGravesMeses: formData.parametros.doencas_graves_meses,
      invalidezTotal,
      rendaReduzida20: Math.round(rendaReduzida20),
      diariaIncapacidade,
      diariaInternacao,
      cirurgias,
      fraturaOssea,
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
      taxaTotal: taxaTotal * 100
    };
  };

  const gerarApresentacao = async () => {
    setGenerating(true);
    const analise = calcularProtecao();
    setAnaliseGerada(analise);
    setTimeout(() => {
      setGenerating(false);
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
    const nomeArquivo = cliente ? `Analise_Seguro_${cliente.nome.replace(/\s/g, "_")}.pdf` : "Analise_Seguro.pdf";
    pdf.save(nomeArquivo);
  };

  const clienteInfo = useMemo(() => clientes.find(c => c.id === clienteSelecionado), [clienteSelecionado, clientes]);

  const PROTECAO_FAMILIAR_LABELS = {
    individual: "Individual",
    individual_conjuge: "Individual + Cônjuge",
    familiar: "Familiar",
    familiar_pais: "Familiar + Pais"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">Calculadora Rápida</h1>
              <p className="text-indigo-300 text-sm">Faça uma cotação diretamente do dashboard • Resultados instantâneos</p>
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
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Cliente com busca */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border-2 border-indigo-400">
              <Label className="text-white mb-2 block text-lg font-bold">Selecione um contato existente</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  placeholder="Buscar por nome, email ou telefone..."
                  className="pl-10 bg-white border-2 border-indigo-400 text-gray-900 font-semibold h-12"
                />
              </div>
              <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
                <SelectTrigger className="bg-white border-2 border-indigo-400 text-gray-900 font-semibold h-12 text-base shadow-lg">
                  <SelectValue placeholder="🔍 Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white">
                  {clientesFiltrados.map(c => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="text-gray-900 font-medium hover:bg-indigo-100 focus:bg-indigo-100 cursor-pointer py-2"
                    >
                      {c.nome}
                    </SelectItem>
                  ))}
                  {clientesFiltrados.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm">Nenhum cliente encontrado</div>
                  )}
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
                  className="bg-white/10 border-white/20 text-white [&:not(:placeholder-shown)]:text-white"
                />
                {formData.data_nascimento && (
                  <p className="text-xs text-indigo-300 mt-1">Idade: {calcularIdade(formData.data_nascimento)} anos</p>
                )}
              </div>
              <div>
                <Label className="text-white">Dependentes</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.dependentes}
                  onChange={(e) => setFormData({ ...formData, dependentes: parseInt(e.target.value) || 0 })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                />
                <p className="text-xs text-indigo-300 mt-1">Filhos menores de 18 + cônjuge (se casado)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Estado Civil</Label>
                <Input
                  value={formData.estado_civil}
                  onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="Ex: Casado"
                />
              </div>
              <div>
                <Label className="text-white">Profissão</Label>
                <Input
                  value={formData.profissao}
                  onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="Ex: Aposentado"
                />
              </div>
            </div>

            {/* Dados Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Renda Mensal Estimada (R$)</Label>
                <Input
                  value={formData.renda_mensal}
                  onChange={(e) => setFormData({ ...formData, renda_mensal: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="R$ 35.000"
                />
              </div>
              <div>
                <Label className="text-white">Custo Mensal Fixo Total (R$)</Label>
                <Input
                  value={formData.gastos_mensais}
                  onChange={(e) => setFormData({ ...formData, gastos_mensais: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="R$ 20.000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Patrimônio (R$)</Label>
                <Input
                  value={formData.patrimonio_bruto}
                  onChange={(e) => setFormData({ ...formData, patrimonio_bruto: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="R$ 2.000.000"
                />
              </div>
              <div>
                <Label className="text-white">Patrimônio Financeiro (R$)</Label>
                <Input
                  value={formData.patrimonio_financeiro}
                  onChange={(e) => setFormData({ ...formData, patrimonio_financeiro: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="R$ 100.000"
                />
              </div>
            </div>

            {/* Dados de Saúde */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-white">Altura (cm)</Label>
                <Input
                  value={formData.altura}
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="174"
                />
              </div>
              <div>
                <Label className="text-white">Peso (kg)</Label>
                <Input
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="90"
                />
              </div>
              <div>
                <Label className="text-white">IMC</Label>
                <Input
                  value={formData.imc_manual || imc}
                  onChange={(e) => setFormData({ ...formData, imc_manual: e.target.value })}
                  className="bg-white border-indigo-300 text-gray-900 font-semibold"
                  placeholder="Auto"
                />
              </div>
              <div>
                <Label className="text-white">Status</Label>
                <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white h-9 flex items-center">
                  {imc ? statusIMC : "—"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch checked={formData.fumou_12_meses} onCheckedChange={(v) => setFormData({ ...formData, fumou_12_meses: v })} />
                <Label className="text-white">Fumou nos últimos 12 meses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={formData.condicao_saude} onCheckedChange={(v) => setFormData({ ...formData, condicao_saude: v })} />
                <Label className="text-white">Diabetes, Pressão Alta ou outro fator de saúde</Label>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="border-t border-white/10 pt-6">
              <Button variant="ghost" onClick={() => setShowConfigAvancadas(!showConfigAvancadas)} className="text-white hover:bg-white/10 w-full justify-between">
                <span className="flex items-center gap-2">⚙️ Parâmetros de Cálculo</span>
                {showConfigAvancadas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <AnimatePresence>
                {showConfigAvancadas && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 space-y-6">
                    {/* Módulos Visíveis */}
                    <div>
                      <Label className="text-white mb-3 block">Módulos Visíveis</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries({
                          sucessao: "Sucessão",
                          protecao_familiar: "Proteção Familiar",
                          doencas_graves: "Doenças Graves",
                          cirurgias: "Cirurgias",
                          fratura_ossea: "Fratura Óssea",
                          diaria_internacao: "Diária de Internação",
                          incapacidade_temporaria: "Incapacidade Temporária",
                          invalidez: "Invalidez",
                          assistencia_funeral: "Assistência Funeral"
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                            <Label className="text-white text-sm">{label}</Label>
                            <Switch
                              checked={formData.modulos[key]}
                              onCheckedChange={(v) => setFormData({ ...formData, modulos: { ...formData.modulos, [key]: v } })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Parâmetros de Sucessão */}
                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4 space-y-3">
                      <Label className="text-purple-200 font-bold">Sucessão - Percentuais de Inventário</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-white text-sm">ITCMD (%)</Label>
                          <Input type="number" step="0.5" value={formData.parametros.itcmd}
                            onChange={(e) => setFormData({ ...formData, parametros: { ...formData.parametros, itcmd: parseFloat(e.target.value) || 0 } })}
                            className="bg-white border-purple-300 text-gray-900 font-semibold" />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Advogado (%)</Label>
                          <Input type="number" step="0.5" value={formData.parametros.advogado}
                            onChange={(e) => setFormData({ ...formData, parametros: { ...formData.parametros, advogado: parseFloat(e.target.value) || 0 } })}
                            className="bg-white border-purple-300 text-gray-900 font-semibold" />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Cartório (%)</Label>
                          <Input type="number" step="0.5" value={formData.parametros.cartorio}
                            onChange={(e) => setFormData({ ...formData, parametros: { ...formData.parametros, cartorio: parseFloat(e.target.value) || 0 } })}
                            className="bg-white border-purple-300 text-gray-900 font-semibold" />
                        </div>
                      </div>
                      <p className="text-xs text-purple-200">Total: {(formData.parametros.itcmd + formData.parametros.advogado + formData.parametros.cartorio).toFixed(1)}% — Será multiplicado pelo patrimônio bruto</p>
                    </div>

                    {/* Proteção Familiar */}
                    <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 space-y-3">
                      <Label className="text-green-200 font-bold">Proteção Familiar</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white text-sm">Tipo</Label>
                          <Select value={formData.parametros.protecao_familiar_tipo} onValueChange={(v) => setFormData({ ...formData, parametros: { ...formData.parametros, protecao_familiar_tipo: v } })}>
                            <SelectTrigger className="bg-white border-green-300 text-gray-900 font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="individual_conjuge">Individual + Cônjuge</SelectItem>
                              <SelectItem value="familiar">Familiar</SelectItem>
                              <SelectItem value="familiar_pais">Familiar + Pais</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white text-sm">Valor (R$)</Label>
                          <Select value={formData.parametros.protecao_familiar_valor.toString()} onValueChange={(v) => setFormData({ ...formData, parametros: { ...formData.parametros, protecao_familiar_valor: parseInt(v) } })}>
                            <SelectTrigger className="bg-white border-green-300 text-gray-900 font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5000">R$ 5.000,00</SelectItem>
                              <SelectItem value="7000">R$ 7.000,00</SelectItem>
                              <SelectItem value="10000">R$ 10.000,00</SelectItem>
                              <SelectItem value="15000">R$ 15.000,00</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Doenças Graves */}
                    <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 space-y-3">
                      <Label className="text-red-200 font-bold">Doenças Graves</Label>
                      <div>
                        <Label className="text-white text-sm">Multiplicador (meses de renda)</Label>
                        <Select value={formData.parametros.doencas_graves_meses.toString()} onValueChange={(v) => setFormData({ ...formData, parametros: { ...formData.parametros, doencas_graves_meses: parseInt(v) } })}>
                          <SelectTrigger className="bg-white border-red-300 text-gray-900 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18">18 meses</SelectItem>
                            <SelectItem value="19">19 meses</SelectItem>
                            <SelectItem value="20">20 meses</SelectItem>
                            <SelectItem value="21">21 meses</SelectItem>
                            <SelectItem value="22">22 meses</SelectItem>
                            <SelectItem value="23">23 meses</SelectItem>
                            <SelectItem value="24">24 meses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Diária de Internação */}
                    <div className="bg-pink-500/10 border border-pink-400/30 rounded-xl p-4 space-y-3">
                      <Label className="text-pink-200 font-bold">Diária de Internação</Label>
                      <div>
                        <Label className="text-white text-sm">Valor diário (R$)</Label>
                        <Select value={formData.parametros.diaria_internacao_valor.toString()} onValueChange={(v) => setFormData({ ...formData, parametros: { ...formData.parametros, diaria_internacao_valor: parseInt(v) } })}>
                          <SelectTrigger className="bg-white border-pink-300 text-gray-900 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[200, 300, 400, 500, 600, 700, 800, 900, 1000].map(v => (
                              <SelectItem key={v} value={v.toString()}>R$ {v.toLocaleString('pt-BR')},00</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fratura Óssea */}
                    <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 space-y-3">
                      <Label className="text-amber-200 font-bold">Fratura Óssea</Label>
                      <p className="text-xs text-amber-200">Valor fixo de R$ 100.000,00 — Percentual pago conforme tabela de fraturas</p>
                    </div>

                    {/* Outros parâmetros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white text-sm">Assistência Funeral (R$)</Label>
                        <Input type="number" value={formData.parametros.assistencia_funeral_valor}
                          onChange={(e) => setFormData({ ...formData, parametros: { ...formData.parametros, assistencia_funeral_valor: parseInt(e.target.value) || 0 } })}
                          className="bg-white border-indigo-300 text-gray-900 font-semibold" />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Idade da Aposentadoria</Label>
                        <Input type="number" value={formData.parametros.idade_aposentadoria}
                          onChange={(e) => setFormData({ ...formData, parametros: { ...formData.parametros, idade_aposentadoria: parseInt(e.target.value) || 65 } })}
                          className="bg-white border-indigo-300 text-gray-900 font-semibold" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button onClick={gerarApresentacao} disabled={generating} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-6 text-lg">
                {generating ? "Gerando Análise..." : "Gerar Análise Completa"}
              </Button>
              <Button onClick={limparCalculadora} variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold py-6 px-8">Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {analiseGerada && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Button onClick={downloadPDF} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6">
              <Download className="w-5 h-5 mr-2" /> Baixar Apresentação (PDF)
            </Button>

            <div id="apresentacao-completa" className="space-y-4">
              {/* Página 1 - Capa */}
              <div className="pdf-page bg-white p-8 md:p-12 rounded-xl space-y-8">
                <div className="text-center py-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white">
                  <h1 className="text-4xl md:text-5xl font-black mb-4">Análise de Necessidades de Proteção</h1>
                  <p className="text-xl md:text-2xl mb-6 opacity-90">Estudo Personalizado de Seguro de Vida</p>
                  {clienteInfo && <p className="text-lg opacity-80 mb-4">Cliente: {clienteInfo.nome}</p>}
                  <div className="bg-white/20 backdrop-blur-sm inline-block px-8 py-4 rounded-xl">
                    <p className="text-xl font-bold">Apresentado por: {user?.full_name || "Consultor"}</p>
                  </div>
                </div>

                {/* Contexto */}
                <div className="border-l-8 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-r-2xl">
                  <h2 className="text-2xl font-black text-gray-800 mb-4">📊 Contexto Personalizado</h2>
                  <div className="space-y-2 text-lg text-gray-800">
                    <p><strong className="text-orange-700">Situação Familiar:</strong> {formData.estado_civil || "—"}, {formData.dependentes} dependente(s)</p>
                    <p><strong className="text-orange-700">Momento de Vida:</strong> {analiseGerada.momentoVida}</p>
                    <p><strong className="text-orange-700">Fatores de Risco:</strong> {analiseGerada.fatoresRisco.length > 0 ? analiseGerada.fatoresRisco.join(", ") : "Nenhum identificado"}</p>
                  </div>
                </div>

                {/* Total */}
                <div className="text-center py-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-4 border-indigo-200">
                  <h3 className="text-gray-600 text-2xl mb-4">Proteção Total Recomendada</h3>
                  <p className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                    {formatarMoeda(analiseGerada.total)}
                  </p>
                </div>

                {/* Perfil */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
                    <h3 className="text-xl font-black text-blue-900 mb-3">👤 Perfil Pessoal</h3>
                    <div className="space-y-1 text-gray-700">
                      <p><strong>Idade:</strong> {analiseGerada.idade} anos</p>
                      <p><strong>Estado Civil:</strong> {formData.estado_civil || "—"}</p>
                      <p><strong>Profissão:</strong> {formData.profissao || "—"}</p>
                      <p><strong>Dependentes:</strong> {formData.dependentes}</p>
                      {analiseGerada.imc > 0 && <p><strong>IMC:</strong> {analiseGerada.imc} - {analiseGerada.statusIMC}</p>}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                    <h3 className="text-xl font-black text-green-900 mb-3">💰 Situação Financeira</h3>
                    <div className="space-y-1 text-gray-700">
                      <p><strong>Renda Mensal:</strong> {formatarMoeda(analiseGerada.renda)}</p>
                      <p><strong>Gastos Mensais:</strong> {formatarMoeda(analiseGerada.gastos)}</p>
                      <p><strong>Patrimônio:</strong> {formatarMoeda(analiseGerada.patrimonioBruto)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sucessão */}
              {formData.modulos.sucessao && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-purple-900 mb-2">📋 Sucessão</h3>
                    <p className="text-5xl font-black text-purple-600 mb-4">{formatarMoeda(analiseGerada.sucessao)}</p>
                    <p className="text-gray-700 text-lg mb-4">
                      <strong>Custos de inventário:</strong><br/>
                      ITCMD ({formData.parametros.itcmd}%) + Advogado ({formData.parametros.advogado}%) + Cartório ({formData.parametros.cartorio}%) = <strong>{analiseGerada.taxaTotal.toFixed(1)}% do patrimônio</strong>
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-gray-700">Quando uma pessoa falece, seus bens ficam indisponíveis até a conclusão do inventário. Este capital cobre os custos de ITCMD, advogado e cartório para realizar o inventário e a devida sucessão patrimonial.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Proteção Familiar */}
              {formData.modulos.protecao_familiar && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-green-900 mb-2">❤️ Proteção Familiar</h3>
                    <p className="text-5xl font-black text-green-600 mb-4">{formatarMoeda(analiseGerada.protecaoFamiliar)}</p>
                    <p className="text-gray-700 text-lg mb-4">
                      <strong>Tipo:</strong> {PROTECAO_FAMILIAR_LABELS[analiseGerada.protecaoFamiliarTipo] || analiseGerada.protecaoFamiliarTipo}<br/>
                      <strong>Cobertura de assistência familiar para garantir tranquilidade em momentos difíceis.</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Doenças Graves */}
              {formData.modulos.doencas_graves && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-red-500 bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-red-900 mb-2">💔 Doenças Graves</h3>
                    <p className="text-5xl font-black text-red-600 mb-4">{formatarMoeda(analiseGerada.doencasGraves)}</p>
                    <p className="text-gray-700 text-lg mb-4">
                      Cobertura de <strong>{analiseGerada.doencasGravesMeses} vezes o rendimento mensal</strong> ({formatarMoeda(analiseGerada.renda)}).<br/>
                      Garante seu padrão de vida durante o tratamento de doenças como câncer, infarto e AVC.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-gray-700">Estima-se que um em cada cinco homens ou mulheres desenvolverão câncer. 70% dos pacientes com doenças graves reduzem sua renda durante o tratamento.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invalidez */}
              {formData.modulos.invalidez && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-orange-900 mb-2">🦽 Invalidez</h3>
                    <p className="text-5xl font-black text-orange-600 mb-4">{formatarMoeda(analiseGerada.invalidezTotal)}</p>
                    <p className="text-gray-700 text-lg mb-4">
                      <strong>Cálculo:</strong> Renda mensal ({formatarMoeda(analiseGerada.renda)}) - 20% de queda = {formatarMoeda(analiseGerada.rendaReduzida20)}/mês × 100 = {formatarMoeda(analiseGerada.invalidezTotal)}<br/><br/>
                      Este capital, aplicado a 1% ao mês, gera um rendimento mensal de <strong>{formatarMoeda(analiseGerada.invalidezTotal * 0.01)}</strong>, que se equipara à renda mensal reduzida de 20% pela tendência natural da invalidez.
                    </p>
                  </div>
                </div>
              )}

              {/* Incapacidade Temporária */}
              {formData.modulos.incapacidade_temporaria && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-blue-900 mb-2">📋 Renda por Incapacidade Temporária</h3>
                    <p className="text-5xl font-black text-blue-600 mb-4">{formatarMoeda(analiseGerada.diariaIncapacidade)}/dia</p>
                    <p className="text-gray-700 text-lg mb-4">
                      <strong>Cálculo:</strong> Renda mensal ({formatarMoeda(analiseGerada.renda)}) ÷ 30 = {formatarMoeda(analiseGerada.diariaIncapacidade)}/dia
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                      <p className="text-gray-700"><strong>⚠️ Importante:</strong> Para este benefício, o valor da renda mensal precisa ser comprovado documentalmente.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Diária de Internação */}
              {formData.modulos.diaria_internacao && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-pink-500 bg-gradient-to-r from-pink-50 to-rose-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-pink-900 mb-2">🏥 Diária de Internação Hospitalar</h3>
                    <p className="text-5xl font-black text-pink-600 mb-4">{formatarMoeda(analiseGerada.diariaInternacao)}/dia</p>
                    <p className="text-gray-700 text-lg">Benefício diário para cobrir despesas extras durante internações hospitalares, como alimentação, transporte e acompanhante.</p>
                  </div>
                </div>
              )}

              {/* Cirurgias */}
              {formData.modulos.cirurgias && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-teal-900 mb-2">🩺 Cirurgias</h3>
                    <p className="text-5xl font-black text-teal-600 mb-4">{formatarMoeda(analiseGerada.cirurgias)}</p>
                    <p className="text-gray-700 text-lg">Cobertura para procedimentos cirúrgicos — valor equivalente à cobertura de Fratura Óssea. Pode complementar plano de saúde ou ser a única proteção. O valor pode ser usado livremente.</p>
                  </div>
                </div>
              )}

              {/* Fratura Óssea */}
              {formData.modulos.fratura_ossea && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-amber-900 mb-2">🦴 Fratura Óssea</h3>
                    <p className="text-5xl font-black text-amber-600 mb-4">{formatarMoeda(analiseGerada.fraturaOssea)}</p>
                    <p className="text-gray-700 text-lg mb-4">
                      Em caso de acidente que resulte em fratura óssea, o segurado receberá como indenização o pagamento de um <strong>percentual do Capital Segurado</strong>, calculada e paga com base na lista de Fraturas de ossos ou grupo de ossos cobertos.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-gray-700 text-sm">* Disponível nas Condições Gerais do produto — a lista completa de fraturas e percentuais aplicáveis pode ser consultada junto à seguradora.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Assistência Funeral */}
              {formData.modulos.assistencia_funeral && (
                <div className="pdf-page bg-white p-8 md:p-12 rounded-xl">
                  <div className="border-l-8 border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-r-2xl shadow-lg">
                    <h3 className="text-3xl font-black text-gray-900 mb-2">⛪ Assistência Funeral</h3>
                    <p className="text-5xl font-black text-gray-600 mb-4">{formatarMoeda(analiseGerada.assistenciaFuneral)}</p>
                    <p className="text-gray-700 text-lg">Plano Familiar — Em momentos difíceis, sua família não deve se preocupar com despesas.</p>
                  </div>
                </div>
              )}

              {/* Aviso Final */}
              <div className="pdf-page bg-white p-8 md:p-12 rounded-xl space-y-8">
                <div className="border-4 border-red-400 bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl">
                  <h3 className="text-2xl font-black text-red-800 mb-4 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8" /> AVISO IMPORTANTE
                  </h3>
                  <div className="space-y-3 text-gray-800 leading-relaxed">
                    <p><strong>Este documento apresenta uma análise de necessidades de proteção financeira</strong>, elaborado com base nas informações fornecidas pelo cliente. Os valores e coberturas aqui apresentados são sugestões orientativas.</p>
                    <p><strong>Não constitui proposta comercial vinculante.</strong> As coberturas, valores de prêmio, carências, exclusões e demais condições devem ser consultadas diretamente com as seguradoras.</p>
                    <p><strong>Este estudo tem finalidade exclusivamente educacional e consultiva.</strong></p>
                  </div>
                </div>

                <div className="text-center py-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl text-white">
                  <h2 className="text-4xl font-black mb-4">Proteja seu futuro hoje mesmo</h2>
                  <p className="text-xl mb-6 max-w-2xl mx-auto">Entre em contato para uma proposta personalizada</p>
                  <p className="text-sm opacity-80">Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                  <p className="text-xs opacity-70 mt-2">Consultor: {user?.full_name || "Consultor"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}