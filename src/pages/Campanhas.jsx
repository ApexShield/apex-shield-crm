import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Send, Plus, Loader2, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import CampanhaForm from "../components/campanhas/CampanhaForm";
import CampanhaHistorico from "../components/campanhas/CampanhaHistorico";

export default function Campanhas() {
  const [showForm, setShowForm] = useState(false);

  const { data: campanhas = [], isLoading } = useQuery({
    queryKey: ["campanhas"],
    queryFn: () => base44.entities.Campanha.list("-created_date", 50),
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-campanha", user?.email],
    queryFn: () => base44.entities.Cliente.filter({ created_by: user.email }, "-created_date", 5000),
    enabled: !!user?.email,
  });

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Campanhas de Divulgação</h1>
            <p className="text-sm text-slate-500">Envie conteúdos por Email e WhatsApp para seus clientes</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Campanhas", value: campanhas.length, color: "from-indigo-500 to-indigo-600" },
          { label: "Emails Enviados", value: campanhas.reduce((s, c) => s + (c.emails_enviados || 0), 0), color: "from-blue-500 to-blue-600" },
          { label: "WhatsApp Enviados", value: campanhas.reduce((s, c) => s + (c.whatsapp_gerados || 0), 0), color: "from-green-500 to-green-600" },
          { label: "Clientes Cadastrados", value: clientes.length, color: "from-purple-500 to-purple-600" },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white`}>
            <p className="text-white/70 text-xs font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Histórico */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <CampanhaHistorico campanhas={campanhas} />
      )}

      {/* Form */}
      {showForm && (
        <CampanhaForm open={showForm} onClose={() => setShowForm(false)} clientes={clientes} />
      )}
    </div>
  );
}