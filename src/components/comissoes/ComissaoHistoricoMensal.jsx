import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Calendar, Filter } from "lucide-react";
import { parseISO, isValid, format, startOfMonth, endOfMonth, addMonths, isWithinInterval, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtCurrency = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ComissaoHistoricoMensal({ comissoes }) {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

  // Gerar dados de comissões por mês (últimos 12 meses)
  const dadosMensais = useMemo(() => {
    const hoje = new Date();
    const meses = [];
    for (let i = 11; i >= 0; i--) {
      const mes = addMonths(startOfMonth(hoje), -i);
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);

      let totalMes = 0;
      let qtdAtivas = 0;

      comissoes.forEach(c => {
        const isPagUnico = c.tipo_comissao === "Bônus" || c.tipo_comissao === "Angariação";
        const adesao = parseISO(c.data_adesao);

        if (isPagUnico) {
          // Pagamento único: contabilizar apenas no mês de lançamento
          if (isValid(adesao) && isWithinInterval(adesao, { start: inicioMes, end: fimMes })) {
            totalMes += c.valor_comissao || 0;
            qtdAtivas++;
          }
          return;
        }

        const expiracao = parseISO(c.data_expiracao);
        if (!isValid(adesao) || !isValid(expiracao)) return;

        // Comissão recorrente estava ativa nesse mês?
        if (!isAfter(adesao, fimMes) && !isBefore(expiracao, inicioMes)) {
          totalMes += c.valor_comissao || 0;
          qtdAtivas++;
        }

        // Considerar renovações passadas
        (c.historico_renovacoes || []).forEach(r => {
          if (!r.data_renovacao) return;
          const dataRenov = new Date(r.data_renovacao);
          // Valor anterior era ativo antes da renovação
          // Simplificar: já contado acima pelo período principal
        });
      });

      meses.push({
        mes: format(mes, "MMM/yy", { locale: ptBR }),
        mesCompleto: format(mes, "MMMM yyyy", { locale: ptBR }),
        valor: Math.round(totalMes * 100) / 100,
        qtd: qtdAtivas,
        inicioMes,
        fimMes
      });
    }
    return meses;
  }, [comissoes]);

  // Filtrar comissões por cliente e período
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
      if (isValid(inicio)) {
        filtradas = filtradas.filter(c => {
          const adesao = parseISO(c.data_adesao);
          return isValid(adesao) && !isBefore(adesao, inicio);
        });
      }
    }

    if (filtroFim) {
      const fim = parseISO(filtroFim);
      if (isValid(fim)) {
        filtradas = filtradas.filter(c => {
          const adesao = parseISO(c.data_adesao);
          return isValid(adesao) && !isAfter(adesao, fim);
        });
      }
    }

    return filtradas;
  }, [comissoes, filtroCliente, filtroInicio, filtroFim]);

  // Calcular total recebido por cliente (meses pagos * valor)
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
    const isPagUnico = c.tipo_comissao === "Bônus" || c.tipo_comissao === "Angariação";
    if (isPagUnico) return acc + (c.valor_comissao || 0);
    return acc + (c.valor_comissao || 0) * calcMesesPagos(c);
  }, 0);
  const totalRenovacoes = comissoesFiltradas.reduce((acc, c) => acc + (c.historico_renovacoes?.length || 0), 0);

  const renderLabel = (props) => {
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text x={x + width / 2} y={y - 6} fill="#fff" textAnchor="middle" fontSize={10} fontWeight="bold">
        {fmtCurrency(value)}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      {/* Gráfico mensal */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Comissões por Mês (Últimos 12 meses)
        </h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#e2e8f0", fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff" }}
                formatter={(value) => [fmtCurrency(value), "Valor"]}
                labelFormatter={(label) => {
                  const item = dadosMensais.find(d => d.mes === label);
                  return item?.mesCompleto || label;
                }}
              />
              <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="valor" content={renderLabel} />
              </Bar>
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
              <Input
                value={filtroCliente}
                onChange={e => setFiltroCliente(e.target.value)}
                placeholder="Nome ou produto..."
                className="pl-8 bg-white/10 border-white/20 text-white text-xs"
              />
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
              <p className="text-white/60 text-[10px]">Total Recebido</p>
              <p className="text-emerald-400 font-black text-sm">{fmtCurrency(totalFiltrado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista filtrada */}
      {(filtroCliente || filtroInicio || filtroFim) && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h4 className="text-white font-bold text-xs mb-2">
            Resultado: {comissoesFiltradas.length} comissão(ões) encontrada(s)
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {comissoesFiltradas.length === 0 ? (
              <p className="text-white/50 text-xs text-center py-4">Nenhuma comissão encontrada</p>
            ) : comissoesFiltradas.map(c => {
              const isPagUnico = c.tipo_comissao === "Bônus" || c.tipo_comissao === "Angariação";
              const mesesPagos = isPagUnico ? 1 : calcMesesPagos(c);
              const totalCliente = isPagUnico ? (c.valor_comissao || 0) : (c.valor_comissao || 0) * mesesPagos;
              return (
                <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{c.cliente_nome}</p>
                    <p className="text-white/50 text-[10px]">
                      {isPagUnico
                        ? `${c.tipo_comissao} • ${fmtCurrency(c.valor_comissao)} • Pagamento único`
                        : `${c.produto} • ${fmtCurrency(c.valor_comissao)}/mês • ${mesesPagos} meses pagos`
                      }
                      {(c.historico_renovacoes?.length || 0) > 0 && (
                        <span className="text-amber-400 ml-1">• {c.historico_renovacoes.length}x renovada</span>
                      )}
                    </p>
                  </div>
                  <span className="text-emerald-400 text-xs font-black flex-shrink-0 ml-2">
                    {fmtCurrency(totalCliente)}
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