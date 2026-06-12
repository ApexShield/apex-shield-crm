import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { DollarSign, Award, TrendingUp } from "lucide-react";

const parseCurrency = (val) => {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
};

const fmtCurrency = (v) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00";

function mapProdutoToCode(cliente) {
  const produto = (cliente.dados_apolice?.produto || "").toUpperCase();
  const periodo = cliente.dados_apolice?.periodo_cobertura || "";
  
  if (produto.includes("VIDA SEGURA") || produto.includes("VS")) {
    if (periodo === "75") return "VS75";
    return `VS${periodo || "?"}`;
  }
  if (produto.includes("TOTAL SINGULAR") || produto.includes("VT SINGULAR")) {
    if (produto.includes("LEGADO")) return "VT Singular Legado";
    return "VT Singular";
  }
  if (produto.includes("VIDA TOTAL") || produto.includes("VT")) {
    if (produto.includes("LEGADO")) {
      if (periodo === "10") return "VT Legado 10";
      return "VT Legado 2";
    }
    if (periodo === "65") return "VT65";
    if (periodo === "99") return "VT99";
    return `VT${periodo || "?"}`;
  }
  if (produto.includes("VIDA SINGULAR")) {
    if (periodo === "75") return "VS75";
    return `VS${periodo || "?"}`;
  }
  return produto || "Outro";
}

function calcAnosDesdeImplantacao(dataImpl) {
  if (!dataImpl) return 0;
  const impl = new Date(dataImpl);
  const hoje = new Date();
  return Math.floor((hoje - impl) / (365.25 * 24 * 60 * 60 * 1000));
}

function matchPeriodo(anos) {
  if (anos < 1) return "Até 1 ano";
  if (anos >= 1 && anos < 2) return "Até 1 ano";
  if (anos >= 2 && anos < 3) return "Após 2 anos";
  if (anos >= 3 && anos < 4) return "Após 3 anos";
  if (anos >= 4 && anos < 5) return "Após 4 anos";
  return "Vitalício";
}

export default function GraficoPremiacoes({ clientes, comissoes, angariacao }) {
  const stats = useMemo(() => {
    const clientesComApolice = clientes.filter(c => c.dados_apolice?.total_premio_iof);
    
    let totalComissao = 0;
    let totalAngariacao = 0;
    const detalhes = [];

    clientesComApolice.forEach(c => {
      const premio = parseCurrency(c.dados_apolice.total_premio_iof);
      const freq = (c.dados_apolice.frequencia_pagamento || "").toLowerCase();
      const pa = freq === "mensal" ? premio * 12 : premio;
      const codigoProduto = mapProdutoToCode(c);
      const dataImpl = c.dados_apolice.data_implantacao;
      const anosDesde = calcAnosDesdeImplantacao(dataImpl);
      const periodoStr = matchPeriodo(anosDesde);

      // Find matching commission
      const comissao = comissoes.find(com => 
        com.produto === codigoProduto && 
        com.frequencia_pagamento === (freq === "mensal" ? "Mensal" : "Anual") &&
        com.periodo_pagamento === periodoStr
      );
      
      const percComissao = comissao?.percentual_comissao || 0;
      const valorComissao = (pa * percComissao) / 100;
      totalComissao += valorComissao;

      // Find matching angariação
      const faixa = angariacao
        .sort((a, b) => a.faixa_pa_min - b.faixa_pa_min)
        .find(a => pa >= a.faixa_pa_min && pa <= a.faixa_pa_max);
      const premioAng = faixa?.premio_angariacao || 0;
      totalAngariacao += premioAng;

      detalhes.push({
        nome: c.nome,
        produto: codigoProduto,
        pa,
        percComissao,
        valorComissao,
        premioAngariacao: premioAng
      });
    });

    return { totalComissao, totalAngariacao, detalhes, total: totalComissao + totalAngariacao };
  }, [clientes, comissoes, angariacao]);

  const chartData = [
    { name: "Comissões", valor: Math.round(stats.totalComissao * 100) / 100, fill: "#10b981" },
    { name: "Angariação", valor: Math.round(stats.totalAngariacao * 100) / 100, fill: "#f59e0b" }
  ];

  const renderLabel = (props) => {
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text x={x + width / 2} y={y - 6} fill="#fff" textAnchor="middle" fontSize={11} fontWeight="bold">
        {fmtCurrency(value)}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 rounded-xl border border-emerald-500/30 p-4 text-center">
          <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <p className="text-white/60 text-xs">Total Comissões</p>
          <p className="text-2xl font-black text-emerald-400">{fmtCurrency(stats.totalComissao)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/30 to-amber-600/30 rounded-xl border border-amber-500/30 p-4 text-center">
          <Award className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <p className="text-white/60 text-xs">Total Angariação</p>
          <p className="text-2xl font-black text-amber-400">{fmtCurrency(stats.totalAngariacao)}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 rounded-xl border border-cyan-500/30 p-4 text-center">
          <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
          <p className="text-white/60 text-xs">Total a Receber</p>
          <p className="text-2xl font-black text-cyan-400">{fmtCurrency(stats.total)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h4 className="text-white font-bold text-sm mb-3">Gráfico de Premiações</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 12 }} />
              <YAxis tick={{ fill: "#e2e8f0", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff" }}
                formatter={(value) => [fmtCurrency(value), ""]}
              />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="valor" content={renderLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalhes por cliente */}
      {stats.detalhes.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h4 className="text-white font-bold text-sm mb-3">Detalhamento por Cliente</h4>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {stats.detalhes.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{d.nome}</p>
                  <p className="text-white/50 text-[10px]">{d.produto} • PA: {fmtCurrency(d.pa)} • {d.percComissao}%</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-emerald-400 text-xs font-bold">{fmtCurrency(d.valorComissao)}</span>
                  {d.premioAngariacao > 0 && (
                    <span className="text-amber-400 text-xs font-bold">+{fmtCurrency(d.premioAngariacao)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}