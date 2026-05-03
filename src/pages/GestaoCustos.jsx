import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, Plus, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import PullToRefresh from "../components/mobile/PullToRefresh";

const CATEGORIAS_DESPESA = [
  "Alimentação", "Transporte", "Marketing", "Escritório", "Tecnologia", "Pessoal", "AGUA", "ENERGIA", "INTERNET", "GAS", "EDUCAÇÃO", "Outros"
];

const CATEGORIAS_RECEITA = [
  "Comissão", "Angariação", "Premiação", "Bônus", "Outros"
];

const TIPOS_PAGAMENTO = [
  "CARTAO CREDITO", "CARTAO DEBITO", "PIX", "DINHEIRO"
];

const COLORS_DESPESA = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981"];
const COLORS_RECEITA = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

export default function GestaoCustos() {
  const [showDialog, setShowDialog] = useState(false);
  const [mesAno, setMesAno] = useState(format(new Date(), "yyyy-MM"));
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
  const [formData, setFormData] = useState({
    tipo: "Despesa",
    categoria: "",
    descricao: "",
    valor: "",
    data: format(new Date(), "yyyy-MM-dd"),
    tipo_pagamento: "",
    parcelas: 1
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  const { data: allTransacoes = [] } = useQuery({
    queryKey: ["transacoes"],
    queryFn: () => base44.entities.Transacao.list(),
    enabled: !!currentUser
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transacao.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["transacoes"] });
      const previous = queryClient.getQueryData(["transacoes"]);
      const optimistic = { ...newData, id: `temp-${Date.now()}`, created_by: currentUser?.email, created_date: new Date().toISOString() };
      queryClient.setQueryData(["transacoes"], (old) => [...(old || []), optimistic]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["transacoes"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transacao.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["transacoes"] });
      const previous = queryClient.getQueryData(["transacoes"]);
      queryClient.setQueryData(["transacoes"], (old) => (old || []).filter(t => t.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["transacoes"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
    }
  });



  // Gestão financeira é individual - cada usuário vê apenas suas transações
  const transacoes = React.useMemo(() => {
    if (!currentUser || !allTransacoes.length) return [];
    return allTransacoes.filter(t => t.created_by === currentUser.email);
  }, [allTransacoes, currentUser]);

  // Filtrar transações do mês selecionado
  const transacoesMes = React.useMemo(() => {
    const [ano, mes] = mesAno.split("-");
    const inicio = startOfMonth(new Date(parseInt(ano), parseInt(mes) - 1));
    const fim = endOfMonth(inicio);

    return transacoes.filter(t => {
      const dataTransacao = parseISO(t.data);
      return dataTransacao >= inicio && dataTransacao <= fim;
    });
  }, [transacoes, mesAno]);

  // Calcular totais
  const resumo = React.useMemo(() => {
    const despesas = transacoesMes.filter(t => t.tipo === "Despesa");
    const receitas = transacoesMes.filter(t => t.tipo === "Receita");

    const totalDespesas = despesas.reduce((acc, t) => acc + t.valor, 0);
    const totalReceitas = receitas.reduce((acc, t) => acc + t.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    return { totalDespesas, totalReceitas, saldo, despesas, receitas };
  }, [transacoesMes]);

  // Dados para gráfico de pizza - Despesas por categoria
  const dadosGraficoDespesas = React.useMemo(() => {
    const porCategoria = {};
    resumo.despesas.forEach(d => {
      porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor;
    });

    return Object.entries(porCategoria).map(([categoria, valor]) => ({
      name: categoria,
      value: valor
    }));
  }, [resumo.despesas]);

  // Dados para gráfico de pizza - Receitas por categoria
  const dadosGraficoReceitas = React.useMemo(() => {
    const porCategoria = {};
    resumo.receitas.forEach(r => {
      porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + r.valor;
    });

    return Object.entries(porCategoria).map(([categoria, valor]) => ({
      name: categoria,
      value: valor
    }));
  }, [resumo.receitas]);

  const resetForm = () => {
    setFormData({
      tipo: "Despesa",
      categoria: "",
      descricao: "",
      valor: "",
      data: format(new Date(), "yyyy-MM-dd"),
      tipo_pagamento: "",
      parcelas: 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const valorTotal = parseFloat(formData.valor);
    
    // Se for cartão de crédito parcelado, criar múltiplas transações
    if (formData.tipo_pagamento === "CARTAO CREDITO" && formData.parcelas > 1) {
      const valorParcela = valorTotal / formData.parcelas;
      const dataBase = new Date(formData.data);
      
      // Criar a primeira transação e obter o ID
      const primeiraTx = await base44.entities.Transacao.create({
        tipo: formData.tipo,
        categoria: formData.categoria,
        descricao: `${formData.descricao} (1/${formData.parcelas})`,
        valor: valorParcela,
        data: formData.data,
        tipo_pagamento: formData.tipo_pagamento,
        parcelas: formData.parcelas,
        numero_parcela: 1
      });
      
      // Criar as demais parcelas
      for (let i = 2; i <= formData.parcelas; i++) {
        const dataParcela = new Date(dataBase);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
        
        await base44.entities.Transacao.create({
          tipo: formData.tipo,
          categoria: formData.categoria,
          descricao: `${formData.descricao} (${i}/${formData.parcelas})`,
          valor: valorParcela,
          data: format(dataParcela, "yyyy-MM-dd"),
          tipo_pagamento: formData.tipo_pagamento,
          parcelas: formData.parcelas,
          numero_parcela: i,
          transacao_origem_id: primeiraTx.id
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      setShowDialog(false);
      resetForm();
    } else {
      // Transação única
      createMutation.mutate({
        ...formData,
        valor: valorTotal,
        parcelas: 1,
        numero_parcela: 1
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ["transacoes"] })}
      className="min-h-screen md:!overflow-visible"
    >
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center">
                <Wallet className="w-4 h-4 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-3xl font-black text-white">Gestão Financeira</h1>
                <p className="text-[11px] md:text-sm text-blue-300">Controle suas receitas e despesas</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="bg-white/10 border-white/20 text-white h-8 md:h-9 text-xs md:text-sm flex-1 max-w-[200px]"
            />
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold h-8 md:h-auto md:px-8 md:py-6 text-xs md:text-lg px-3"
            >
              <Plus className="w-3.5 h-3.5 md:w-5 md:h-5 mr-1 md:mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-6 mb-4 md:mb-6">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 md:p-6 text-white">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-5 h-5 md:w-8 md:h-8" />
              <span className="text-[10px] md:text-sm font-semibold">Receitas</span>
            </div>
            <p className="text-lg md:text-3xl font-black">{formatCurrency(resumo.totalReceitas)}</p>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-rose-600 p-3 md:p-6 text-white">
            <div className="flex items-center justify-between mb-1">
              <TrendingDown className="w-5 h-5 md:w-8 md:h-8" />
              <span className="text-[10px] md:text-sm font-semibold">Despesas</span>
            </div>
            <p className="text-lg md:text-3xl font-black">{formatCurrency(resumo.totalDespesas)}</p>
          </Card>

          <Card className={`bg-gradient-to-br ${resumo.saldo >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'} p-3 md:p-6 text-white col-span-2 md:col-span-1`}>
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-5 h-5 md:w-8 md:h-8" />
              <span className="text-[10px] md:text-sm font-semibold">Saldo</span>
            </div>
            <p className="text-lg md:text-3xl font-black">{formatCurrency(resumo.saldo)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráficos */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-red-400" />
              Despesas por Categoria
            </h3>
            {dadosGraficoDespesas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosGraficoDespesas}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosGraficoDespesas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_DESPESA[index % COLORS_DESPESA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/60 text-center py-12">Nenhuma despesa registrada neste mês</p>
            )}
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Receitas por Categoria
            </h3>
            {dadosGraficoReceitas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosGraficoReceitas}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosGraficoReceitas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_RECEITA[index % COLORS_RECEITA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/60 text-center py-12">Nenhuma receita registrada neste mês</p>
            )}
          </Card>
        </div>

        {/* Lista de Transações */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 mt-6">
          <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Transações do Mês
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transacoesMes.length === 0 ? (
              <p className="text-white/60 text-center py-8">Nenhuma transação registrada neste mês</p>
            ) : (
              transacoesMes.map((transacao) => (
                <motion.div
                  key={transacao.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    transacao.tipo === "Receita" 
                      ? "bg-green-500/20 border border-green-500/30" 
                      : "bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    {transacao.tipo === "Receita" ? (
                      <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-green-400 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 md:w-6 md:h-6 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs md:text-base truncate">{transacao.descricao}</p>
                      <div className="flex items-center gap-2 text-[10px] md:text-sm text-white/70">
                        <span className="px-1.5 py-0.5 bg-white/10 rounded-full truncate">{transacao.categoria}</span>
                        <span className="flex-shrink-0">{format(parseISO(transacao.data), "dd/MM")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <p className={`text-sm md:text-xl font-black ${transacao.tipo === "Receita" ? "text-green-400" : "text-red-400"}`}>
                      {transacao.tipo === "Receita" ? "+" : "-"} {formatCurrency(transacao.valor)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(transacao.id)}
                      className="text-white/50 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* Dialog de Nova Transação */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-900 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Nova Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-white">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v, categoria: "" })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                    <SelectItem value="Receita">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.tipo === "Despesa" ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Tipo de Pagamento</Label>
                <Select value={formData.tipo_pagamento} onValueChange={(v) => setFormData({ ...formData, tipo_pagamento: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PAGAMENTO.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_pagamento === "CARTAO CREDITO" && (
                <div>
                  <Label className="text-white">Quantidade de Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.parcelas}
                    onChange={(e) => setFormData({ ...formData, parcelas: parseInt(e.target.value) || 1 })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  {formData.parcelas > 1 && (
                    <p className="text-xs text-blue-300 mt-1">
                      Valor por parcela: {formatCurrency(parseFloat(formData.valor || 0) / formData.parcelas)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </PullToRefresh>
  );
}