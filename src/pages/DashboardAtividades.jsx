import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart3, Loader2, Users, User, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const isLider = user?.tipo_hierarquia === "LiderAgencia" || user?.tipo_hierarquia === "LiderUnidade" || 
    user?.tipo_hierarquia === "Líder de Agência" || user?.tipo_hierarquia === "Líder de Unidade";

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["dashboard-diario", ano],
    queryFn: () => base44.entities.DashboardDiario.filter({ ano }, "-data"),
  });

  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["dashboard-equipe", ano],
    queryFn: () => base44.functions.invoke("getDashboardEquipe", { ano }).then(r => r.data),
    enabled: isLider,
  });

  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = async () => {
    setIsClearing(true);
    const allRecords = await base44.entities.DashboardDiario.filter({ ano }, "-data", 5000);
    for (const record of allRecords) {
      await base44.entities.DashboardDiario.delete(record.id);
    }
    queryClient.invalidateQueries({ queryKey: ["dashboard-diario"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-equipe"] });
    setIsClearing(false);
  };

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

        <div className="flex flex-wrap items-center gap-2">
          {isLider && (
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <Button
                variant={viewMode === "meus" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("meus")}
                className={`gap-1.5 text-xs h-8 ${viewMode === "meus" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
              >
                <User className="w-3.5 h-3.5" />
                Meus Dados
              </Button>
              <Button
                variant={viewMode === "equipe" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("equipe")}
                className={`gap-1.5 text-xs h-8 ${viewMode === "equipe" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
              >
                <Users className="w-3.5 h-3.5" />
                Equipe
              </Button>
            </div>
          )}
          <Select value={String(ano)} onValueChange={v => setAno(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          {viewMode === "meus" && (
            <>
              <DashboardImport data={records} ano={ano} />
              <DashboardExport data={records} ano={ano} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5" disabled={isClearing || records.length === 0}>
                    {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Limpar Dados
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar todos os dados de {ano}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá excluir permanentemente todos os {records.length} registros do Dashboard de Atividades do ano {ano}. 
                      Recomendamos exportar um relatório antes de prosseguir. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                      {isClearing ? "Limpando..." : "Sim, limpar tudo"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => { setEditingRecord(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus className="w-4 h-4" />
                Novo Registro
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {isLoading || (isLider && isLoadingTeam) ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : viewMode === "equipe" && isLider ? (
        <DashboardEquipeView teamData={teamData} ano={ano} />
      ) : (
        <div className="space-y-4">
          {/* Para líderes em "Meus Dados", mostra dados da equipe toda */}
          {isLider && teamData ? (
            <>
              <DashboardFilters data={teamData.totalRecords || records} onFilteredData={setFilteredData} ano={ano} />
              <DashboardKPICards data={filteredData || teamData.totalRecords || records} />
              <DashboardCharts data={filteredData || teamData.totalRecords || records} />
              <DashboardConversion data={filteredData || teamData.totalRecords || records} />
              <DashboardWeeklyTable data={filteredData || teamData.totalRecords || records} maxWeeks={52} />
              <DashboardRecordsList data={filteredData || teamData.totalRecords || records} onEdit={handleEdit} />
            </>
          ) : (
            <>
              <DashboardFilters data={records} onFilteredData={setFilteredData} ano={ano} />
              <DashboardKPICards data={filteredData || records} />
              <DashboardCharts data={filteredData || records} />
              <DashboardConversion data={filteredData || records} />
              <DashboardWeeklyTable data={filteredData || records} maxWeeks={52} />
              <DashboardRecordsList data={filteredData || records} onEdit={handleEdit} />
            </>
          )}
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