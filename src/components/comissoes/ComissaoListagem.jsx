import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const fmtCurrency = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function safeFmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yyyy") : "—";
}

function getStatusInfo(comissao) {
  const hoje = new Date();
  const exp = parseISO(comissao.data_expiracao);
  if (!isValid(exp)) return { label: "—", color: "text-white/50", icon: Clock, urgente: false };
  const diasRestantes = differenceInDays(exp, hoje);

  if (comissao.status === "expirada" || diasRestantes < 0) {
    return { label: "Expirada", color: "text-red-400", icon: AlertTriangle, urgente: true, diasRestantes };
  }
  if (diasRestantes <= 30) {
    return { label: `${diasRestantes}d restantes`, color: "text-amber-400", icon: Clock, urgente: true, diasRestantes };
  }
  return { label: `${diasRestantes}d restantes`, color: "text-emerald-400", icon: CheckCircle, urgente: false, diasRestantes };
}

export default function ComissaoListagem({ comissoes, onRefresh, onRenovar }) {
  const handleDelete = async (id) => {
    await base44.entities.ComissaoCliente.delete(id);
    toast.success("Comissão removida");
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

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto max-h-[500px]">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
            <TableRow className="border-white/10">
              <TableHead className="text-white text-xs font-bold">Cliente</TableHead>
              <TableHead className="text-white text-xs font-bold">Produto</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Valor/Mês</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Adesão</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Expiração</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Meses Pagos</TableHead>
              <TableHead className="text-white text-xs font-bold text-center">Status</TableHead>
              <TableHead className="text-white text-xs font-bold w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedComissoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-white/50 py-8 text-xs">
                  Nenhuma comissão cadastrada. Clique em "Adicionar Comissão" para começar.
                </TableCell>
              </TableRow>
            ) : sortedComissoes.map(c => {
              const statusInfo = getStatusInfo(c);
              const Icon = statusInfo.icon;
              const mesesPagos = calcMesesToPaid(c);
              return (
                <TableRow key={c.id} className={`border-white/5 hover:bg-white/5 ${statusInfo.urgente ? "bg-amber-500/5" : ""}`}>
                  <TableCell className="text-white text-xs font-bold">{c.cliente_nome}</TableCell>
                  <TableCell className="text-cyan-300 text-xs">{c.produto}</TableCell>
                  <TableCell className="text-emerald-400 text-xs font-black text-center">{fmtCurrency(c.valor_comissao)}</TableCell>
                  <TableCell className="text-white/70 text-xs text-center">{safeFmtDate(c.data_adesao)}</TableCell>
                  <TableCell className="text-white/70 text-xs text-center">{safeFmtDate(c.data_expiracao)}</TableCell>
                  <TableCell className="text-white/70 text-xs text-center">
                    <span className="font-bold">{mesesPagos}</span>/12
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`flex items-center justify-center gap-1 ${statusInfo.color} font-bold`}>
                      <Icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
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