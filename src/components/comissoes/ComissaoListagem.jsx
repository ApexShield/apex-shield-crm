import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, Pencil, Check, X } from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const fmtCurrency = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function safeFmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yyyy") : "—";
}

function isPagamentoUnico(comissao) {
  return comissao.tipo_comissao === "Bônus" || comissao.tipo_comissao === "Angariação";
}

function isNegativo(comissao) {
  return comissao.tipo_comissao === "Cancelamento" || comissao.tipo_comissao === "Inadimplência";
}

function getStatusInfo(comissao) {
  if (isNegativo(comissao)) {
    if (comissao.tipo_comissao === "Cancelamento") {
      return { label: "Cancelada", color: "text-red-400", icon: AlertTriangle, urgente: false, diasRestantes: 999 };
    }
    return { label: "Inadimplente", color: "text-orange-400", icon: AlertTriangle, urgente: false, diasRestantes: 999 };
  }
  if (isPagamentoUnico(comissao)) {
    return { label: "Pago", color: "text-cyan-400", icon: CheckCircle, urgente: false, diasRestantes: 999 };
  }
  const hoje = new Date();
  const exp = parseISO(comissao.data_expiracao);
  if (!isValid(exp)) return { label: "—", color: "text-white/50", icon: Clock, urgente: false };
  const diasRestantes = differenceInDays(exp, hoje);
  if (comissao.status === "cancelada") {
    return { label: "Cancelada", color: "text-red-400", icon: AlertTriangle, urgente: false, diasRestantes };
  }
  if (comissao.status === "expirada" || diasRestantes < 0) {
    return { label: "Expirada", color: "text-red-400", icon: AlertTriangle, urgente: true, diasRestantes };
  }
  if (diasRestantes <= 30) {
    return { label: `${diasRestantes}d restantes`, color: "text-amber-400", icon: Clock, urgente: true, diasRestantes };
  }
  return { label: `${diasRestantes}d restantes`, color: "text-emerald-400", icon: CheckCircle, urgente: false, diasRestantes };
}

