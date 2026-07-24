import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, AlertTriangle, DollarSign, Gift, Award, ArrowLeft, Ban, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { addMonths, format, parseISO, isValid, differenceInMonths } from "date-fns";

const STATUSES_PERMITIDOS = ["Venda Feita", "Entrega de Apólice", "Encerrado"];

const TIPOS_COMISSAO = [
  {
    value: "Venda",
    label: "Comissão de Venda",
    desc: "Paga mensalmente por 12 meses. Requer seleção de cliente e produto.",
    icon: DollarSign,
    color: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/40",
    needsCliente: true
  },
  {
    value: "Angariação",
    label: "Angariação",
    desc: "Pagamento único de valor variável. Informe o valor e a data de pagamento.",
    icon: Award,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/40",
    needsCliente: false,
    pagamentoUnico: true
  },
  {
    value: "Inadimplência",
    label: "Inadimplência",
    desc: "Anula o recebimento de um mês específico de uma comissão de venda.",
    icon: Ban,
    color: "from-orange-600 to-red-600",
    borderColor: "border-orange-500/40",
    needsCliente: false,
    isNegativo: true
  },
  {
    value: "Cancelamento",
    label: "Cancelamento",
    desc: "Cancela uma comissão de venda. Considera apenas meses pagos até a data do cancelamento.",
    icon: XCircle,
    color: "from-red-500 to-red-700",
    borderColor: "border-red-500/40",
    needsCliente: false,
    isNegativo: true
  }
];

