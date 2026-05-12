import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";

import PainelDateFilter from "../components/painel/PainelDateFilter";
import ReunioesBlock from "../components/painel/ReunioesBlock";
import PainelCharts from "../components/painel/PainelCharts";
import AtividadesDia from "../components/painel/AtividadesDia";

function getDefaultDates() {
  const now = new Date();
  return {
    inicio: format(startOfMonth(now), "yyyy-MM-dd"),
    fim: format(endOfMonth(now), "yyyy-MM-dd")
  };
}

export default function PainelPrincipal() {
  const defaults = getDefaultDates();
  const [dataInicio, setDataInicio] = useState(defaults.inicio);
  const [dataFim, setDataFim] = useState(defaults.fim);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: allClientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.filter({}, "-created_date", 5000),
    enabled: !!user
  });

  const { data: allCompromissos = [], isLoading: loadingCompromissos } = useQuery({
    queryKey: ["compromissos"],
    queryFn: () => base44.entities.Compromisso.filter({}, "-data_inicio", 2000),
    enabled: !!user
  });

  // Filtrar clientes do usuário (mesma lógica do Leads)
  const clientes = useMemo(() => {
    if (!user || !allClientes.length) return [];
    if (user.role === "admin") return allClientes;
    return allClientes.filter(c => c.created_by === user.email);
  }, [allClientes, user]);

  const compromissos = useMemo(() => {
    if (!user || !allCompromissos.length) return [];
    if (user.role === "admin") return allCompromissos;
    return allCompromissos.filter(c => 
      c.created_by === user.email || 
      c.owner_email === user.email || 
      (c.email_participante && c.email_participante.toLowerCase() === user.email.toLowerCase())
    );
  }, [allCompromissos, user]);

  const handleResetDates = () => {
    const d = getDefaultDates();
    setDataInicio(d.inicio);
    setDataFim(d.fim);
  };

  const isLoading = loadingClientes || loadingCompromissos;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-white">Painel Principal</h1>
              <p className="text-sm text-indigo-300">Bem-vindo, {user?.full_name || "Corretor"}!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl("Leads")}>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-xs font-bold gap-1">
                <Users className="w-4 h-4" /> Ir para Leads <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtro de Data */}
        <PainelDateFilter
          dataInicio={dataInicio}
          dataFim={dataFim}
          onChangeInicio={setDataInicio}
          onChangeFim={setDataFim}
          onReset={handleResetDates}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Blocos de Reuniões */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ReunioesBlock
                compromissos={compromissos}
                clientes={clientes}
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </motion.div>

            {/* Gráficos */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <PainelCharts
                compromissos={compromissos}
                clientes={clientes}
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </motion.div>

            {/* Atividades do Dia */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <AtividadesDia clientes={clientes} compromissos={compromissos} />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}