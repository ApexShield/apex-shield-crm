import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";

const STATUSES_PERMITIDOS = ["Venda Feita", "Entrega de Apólice", "Encerrado"];

export default function AdicionarComissaoDialog({ open, onClose, clientes, onAdded }) {
  const [search, setSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [produto, setProduto] = useState("");
  const [valorComissao, setValorComissao] = useState("");
  const [dataAdesao, setDataAdesao] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

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
    if (!STATUSES_PERMITIDOS.includes(cliente.status)) motivos.push(`Status "${cliente.status}" não permite comissão (necessário: Venda Feita ou posterior)`);
    return motivos;
  };

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setProduto(cliente.dados_apolice?.produto || "");
  };

  const handleSave = async () => {
    if (!selectedCliente || !produto || !valorComissao || !dataAdesao) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!clienteElegivel(selectedCliente)) {
      toast.error("Este cliente não está elegível para comissão");
      return;
    }
    setSaving(true);
    const dataExp = format(addMonths(new Date(dataAdesao + "T12:00:00"), 12), "yyyy-MM-dd");
    await base44.entities.ComissaoCliente.create({
      cliente_id: selectedCliente.id,
      cliente_nome: selectedCliente.nome,
      produto,
      valor_comissao: parseFloat(valorComissao),
      data_adesao: dataAdesao,
      data_expiracao: dataExp,
      status: "ativa",
      notificacao_enviada: false,
      historico_renovacoes: []
    });
    toast.success(`Comissão de ${selectedCliente.nome} adicionada!`);
    setSaving(false);
    resetForm();
    onAdded();
    onClose();
  };

  const resetForm = () => {
    setSearch("");
    setSelectedCliente(null);
    setProduto("");
    setValorComissao("");
    setDataAdesao(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/20 text-white compact-form">
        <DialogHeader>
          <DialogTitle className="text-white font-bold">Adicionar Comissão de Cliente</DialogTitle>
        </DialogHeader>

        {!selectedCliente ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente por nome, CPF ou telefone..."
                className="pl-9 bg-white/10 border-white/20 text-white text-sm"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {clientesFiltrados.length === 0 && (
                <p className="text-white/50 text-sm text-center py-4">Nenhum cliente encontrado</p>
              )}
              {clientesFiltrados.map(c => {
                const elegivel = clienteElegivel(c);
                const motivos = !elegivel ? getMotivoBloqueio(c) : [];
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCliente(c)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      elegivel
                        ? "hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/30"
                        : "hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{c.nome}</p>
                        <p className="text-xs text-white/50">
                          {c.telefone || "Sem telefone"} • {c.status || "Sem status"}
                        </p>
                      </div>
                      {elegivel ? (
                        <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    {!elegivel && (
                      <div className="mt-1">
                        {motivos.map((m, i) => (
                          <p key={i} className="text-[10px] text-amber-400/80">⚠ {m}</p>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{selectedCliente.nome}</p>
                  <p className="text-xs text-white/50">{selectedCliente.telefone} • {selectedCliente.status}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCliente(null)} className="text-white/50 hover:text-white text-xs">
                  Trocar
                </Button>
              </div>
            </div>

            {!clienteElegivel(selectedCliente) ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-bold text-sm">Cliente não elegível</p>
                    {getMotivoBloqueio(selectedCliente).map((m, i) => (
                      <p key={i} className="text-red-300/80 text-xs mt-1">• {m}</p>
                    ))}
                    <p className="text-red-300/60 text-xs mt-2">O cliente precisa estar convertido e com status "Venda Feita" ou posterior para receber comissão.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-white/70 text-xs">Produto</Label>
                  <Input value={produto} onChange={e => setProduto(e.target.value)}
                    placeholder="Ex: VS10, VT65..."
                    className="bg-white/10 border-white/20 text-white text-sm" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">Valor da Comissão Mensal (R$)</Label>
                  <Input type="number" step="0.01" value={valorComissao} onChange={e => setValorComissao(e.target.value)}
                    placeholder="Ex: 150.00"
                    className="bg-white/10 border-white/20 text-white text-sm" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">Data de Adesão</Label>
                  <Input type="date" value={dataAdesao} onChange={e => setDataAdesao(e.target.value)}
                    className="bg-white/10 border-white/20 text-white text-sm" />
                </div>
                {dataAdesao && (
                  <p className="text-xs text-white/40">
                    Expira em: {format(addMonths(new Date(dataAdesao + "T12:00:00"), 12), "dd/MM/yyyy")} (12 meses)
                  </p>
                )}
                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">
                  {saving ? "Salvando..." : "Salvar Comissão"}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}