export default function AdicionarComissaoDialog({ open, onClose, clientes, comissoes, onAdded }) {
  const [step, setStep] = useState("tipo");
  const [tipoComissao, setTipoComissao] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [produto, setProduto] = useState("");
  const [valorComissao, setValorComissao] = useState("");
  const [dataAdesao, setDataAdesao] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataCancelamento, setDataCancelamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedComissaoVinculada, setSelectedComissaoVinculada] = useState(null);
  const [mesInadimplencia, setMesInadimplencia] = useState(format(new Date(), "yyyy-MM"));
  const [saving, setSaving] = useState(false);

  const tipoConfig = TIPOS_COMISSAO.find(t => t.value === tipoComissao);

  // Comissões de venda ativas para vincular cancelamento/inadimplência
  const comissoesVenda = useMemo(() => {
    return (comissoes || []).filter(c =>
      c.tipo_comissao === "Venda" && (c.status === "ativa" || c.status === "renovada")
    );
  }, [comissoes]);

  const clientesFiltrados = useMemo(() => {
    if (!search.trim()) return clientes.slice(0, 20);
    const term = search.toLowerCase();
    return clientes.filter(c =>
      (c.nome || "").toLowerCase().includes(term) ||
      (c.cpf || "").includes(term) ||
      (c.telefone || "").includes(term)
    ).slice(0, 20);
  }, [clientes, search]);

  const clienteElegivel = (cliente) => {
    return cliente.is_cliente && STATUSES_PERMITIDOS.includes(cliente.status);
  };

  const getMotivoBloqueio = (cliente) => {
    const motivos = [];
    if (!cliente.is_cliente) motivos.push("Não foi convertido em cliente");
    if (!STATUSES_PERMITIDOS.includes(cliente.status)) motivos.push(`Status "${cliente.status}" não permite comissão`);
    return motivos;
  };

  const handleSelectTipo = (tipo) => {
    setTipoComissao(tipo);
    const config = TIPOS_COMISSAO.find(t => t.value === tipo);
    if (config.needsCliente) {
      setStep("cliente");
    } else if (config.isNegativo) {
      setStep("vincular");
    } else {
      setStep("form");
    }
  };

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setProduto(cliente.dados_apolice?.produto || "");
    setStep("form");
  };

  const handleSelectComissaoVinculada = (comissao) => {
    setSelectedComissaoVinculada(comissao);
    setValorComissao(String(comissao.valor_comissao || 0));
    setStep("form");
  };

  const handleSave = async () => {
    if (tipoComissao === "Cancelamento") {
      if (!selectedComissaoVinculada || !dataCancelamento) {
        toast.error("Preencha todos os campos");
        return;
      }
      setSaving(true);

      // Calcular meses pagos até a data do cancelamento
      const adesao = parseISO(selectedComissaoVinculada.data_adesao);
      const cancel = parseISO(dataCancelamento);
      const mesesPagos = Math.max(0, Math.min(12, differenceInMonths(cancel, adesao)));
      const valorPago = (selectedComissaoVinculada.valor_comissao || 0) * mesesPagos;
      const mesesRestantes = 12 - mesesPagos;
      const valorCancelado = (selectedComissaoVinculada.valor_comissao || 0) * mesesRestantes;

      // Criar registro de cancelamento
      await base44.entities.ComissaoCliente.create({
        cliente_id: selectedComissaoVinculada.cliente_id || "",
        cliente_nome: selectedComissaoVinculada.cliente_nome || "Cancelamento",
        tipo_comissao: "Cancelamento",
        produto: selectedComissaoVinculada.produto || "",
        valor_comissao: valorCancelado,
        data_adesao: dataCancelamento,
        data_cancelamento: dataCancelamento,
        comissao_vinculada_id: selectedComissaoVinculada.id,
        status: "cancelada",
        notificacao_enviada: false,
        historico_renovacoes: []
      });

      // Atualizar comissão original: encurtar expiração até data do cancelamento
      await base44.entities.ComissaoCliente.update(selectedComissaoVinculada.id, {
        data_expiracao: dataCancelamento,
        status: "cancelada"
      });

      toast.success(`Cancelamento registrado! ${mesesPagos} meses pagos, ${mesesRestantes} meses cancelados.`);
      setSaving(false);
      resetForm();
      onAdded();
      onClose();
      return;
    }

    if (tipoComissao === "Inadimplência") {
      if (!selectedComissaoVinculada || !mesInadimplencia) {
        toast.error("Selecione a comissão e o mês da inadimplência");
        return;
      }
      setSaving(true);

      await base44.entities.ComissaoCliente.create({
        cliente_id: selectedComissaoVinculada.cliente_id || "",
        cliente_nome: selectedComissaoVinculada.cliente_nome || "Inadimplência",
        tipo_comissao: "Inadimplência",
        produto: selectedComissaoVinculada.produto || "",
        valor_comissao: selectedComissaoVinculada.valor_comissao || 0,
        data_adesao: mesInadimplencia + "-01",
        mes_inadimplencia: mesInadimplencia,
        comissao_vinculada_id: selectedComissaoVinculada.id,
        status: "pago",
        notificacao_enviada: false,
        historico_renovacoes: []
      });

      toast.success("Inadimplência registrada!");
      setSaving(false);
      resetForm();
      onAdded();
      onClose();
      return;
    }

    // Fluxo padrão (Venda, Angariação, Bônus)
    if (!valorComissao || !dataAdesao) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (tipoConfig?.needsCliente) {
      if (!selectedCliente || !produto) {
        toast.error("Preencha todos os campos");
        return;
      }
      if (!clienteElegivel(selectedCliente)) {
        toast.error("Este cliente não está elegível para comissão");
        return;
      }
    }

    setSaving(true);
    const isPagamentoUnico = tipoConfig?.pagamentoUnico;
    const dataExp = isPagamentoUnico
      ? dataAdesao
      : format(addMonths(new Date(dataAdesao + "T12:00:00"), 12), "yyyy-MM-dd");

    await base44.entities.ComissaoCliente.create({
      cliente_id: selectedCliente?.id || "",
      cliente_nome: selectedCliente?.nome || tipoComissao,
      tipo_comissao: tipoComissao,
      produto: produto || tipoComissao,
      valor_comissao: parseFloat(valorComissao),
      data_adesao: dataAdesao,
      data_expiracao: dataExp,
      status: isPagamentoUnico ? "pago" : "ativa",
      notificacao_enviada: false,
      historico_renovacoes: []
    });

    toast.success(`${tipoComissao} adicionada com sucesso!`);
    setSaving(false);
    resetForm();
    onAdded();
    onClose();
  };

  const resetForm = () => {
    setStep("tipo");
    setTipoComissao(null);
    setSearch("");
    setSelectedCliente(null);
    setProduto("");
    setValorComissao("");
    setDataAdesao(format(new Date(), "yyyy-MM-dd"));
    setDataCancelamento(format(new Date(), "yyyy-MM-dd"));
    setSelectedComissaoVinculada(null);
    setMesInadimplencia(format(new Date(), "yyyy-MM"));
  };

  const handleBack = () => {
    if (step === "form" && (tipoComissao === "Cancelamento" || tipoComissao === "Inadimplência")) {
      setSelectedComissaoVinculada(null);
      setStep("vincular");
    } else if (step === "form" && tipoConfig?.needsCliente) {
      setSelectedCliente(null);
      setStep("cliente");
    } else if (step === "form" || step === "cliente" || step === "vincular") {
      setStep("tipo");
      setTipoComissao(null);
    }
  };

  const isUnico = tipoConfig?.pagamentoUnico;
  const frequenciaLabel = isUnico ? "Valor Recebido (R$)" : "Valor da Comissão Mensal (R$)";
  const dataLabel = isUnico ? "Data de Pagamento" : "Data de Início";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/20 text-white compact-form">
        <DialogHeader>
          <DialogTitle className="text-white font-bold flex items-center gap-2">
            {step !== "tipo" && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="text-white/50 hover:text-white h-7 w-7">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {step === "tipo" && "Adicionar Comissão"}
            {step === "cliente" && `${tipoComissao} — Selecionar Cliente`}
            {step === "vincular" && `${tipoComissao} — Selecionar Comissão`}
            {step === "form" && `${tipoComissao} — Dados`}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Tipo */}
        {step === "tipo" && (
          <div className="space-y-3">
            <p className="text-white/50 text-xs">Selecione o tipo:</p>
            {TIPOS_COMISSAO.map(tipo => {
              const Icon = tipo.icon;
              return (
                <button
                  key={tipo.value}
                  onClick={() => handleSelectTipo(tipo.value)}
                  className={`w-full text-left p-4 rounded-xl border ${tipo.borderColor} bg-white/5 hover:bg-white/10 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tipo.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{tipo.label}</p>
                      <p className="text-white/50 text-xs">{tipo.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step: Selecionar comissão vinculada (Cancelamento/Inadimplência) */}
        {step === "vincular" && (
          <div className="space-y-3">
            <p className="text-white/50 text-xs">Selecione a comissão de venda a vincular:</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {comissoesVenda.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-4">Nenhuma comissão de venda ativa encontrada</p>
              ) : comissoesVenda.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectComissaoVinculada(c)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors"
                >
                  <p className="text-sm font-bold text-white">{c.cliente_nome}</p>
                  <p className="text-xs text-white/50">
                    {c.produto} • R$ {(c.valor_comissao || 0).toFixed(2)}/mês • Adesão: {c.data_adesao ? format(parseISO(c.data_adesao), "dd/MM/yyyy") : "—"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Selecionar cliente (Venda) */}
        {step === "cliente" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente por nome, CPF ou telefone..."
                className="pl-9 bg-white/10 border-white/20 text-white text-sm" />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {clientesFiltrados.length === 0 && (
                <p className="text-white/50 text-sm text-center py-4">Nenhum cliente encontrado</p>
              )}
              {clientesFiltrados.map(c => {
                const elegivel = clienteElegivel(c);
                const motivos = !elegivel ? getMotivoBloqueio(c) : [];
                return (
                  <button key={c.id} onClick={() => elegivel && handleSelectCliente(c)} disabled={!elegivel}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${elegivel ? "hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/30 cursor-pointer" : "opacity-60 border border-transparent cursor-not-allowed"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{c.nome}</p>
                        <p className="text-xs text-white/50">{c.telefone || "Sem telefone"} • {c.status || "Sem status"}</p>
                      </div>
                      {elegivel ? <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    </div>
                    {!elegivel && <div className="mt-1">{motivos.map((m, i) => <p key={i} className="text-[10px] text-amber-400/80">⚠ {m}</p>)}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Formulário */}
        {step === "form" && (
          <div className="space-y-4">
            {/* Info do tipo selecionado */}
            {tipoConfig && (
              <div className={`flex items-center gap-3 bg-white/5 rounded-lg p-3 border ${tipoConfig.borderColor}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tipoConfig.color} flex items-center justify-center flex-shrink-0`}>
                  <tipoConfig.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">{tipoConfig.label}</p>
                  <p className="text-white/40 text-[10px]">
                    {tipoComissao === "Venda" && "Mensal por 12 meses"}
                    {tipoComissao === "Angariação" && "Pagamento único — valor variável"}
                    {tipoComissao === "Bônus" && "Pagamento único — valor variável"}
                    {tipoComissao === "Cancelamento" && "Cancela comissão futura"}
                    {tipoComissao === "Inadimplência" && "Anula recebimento de mês específico"}
                  </p>
                </div>
              </div>
            )}

            {/* Info comissão vinculada */}
            {selectedComissaoVinculada && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-bold text-white">{selectedComissaoVinculada.cliente_nome}</p>
                <p className="text-xs text-white/50">{selectedComissaoVinculada.produto} • R$ {(selectedComissaoVinculada.valor_comissao || 0).toFixed(2)}/mês</p>
              </div>
            )}

            {/* Info do cliente (só para Venda) */}
            {selectedCliente && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{selectedCliente.nome}</p>
                    <p className="text-xs text-white/50">{selectedCliente.telefone} • {selectedCliente.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCliente(null); setStep("cliente"); }} className="text-white/50 hover:text-white text-xs">Trocar</Button>
                </div>
              </div>
            )}

            {/* Campos específicos por tipo */}
            {tipoComissao === "Cancelamento" && (
              <div>
                <Label className="text-white/70 text-xs">Data do Cancelamento</Label>
                <Input type="date" value={dataCancelamento} onChange={e => setDataCancelamento(e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-sm" />
                {selectedComissaoVinculada && dataCancelamento && (() => {
                  const adesao = parseISO(selectedComissaoVinculada.data_adesao);
                  const cancel = parseISO(dataCancelamento);
                  if (!isValid(adesao) || !isValid(cancel)) return null;
                  const mesesPagos = Math.max(0, Math.min(12, differenceInMonths(cancel, adesao)));
                  const valorPago = (selectedComissaoVinculada.valor_comissao || 0) * mesesPagos;
                  const mesesRestantes = 12 - mesesPagos;
                  const valorCancelado = (selectedComissaoVinculada.valor_comissao || 0) * mesesRestantes;
                  return (
                    <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-white/70">📊 <strong className="text-white">Meses pagos:</strong> {mesesPagos} = R$ {valorPago.toFixed(2)}</p>
                      <p className="text-xs text-white/70">❌ <strong className="text-red-400">Meses cancelados:</strong> {mesesRestantes} = R$ {valorCancelado.toFixed(2)}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {tipoComissao === "Inadimplência" && (
              <div>
                <Label className="text-white/70 text-xs">Mês/Ano da Inadimplência</Label>
                <Input type="month" value={mesInadimplencia} onChange={e => setMesInadimplencia(e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-sm" />
                {selectedComissaoVinculada && (
                  <p className="text-xs text-orange-300 mt-1">
                    Será anulado o recebimento de R$ {(selectedComissaoVinculada.valor_comissao || 0).toFixed(2)} referente ao mês selecionado.
                  </p>
                )}
              </div>
            )}

            {/* Produto (só para Venda) */}
            {tipoComissao === "Venda" && (
              <div>
                <Label className="text-white/70 text-xs">Produto</Label>
                <Input value={produto} onChange={e => setProduto(e.target.value)}
                  placeholder="Ex: VS10, VT65..."
                  className="bg-white/10 border-white/20 text-white text-sm" />
              </div>
            )}

            {/* Valor e Data para tipos não-negativos */}
            {!tipoConfig?.isNegativo && (
              <>
                <div>
                  <Label className="text-white/70 text-xs">{frequenciaLabel}</Label>
                  <Input type="number" step="0.01" value={valorComissao} onChange={e => setValorComissao(e.target.value)}
                    placeholder="Ex: 150.00"
                    className="bg-white/10 border-white/20 text-white text-sm" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">{dataLabel}</Label>
                  <Input type="date" value={dataAdesao} onChange={e => setDataAdesao(e.target.value)}
                    className="bg-white/10 border-white/20 text-white text-sm" />
                </div>
                {dataAdesao && !isUnico && (
                  <p className="text-xs text-white/40">
                    Expira em: {format(addMonths(new Date(dataAdesao + "T12:00:00"), 12), "dd/MM/yyyy")} (12 meses)
                  </p>
                )}
              </>
            )}

            <Button onClick={handleSave} disabled={saving}
              className={`w-full font-bold ${tipoConfig?.isNegativo ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
              {saving ? "Salvando..." : `Salvar ${tipoComissao}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}