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
import { Calculator, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CalculadoraRapida() {
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [showConfigAvancadas, setShowConfigAvancadas] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analiseGerada, setAnaliseGerada] = useState(null);

  const [formData, setFormData] = useState({
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
      assistencia_funeral: "individual"
    }
  });

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
      return (pesoKg / (alturaM * alturaM)).toFixed(1);
    }
    return "";
  }, [formData.altura, formData.peso]);

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

  const handleClienteChange = (clienteId) => {
    setClienteSelecionado(clienteId);
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        data_nascimento: cliente.data_nascimento || "",
        estado_civil: cliente.estado_civil || "",
        profissao: cliente.profissao || "",
        renda_mensal: cliente.renda || "",
        altura: cliente.altura || "",
        peso: cliente.peso || "",
        dependentes: cliente.filhos ? parseInt(cliente.filhos) : 0
      }));
    }
  };

  const calcularProtecao = () => {
    const idade = calcularIdade(formData.data_nascimento);
    const renda = parseFloat(formData.renda_mensal?.replace(/\D/g, "") || "0");
    const gastos = parseFloat(formData.gastos_mensais?.replace(/\D/g, "") || "0");
    const patrimonioBruto = parseFloat(formData.patrimonio_bruto?.replace(/\D/g, "") || "0");
    const base = formData.parametros.calcular_sobre === "renda" ? renda : gastos;

    // Cálculos
    const sucessao = patrimonioBruto * 0.115; // ITCMD 4% + cartório 1.5% + advogado 6%
    const protecaoFamiliar = base * 0.8 * (formData.parametros.idade_aposentadoria - idade) * 12 * 0.7;
    const doencasGraves = base * formData.parametros.doencas_graves_meses * (formData.parametros.fator_multiplicador / 100);
    const invalidezTotal = base * 12 * (formData.parametros.idade_aposentadoria - idade) * (formData.parametros.fator_multiplicador / 100);
    const diariaIncapacidade = base / 30;
    const diariaInternacao = base / 30;
    const cirurgias = formData.parametros.cobertura_cirurgias;
    const assistenciaFuneral = 10000;

    let total = 0;
    if (formData.modulos.sucessao) total += sucessao;
    if (formData.modulos.protecao_familiar) total += protecaoFamiliar;
    if (formData.modulos.doencas_graves) total += doencasGraves;
    if (formData.modulos.invalidez) total += invalidezTotal;
    if (formData.modulos.cirurgias) total += cirurgias;
    if (formData.modulos.assistencia_funeral) total += assistenciaFuneral;

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
      renda,
      gastos,
      patrimonioBruto
    };
  };

  const gerarApresentacao = async () => {
    setGenerating(true);
    const analise = calcularProtecao();
    setAnaliseGerada(analise);
    
    setTimeout(() => {
      setGenerating(false);
    }, 1500);
  };

  const downloadPDF = async () => {
    const elemento = document.getElementById("apresentacao-completa");
    if (!elemento) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let position = 0;
    const pageHeight = 295;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      while (position < imgHeight) {
        pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
        position += pageHeight;
        if (position < imgHeight) pdf.addPage();
      }
    }

    const cliente = clientes.find(c => c.id === clienteSelecionado);
    const nomeArquivo = cliente ? 
      `Analise_Seguro_${cliente.nome.replace(/\s/g, "_")}.pdf` : 
      "Analise_Seguro.pdf";
    
    pdf.save(nomeArquivo);
  };

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
            <div>
              <Label className="text-white mb-2 block">Selecione um contato existente ou crie um novo</Label>
              <p className="text-sm text-white/60 mb-3">Busque por nome, email ou telefone para encontrar um contato existente</p>
              <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione um cliente" />
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
                  onChange={(e) => setFormData({ ...formData, renda_mensal: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="R$ 35.000"
                />
              </div>
              <div>
                <Label className="text-white">Gastos Mensais (R$)</Label>
                <Input
                  value={formData.gastos_mensais}
                  onChange={(e) => setFormData({ ...formData, gastos_mensais: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, patrimonio_bruto: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="R$ 2.000.000"
                />
              </div>
              <div>
                <Label className="text-white">Patrimônio Financeiro (R$)</Label>
                <Input
                  value={formData.patrimonio_financeiro}
                  onChange={(e) => setFormData({ ...formData, patrimonio_financeiro: e.target.value })}
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
                  {imc || "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.fumou_12_meses}
                  onCheckedChange={(v) => setFormData({ ...formData, fumou_12_meses: v })}
                />
                <Label className="text-white">Fumou nos últimos 12 meses</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.condicao_saude}
                onCheckedChange={(v) => setFormData({ ...formData, condicao_saude: v })}
              />
              <Label className="text-white">Diabetes, Pressão Alta ou outro fator de saúde</Label>
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
                            onClick={() => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, calcular_sobre: "renda" }
                            })}
                            className={formData.parametros.calcular_sobre === "renda" ? 
                              "bg-blue-600 hover:bg-blue-700" : "bg-white/10 hover:bg-white/20"}
                          >
                            Renda
                          </Button>
                          <Button
                            onClick={() => setFormData({
                              ...formData,
                              parametros: { ...formData.parametros, calcular_sobre: "despesa" }
                            })}
                            className={formData.parametros.calcular_sobre === "despesa" ? 
                              "bg-blue-600 hover:bg-blue-700" : "bg-white/10 hover:bg-white/20"}
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

            {/* Botão Gerar */}
            <Button
              onClick={gerarApresentacao}
              disabled={generating}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-6 text-lg"
            >
              {generating ? "Gerando Análise..." : "Gerar Análise Completa"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
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

            {/* Apresentação Preview */}
            <div id="apresentacao-completa" className="bg-white p-8 rounded-xl space-y-8">
              {/* Capa */}
              <div className="text-center py-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl text-white">
                <h1 className="text-5xl font-black mb-4">Análise de Necessidades de Proteção</h1>
                <p className="text-2xl mb-8">Estudo Personalizado de Seguro de Vida</p>
                <div className="bg-white/20 backdrop-blur-sm inline-block px-6 py-3 rounded-lg">
                  <p className="text-xl font-bold">Apresentado por: {user?.full_name || user?.email}</p>
                </div>
              </div>

              {/* Contexto */}
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-6 rounded-r-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Seu Contexto Personalizado</h2>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Situação Familiar:</strong> Com {formData.dependentes} dependente(s)</p>
                  <p><strong>Idade:</strong> {analiseGerada.idade} anos</p>
                  {imc && <p><strong>IMC:</strong> {imc}</p>}
                </div>
              </div>

              {/* Proteção Total */}
              <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="text-gray-600 text-xl mb-2">Proteção Total Recomendada</h3>
                <p className="text-6xl font-black text-indigo-600">
                  R$ {analiseGerada.total.toLocaleString('pt-BR')}
                </p>
                <p className="text-gray-600 mt-2">Soma de todas as coberturas sugeridas para proteção completa</p>
              </div>

              {/* Detalhamento */}
              <h2 className="text-3xl font-black text-center text-gray-800">Detalhamento das Coberturas</h2>

              {formData.modulos.sucessao && (
                <div className="border-l-4 border-purple-500 bg-white shadow-lg p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="bg-purple-500 text-white p-2 rounded-lg">📋</span>
                    Sucessão
                  </h3>
                  <p className="text-4xl font-black text-purple-600 mb-4">
                    R$ {analiseGerada.sucessao.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-gray-700">Custos de inventário: ITCMD (4%) + cartório (1.5%) + advogado (6%)</p>
                </div>
              )}

              {formData.modulos.protecao_familiar && (
                <div className="border-l-4 border-green-500 bg-white shadow-lg p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="bg-green-500 text-white p-2 rounded-lg">❤️</span>
                    Proteção Familiar
                  </h3>
                  <p className="text-4xl font-black text-green-600 mb-4">
                    R$ {analiseGerada.protecaoFamiliar.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-gray-700">Capital para manter o padrão de vida da sua família</p>
                </div>
              )}

              {formData.modulos.doencas_graves && (
                <div className="border-l-4 border-red-500 bg-white shadow-lg p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="bg-red-500 text-white p-2 rounded-lg">💔</span>
                    Doenças Graves
                  </h3>
                  <p className="text-4xl font-black text-red-600 mb-4">
                    R$ {analiseGerada.doencasGraves.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-gray-700">Cobertura de {formData.parametros.doencas_graves_meses} meses para tratamento e recuperação</p>
                </div>
              )}

              {formData.modulos.invalidez && (
                <div className="border-l-4 border-orange-500 bg-white shadow-lg p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="bg-orange-500 text-white p-2 rounded-lg">🦽</span>
                    Invalidez Total
                  </h3>
                  <p className="text-4xl font-black text-orange-600 mb-4">
                    R$ {analiseGerada.invalidezTotal.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-gray-700">Garantia de independência financeira permanente</p>
                </div>
              )}

              {/* Aviso */}
              <div className="border-2 border-red-300 bg-red-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
                  ⚠️ AVISO IMPORTANTE
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Este documento apresenta uma análise de necessidades de proteção financeira. Os valores são sugestões orientativas
                  e podem variar conforme seguradora e produto. Não constitui proposta comercial vinculante. Recomenda-se consultar
                  um corretor de seguros qualificado antes de contratar.
                </p>
              </div>

              {/* Footer */}
              <div className="text-center py-8 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl text-white">
                <h2 className="text-3xl font-black mb-4">Proteja seu futuro hoje mesmo</h2>
                <p className="text-lg">
                  Nossa análise identificou os riscos específicos do seu perfil e criou<br />
                  uma proteção sob medida para você e sua família.
                </p>
                <p className="mt-6 text-sm opacity-80">
                  Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}