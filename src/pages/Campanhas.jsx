import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import CampanhaForm from "../components/campanhas/CampanhaForm";
import CampanhaHistorico from "../components/campanhas/CampanhaHistorico";
import CampanhaDetalhe from "../components/campanhas/CampanhaDetalhe";

export default function Campanhas() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState(null);

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
    <div className="p-3 md:p-6 max-w-[1000px] mx-auto space-y-3 md:space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold text-slate-800">Campanhas de Divulgação</h1>
            <p className="text-[11px] md:text-sm text-slate-500">Envie conteúdos por Email e WhatsApp para seus clientes</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2.5 md:px-4 flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
          Nova Campanha
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: "Total Campanhas", value: campanhas.length, color: "from-indigo-500 to-indigo-600" },
          { label: "Emails Enviados", value: campanhas.reduce((s, c) => s + (c.emails_enviados || 0), 0), color: "from-blue-500 to-blue-600" },
          { label: "WhatsApp Enviados", value: campanhas.reduce((s, c) => s + (c.whatsapp_gerados || 0), 0), color: "from-green-500 to-green-600" },
          { label: "Seus Clientes", value: clientes.length, color: "from-purple-500 to-purple-600" },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-lg md:rounded-xl p-2.5 md:p-4 text-white`}>
            <p className="text-white/70 text-[10px] md:text-xs font-medium">{stat.label}</p>
            <p className="text-lg md:text-2xl font-bold mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Histórico */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <CampanhaHistorico campanhas={campanhas} onSelectCampanha={setSelectedCampanha} />
      )}

      {/* Form */}
      {showForm && (
        <CampanhaForm open={showForm} onClose={() => setShowForm(false)} clientes={clientes} />
      )}

      {/* Detalhe */}
      <CampanhaDetalhe 
        campanha={selectedCampanha} 
        open={!!selectedCampanha} 
        onClose={() => setSelectedCampanha(null)} 
      />
    </div>
  );
}