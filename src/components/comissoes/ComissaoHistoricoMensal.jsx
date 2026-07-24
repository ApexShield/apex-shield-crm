import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Calendar, Filter } from "lucide-react";
import { parseISO, isValid, format, startOfMonth, endOfMonth, addMonths, isWithinInterval, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtCurrency = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
      <p className="text-white font-bold text-sm mb-2">{data?.mesCompleto || label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill || entry.color }} />
          <span className="text-white/70">{entry.name}:</span>
          <span className="text-white font-bold">{fmtCurrency(entry.value)}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-2 pt-2">
        <p className="text-xs text-white/70">Saldo: <span className="text-white font-bold">{fmtCurrency((data?.comissao || 0) + (data?.angariacao || 0) - (data?.inadimplencia || 0) - (data?.cancelamento || 0))}</span></p>
      </div>
    </div>
  );
};

export default function ComissaoHistoricoMensal({ comissoes }) {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

  const dadosMensais = useMemo(() => {
    const hoje = new Date();
    const meses = [];
    for (let i = 11; i >= 0; i--) {
      const mes = addMonths(startOfMonth(hoje), -i);
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);

      let comissaoTotal = 0;
      let angariacaoTotal = 0;
      let inadimplenciaTotal = 0;
      let cancelamentoTotal = 0;

      comissoes.forEach(c => {
        const adesao = parseISO(c.data_adesao);

        if (c.tipo_comissao === "Inadimplência") {
          // Inadimplência: contar no mês de competência
          if (c.mes_inadimplencia) {
            const [ano, mesNum] = c.mes_inadimplencia.split("-").map(Number);
            if (inicioMes.getFullYear() === ano && inicioMes.getMonth() === mesNum - 1) {
              inadimplenciaTotal += c.valor_comissao || 0;
            }
          }
          return;
        }

        if (c.tipo_comissao === "Cancelamento") {
          // Cancelamento: mostrar o valor cancelado no mês do cancelamento
          const dataCancelamento = c.data_cancelamento ? parseISO(c.data_cancelamento) : adesao;
          if (isValid(dataCancelamento) && isWithinInterval(dataCancelamento, { start: inicioMes, end: fimMes })) {
            cancelamentoTotal += c.valor_comissao || 0;
          }
          return;
        }

        if (c.tipo_comissao === "Angariação") {
          if (isValid(adesao) && isWithinInterval(adesao, { start: inicioMes, end: fimMes })) {
            angariacaoTotal += c.valor_comissao || 0;
          }
          return;
        }

        if (c.tipo_comissao === "Bônus") {
          if (isValid(adesao) && isWithinInterval(adesao, { start: inicioMes, end: fimMes })) {
            comissaoTotal += c.valor_comissao || 0;
          }
          return;
        }

        // Venda (recorrente)
        const expiracao = parseISO(c.data_expiracao);
        if (!isValid(adesao) || !isValid(expiracao)) return;
        if (!isAfter(adesao, fimMes) && !isBefore(expiracao, inicioMes)) {
          comissaoTotal += c.valor_comissao || 0;
        }
      });

      meses.push({
        mes: format(mes, "MMM/yy", { locale: ptBR }),
        mesCompleto: format(mes, "MMMM yyyy", { locale: ptBR }),
        comissao: Math.round(comissaoTotal * 100) / 100,
        angariacao: Math.round(angariacaoTotal * 100) / 100,
        inadimplencia: Math.round(inadimplenciaTotal * 100) / 100,
        cancelamento: Math.round(cancelamentoTotal * 100) / 100,
        inicioMes,
        fimMes
      });
    }
    return meses;
  }, [comissoes]);

  // Filtrar comissões
  const comissoesFiltradas = useMemo(() => {
    let filtradas = [...comissoes];
    if (filtroCliente.trim()) {
      const term = filtroCliente.toLowerCase();
      filtradas = filtradas.filter(c =>
        (c.cliente_nome || "").toLowerCase().includes(term) ||
        (c.produto || "").toLowerCase().includes(term)
      );
    }
    if (filtroInicio) {
      const inicio = parseISO(filtroInicio);
      if (isValid(inicio)) filtradas = filtradas.filter(c => { const a = parseISO(c.data_adesao); return isValid(a) && !isBefore(a, inicio); });
    }
    if (filtroFim) {
      const fim = parseISO(filtroFim);
      if (isValid(fim)) filtradas = filtradas.filter(c => { const a = parseISO(c.data_adesao); return isValid(a) && !isAfter(a, fim); });
    }
    return filtradas;
  }, [comissoes, filtroCliente, filtroInicio, filtroFim]);

  const calcMesesPagos = (c) => {
    const adesao = parseISO(c.data_adesao);
    const exp = parseISO(c.data_expiracao);
    const hoje = new Date();
    if (!isValid(adesao) || !isValid(exp)) return 0;
    if (hoje > exp) return 12;
    const meses = (hoje.getFullYear() - adesao.getFullYear()) * 12 + (hoje.getMonth() - adesao.getMonth());
    return Math.min(Math.max(meses, 0), 12);
  };

  const totalFiltrado = comissoesFiltradas.reduce((acc, c) => {
    if (c.tipo_comissao === "Cancelamento" || c.tipo_comissao === "Inadimplência") return acc - (c.valor_comissao || 0);
    const isPagUnico = c.tipo_comissao === "Bônus" || c.tipo_comissao === "Angariação";
    if (isPagUnico) return acc + (c.valor_comissao || 0);
    return acc + (c.valor_comissao || 0) * calcMesesPagos(c);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Gráfico mensal - barras empilhadas */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Comissões por Mês (Últimos 12 meses)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosMensais} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#e2e8f0", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#e2e8f0" }}
                formatter={(value) => <span style={{ color: "#e2e8f0" }}>{value}</span>}
              />
              <Bar dataKey="comissao" name="Comissão" fill="#10b981" stackId="stack" radius={[0, 0, 0, 0]} />
              <Bar dataKey="angariacao" name="Angariação" fill="#3b82f6" stackId="stack" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inadimplencia" name="Inadimplência" fill="#f97316" stackId="neg" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cancelamento" name="Cancelamento" fill="#ef4444" stackId="neg" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          Filtrar Comissões
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-white/70 text-xs">Buscar Cliente</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <Input value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
                placeholder="Nome ou produto..." className="pl-8 bg-white/10 border-white/20 text-white text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-white/70 text-xs">De</Label>
            <Input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)}
              className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div>
            <Label className="text-white/70 text-xs">Até</Label>
            <Input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)}
              className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div className="flex items-end">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 w-full text-center">
              <p className="text-white/60 text-[10px]">Total Líquido</p>
              <p className={`font-black text-sm ${totalFiltrado >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtCurrency(totalFiltrado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista filtrada */}
      {(filtroCliente || filtroInicio || filtroFim) && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h4 className="text-white font-bold text-xs mb-2">
            Resultado: {comissoesFiltradas.length} registro(s) encontrado(s)
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {comissoesFiltradas.length === 0 ? (
              <p className="text-white/50 text-xs text-center py-4">Nenhuma comissão encontrada</p>
            ) : comissoesFiltradas.map(c => {
              const isNeg = c.tipo_comissao === "Cancelamento" || c.tipo_comissao === "Inadimplência";
              const isPagUnico = c.tipo_comissao === "Bônus" || c.tipo_comissao === "Angariação";
              const mesesPagos = isPagUnico || isNeg ? 1 : calcMesesPagos(c);
              const totalCliente = isNeg ? -(c.valor_comissao || 0) : isPagUnico ? (c.valor_comissao || 0) : (c.valor_comissao || 0) * mesesPagos;
              return (
                <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{c.cliente_nome}</p>
                    <p className="text-white/50 text-[10px]">
                      {c.tipo_comissao} • {fmtCurrency(Math.abs(c.valor_comissao))}
                      {!isPagUnico && !isNeg && ` • ${mesesPagos} meses pagos`}
                      {c.tipo_comissao === "Inadimplência" && c.mes_inadimplencia && ` • Ref: ${c.mes_inadimplencia}`}
                    </p>
                  </div>
                  <span className={`text-xs font-black flex-shrink-0 ml-2 ${isNeg ? "text-red-400" : "text-emerald-400"}`}>
                    {isNeg ? "-" : ""}{fmtCurrency(Math.abs(totalCliente))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}