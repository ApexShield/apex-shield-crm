import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Painel de Metas</h1>
            <p className="text-sm text-slate-500">Compare suas metas com os dados realizados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingMeta(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-4 h-4" />
            Definir Meta
          </Button>
        </div>
      </motion.div>

      {loadingRecords || loadingMetas ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <DashboardFilters data={records} onFilteredData={setFilteredData} ano={ano} />
          <MetaComparativo data={dataToUse} metas={metas} onEdit={(m) => { setEditingMeta(m); setShowForm(true); }} />
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
  );
}