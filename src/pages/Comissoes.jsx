import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Table2, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import TabelaComissaoForm from "../components/comissoes/TabelaComissaoForm";
import TabelaAngariacaoForm from "../components/comissoes/TabelaAngariacaoForm";
import GraficoPremiacoes from "../components/comissoes/GraficoPremiacoes";

export default function Comissoes() {
  const [showComissoes, setShowComissoes] = useState(true);
  const [showAngariacao, setShowAngariacao] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: comissoes = [] } = useQuery({
    queryKey: ["tabela-comissao"],
    queryFn: () => base44.entities.TabelaComissao.filter({}, "produto", 500),
    enabled: !!user
  });

  const { data: angariacao = [] } = useQuery({
    queryKey: ["tabela-angariacao"],
    queryFn: () => base44.entities.TabelaAngariacao.filter({}, "faixa_pa_min", 100),
    enabled: !!user
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.filter({}, "-created_date", 5000),
    enabled: !!user
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tabela-comissao"] });
    queryClient.invalidateQueries({ queryKey: ["tabela-angariacao"] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-white">Comissões e Premiações</h1>
            <p className="text-sm text-emerald-300">Configure sua tabela de comissões e acompanhe seus ganhos</p>
          </div>
        </div>

        {/* Gráfico de Premiações */}
        <GraficoPremiacoes clientes={clientes} comissoes={comissoes} angariacao={angariacao} />

        {/* Tabela de Comissões */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
          <Button
            variant="ghost"
            onClick={() => setShowComissoes(!showComissoes)}
            className="w-full flex items-center justify-between text-white hover:bg-white/5 mb-2"
          >
            <div className="flex items-center gap-2">
              <Table2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm">Tabela de Comissões por Produto</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">{comissoes.length}</span>
            </div>
            {showComissoes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <AnimatePresence>
            {showComissoes && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <TabelaComissaoForm comissoes={comissoes} onRefresh={refresh} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabela de Angariação */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
          <Button
            variant="ghost"
            onClick={() => setShowAngariacao(!showAngariacao)}
            className="w-full flex items-center justify-between text-white hover:bg-white/5 mb-2"
          >
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm">Tabela de Angariação (Prêmio por PA)</span>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">{angariacao.length}</span>
            </div>
            {showAngariacao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <AnimatePresence>
            {showAngariacao && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <TabelaAngariacaoForm angariacao={angariacao} onRefresh={refresh} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}