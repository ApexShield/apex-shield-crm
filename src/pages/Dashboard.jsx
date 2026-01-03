import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Ticket, Users, Clock, CheckCircle2, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import StatsCard from "../components/dashboard/StatsCard";
import RecentTickets from "../components/dashboard/RecentTickets";
import TicketForm from "../components/tickets/TicketForm";

export default function Dashboard() {
  const [showTicketForm, setShowTicketForm] = useState(false);

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date", 50)
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list("-created_date", 100)
  });

  const stats = {
    total: tickets.length,
    novos: tickets.filter(t => t.status === "novo").length,
    emAndamento: tickets.filter(t => t.status === "em_andamento").length,
    concluidos: tickets.filter(t => t.status === "concluido").length
  };

  const handleCreateTicket = async (data) => {
    await base44.entities.Ticket.create(data);
    setShowTicketForm(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">Visão geral do atendimento</p>
          </div>
          <Button 
            onClick={() => setShowTicketForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Ticket
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total de Tickets"
            value={stats.total}
            icon={Ticket}
            color="bg-indigo-500"
            trend={`${stats.novos} novos hoje`}
          />
          <StatsCard
            title="Novos"
            value={stats.novos}
            icon={Clock}
            color="bg-blue-500"
          />
          <StatsCard
            title="Em Andamento"
            value={stats.emAndamento}
            icon={TrendingUp}
            color="bg-amber-500"
          />
          <StatsCard
            title="Concluídos"
            value={stats.concluidos}
            icon={CheckCircle2}
            color="bg-emerald-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTickets tickets={tickets} />
          </div>
          
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border-0 p-6"
            >
              <h3 className="font-semibold text-slate-800 mb-4">Clientes Ativos</h3>
              <div className="space-y-3">
                {clientes.filter(c => c.status === 'ativo').slice(0, 5).map((cliente) => (
                  <div key={cliente.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {cliente.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{cliente.nome}</p>
                      <p className="text-xs text-slate-500">{cliente.empresa || cliente.email}</p>
                    </div>
                  </div>
                ))}
                {clientes.filter(c => c.status === 'ativo').length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">Nenhum cliente ativo</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <TicketForm
        open={showTicketForm}
        onClose={() => setShowTicketForm(false)}
        clientes={clientes}
        onSave={handleCreateTicket}
      />
    </div>
  );
}