export default function ComissaoListagem({ comissoes, onRefresh, onRenovar }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleDelete = async (id) => {
    await base44.entities.ComissaoCliente.delete(id);
    toast.success("Comissão removida");
    onRefresh();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditData({
      valor_comissao: c.valor_comissao || 0,
      produto: c.produto || "",
      data_adesao: c.data_adesao || "",
      data_expiracao: c.data_expiracao || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    setSaving(true);
    const updates = {
      valor_comissao: parseFloat(editData.valor_comissao) || 0,
      produto: editData.produto,
      data_adesao: editData.data_adesao
    };
    const comissao = comissoes.find(c => c.id === id);
    if (!isPagamentoUnico(comissao)) {
      updates.data_expiracao = editData.data_expiracao;
    }
    await base44.entities.ComissaoCliente.update(id, updates);
    toast.success("Comissão atualizada");
    setEditingId(null);
    setEditData({});
    setSaving(false);
    onRefresh();
  };

  const sortedComissoes = useMemo(() => {
    return [...comissoes].sort((a, b) => {
      const sa = getStatusInfo(a);
      const sb = getStatusInfo(b);
      if (sa.urgente && !sb.urgente) return -1;
      if (!sa.urgente && sb.urgente) return 1;
      return (sa.diasRestantes || 0) - (sb.diasRestantes || 0);
    });
  }, [comissoes]);

  const calcMesesToPaid = (comissao) => {
    const adesao = parseISO(comissao.data_adesao);
    const exp = parseISO(comissao.data_expiracao);
    const hoje = new Date();
    if (!isValid(adesao) || !isValid(exp)) return 0;
    if (hoje > exp) return 12;
    const mesesPassados = (hoje.getFullYear() - adesao.getFullYear()) * 12 + (hoje.getMonth() - adesao.getMonth());
    return Math.min(Math.max(mesesPassados, 0), 12);
  };

  const isEditing = (id) => editingId === id;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto max-h-[500px]">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
            <TableRow className="border-white/10">
              <TableHead className="text-white text-xs font-bold">Cliente</TableHead>
              <TableHead className="text-white text-xs font-bold">Tipo</TableHead>
              <TableHead className="text-white text-xs font-bold">Produto</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Valor</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Data</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Expiração</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Progresso</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Status</TableHead>
              <TableHead className="text-white text-xs font-bold w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedComissoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-white/50 py-8 text-xs">
                  Nenhuma comissão cadastrada. Clique em "Adicionar Comissão" para começar.
                </TableCell>
              </TableRow>
            ) : sortedComissoes.map(c => {
              const statusInfo = getStatusInfo(c);
              const Icon = statusInfo.icon;
              const mesesPagos = calcMesesToPaid(c);
              const editing = isEditing(c.id);

              return (
                <TableRow key={c.id} className={`border-white/5 hover:bg-white/5 ${statusInfo.urgente ? "bg-amber-500/5" : ""}`}>
                  <TableCell className="text-white text-xs font-bold">{c.cliente_nome}</TableCell>
                  <TableCell className="text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      c.tipo_comissao === "Venda" ? "bg-emerald-500/20 text-emerald-300" :
                      c.tipo_comissao === "Angariação" ? "bg-blue-500/20 text-blue-300" :
                      c.tipo_comissao === "Bônus" ? "bg-purple-500/20 text-purple-300" :
                      c.tipo_comissao === "Cancelamento" ? "bg-red-500/20 text-red-300" :
                      c.tipo_comissao === "Inadimplência" ? "bg-orange-500/20 text-orange-300" :
                      "bg-white/10 text-white/60"
                    }`}>
                      {c.tipo_comissao || "Venda"}
                    </span>
                  </TableCell>
                  <TableCell className="text-cyan-300 text-xs">
                    {editing ? (
                      <Input value={editData.produto} onChange={e => setEditData(p => ({ ...p, produto: e.target.value }))}
                        className="compact-form h-7 bg-white/10 border-white/20 text-white text-xs w-20" />
                    ) : c.produto}
                  </TableCell>
                  <TableCell className={`text-xs font-black text-center ${isNegativo(c) ? "text-red-400" : "text-emerald-400"}`}>
                    {editing ? (
                      <Input type="number" step="0.01" value={editData.valor_comissao}
                        onChange={e => setEditData(p => ({ ...p, valor_comissao: e.target.value }))}
                        className="compact-form h-7 bg-white/10 border-white/20 text-white text-xs w-24 text-center" />
                    ) : `${isNegativo(c) ? "- " : ""}${fmtCurrency(c.valor_comissao)}`}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs text-center">
                    {editing ? (
                      <Input type="date" value={editData.data_adesao}
                        onChange={e => setEditData(p => ({ ...p, data_adesao: e.target.value }))}
                        className="compact-form h-7 bg-white/10 border-white/20 text-white text-xs w-32" />
                    ) : safeFmtDate(c.data_adesao)}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs text-center">
                    {isPagamentoUnico(c) ? "—" : editing ? (
                      <Input type="date" value={editData.data_expiracao}
                        onChange={e => setEditData(p => ({ ...p, data_expiracao: e.target.value }))}
                        className="compact-form h-7 bg-white/10 border-white/20 text-white text-xs w-32" />
                    ) : safeFmtDate(c.data_expiracao)}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs text-center">
                    {isNegativo(c) ? (
                      <span className={`font-bold ${c.tipo_comissao === "Cancelamento" ? "text-red-400" : "text-orange-400"}`}>
                        {c.tipo_comissao === "Inadimplência" && c.mes_inadimplencia ? c.mes_inadimplencia : "—"}
                      </span>
                    ) : isPagamentoUnico(c) ? (
                      <span className="text-cyan-400 font-bold">Único</span>
                    ) : (
                      <><span className="font-bold">{mesesPagos}</span>/12</>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`flex items-center justify-center gap-1 ${statusInfo.color} font-bold`}>
                      <Icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {editing ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(c.id)} disabled={saving}
                            className="text-emerald-400 hover:text-emerald-300 h-7 w-7" title="Salvar">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}
                            className="text-white/50 hover:text-white h-7 w-7" title="Cancelar">
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => startEdit(c)}
                            className="text-cyan-400 hover:text-cyan-300 h-7 w-7" title="Editar">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          {statusInfo.urgente && (
                            <Button size="icon" variant="ghost" onClick={() => onRenovar(c)}
                              className="text-amber-400 hover:text-amber-300 h-7 w-7" title="Renovar">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}
                            className="text-red-400 hover:text-red-300 h-7 w-7" title="Remover">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}