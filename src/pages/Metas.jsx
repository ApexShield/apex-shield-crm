import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";

import MetaForm from "../components/metas/MetaForm";
import MetaComparativo from "../components/metas/MetaComparativo";
import DashboardFilters from "../components/dashboard/DashboardFilters";

export default function Metas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [filteredData, setFilteredData] = useState(null);

  const { data: metas = [], isLoading: loadingMetas } = useQuery({
    queryKey: ["metas"],
    queryFn: () => base44.entities.Meta.list("-created_date", 500),
  });

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ["dashboard-diario-metas", ano],
    queryFn: () => ano === "todos"
      ? base44.entities.DashboardDiario.list("-data", 5000)
      : base44.entities.DashboardDiario.filter({ ano: parseInt(ano) }, "-data", 5000),
  });

  const years = [];
  for (let y = 2024; y <= new Date().getFullYear() + 1; y++) years.push(y);

  const dataToUse = filteredData || records;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg" style={{ boxShadow: "0 0 16px rgba(0,229,255,0.3)" }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Painel de Metas</h1>
              <p className="text-sm text-slate-400">Compare suas metas com os dados realizados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={ano} onValueChange={(v) => { setAno(v); setFilteredData(null); }}>
              <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={() => { setEditingMeta(null); setShowForm(true); }}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 font-bold shadow-lg"
              style={{ boxShadow: "0 0 12px rgba(0,229,255,0.25)" }}
            >
              <Plus className="w-4 h-4" />
              Definir Meta
            </Button>
          </div>
        </motion.div>

        {loadingRecords || loadingMetas ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-5">
            <DashboardFilters data={records} onFilteredData={setFilteredData} ano={ano} />
            <MetaComparativo
              data={dataToUse}
              metas={metas}
              onEdit={(m) => { setEditingMeta(m); setShowForm(true); }}
            />
          </div>
        )}

        {showForm && (
          <MetaForm
            open={showForm}
            onClose={() => { setShowForm(false); setEditingMeta(null); }}
            existingMeta={editingMeta}
          />
        )}
      </div>
    </div>
  );
}