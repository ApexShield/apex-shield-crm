import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart3, Loader2, Users, User } from "lucide-react";
import { motion } from "framer-motion";

import DashboardInputForm from "../components/dashboard/DashboardInputForm";
import DashboardKPICards from "../components/dashboard/DashboardKPICards";
import DashboardWeeklyTable from "../components/dashboard/DashboardWeeklyTable";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import DashboardConversion from "../components/dashboard/DashboardConversion";
import DashboardRecordsList from "../components/dashboard/DashboardRecordsList";
import DashboardExport from "../components/dashboard/DashboardExport";
import DashboardImport from "../components/dashboard/DashboardImport";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import DashboardEquipeView from "../components/dashboard/DashboardEquipeView";

export default function DashboardAtividades() {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [filteredData, setFilteredData] = useState(null);
  const [viewMode, setViewMode] = useState("meus"); // "meus" or "equipe"

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["dashboard-diario", ano],
    queryFn: () => base44.entities.DashboardDiario.filter({ ano }, "-data"),
  });

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const years = [];
  for (let y = 2024; y <= new Date().getFullYear() + 1; y++) years.push(y);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard de Atividades</h1>
            <p className="text-sm text-slate-500">Acompanhe suas métricas diárias e semanais</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={String(ano)} onValueChange={v => setAno(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <DashboardImport data={records} ano={ano} />
          <DashboardExport data={records} ano={ano} />
          <Button onClick={() => { setEditingRecord(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="w-4 h-4" />
            Novo Registro
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <DashboardFilters data={records} onFilteredData={setFilteredData} ano={ano} />
          <DashboardKPICards data={filteredData || records} />
          <DashboardCharts data={filteredData || records} />
          <DashboardConversion data={filteredData || records} />
          <DashboardWeeklyTable data={filteredData || records} maxWeeks={52} />
          <DashboardRecordsList data={filteredData || records} onEdit={handleEdit} />
        </div>
      )}

      {showForm && (
        <DashboardInputForm
          open={showForm}
          onClose={handleCloseForm}
          existingRecord={editingRecord}
        />
      )}
    </div>
  );
}