import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";

import MetaForm from "../components/metas/MetaForm";
import MetaComparativo from "../components/metas/MetaComparativo";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import MetaTeamSelector from "../components/metas/MetaTeamSelector";

export default function Metas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [filteredData, setFilteredData] = useState(null);
  const [selectedView, setSelectedView] = useState("__meu__");

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["metas-equipe", ano],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMetasEquipe", { ano });
      return res.data;
    },
  });

  const years = [];
  for (let y = 2024; y <= new Date().getFullYear() + 1; y++) years.push(y);

  // Resolve metas and records based on selectedView
  const { metas, records, viewLabel, canEdit } = useMemo(() => {
    if (!teamData) return { metas: [], records: [], viewLabel: "", canEdit: false };

    // Helper: aggregate metas & records from a list of member data
    const aggregateMembers = (members) => {
      const allMetas = [];
      const allRecords = [];
      const seenMetaPeriodos = new Map();
      for (const m of members) {
        allRecords.push(...(m.records || []));
        for (const meta of (m.metas || [])) {
          // When viewing "todos", show each user's meta separately with their name
          allMetas.push({ ...meta, _owner_nome: m.nome });
        }
      }
      return { metas: allMetas, records: allRecords };
    };

    if (selectedView === "__meu__") {
      const d = teamData.meusDados || {};
      return {
        metas: d.metas || [],
        records: d.records || [],
        viewLabel: "Minhas Metas",
        canEdit: true,
      };
    }

    if (selectedView === "__todos__") {
      if (teamData.tipo === "LiderAgencia") {
        const allMembers = [];
        if (teamData.meusDados) allMembers.push(teamData.meusDados);
        for (const u of Object.values(teamData.unidades || {})) {
          allMembers.push(...Object.values(u.membros || {}));
        }
        const agg = aggregateMembers(allMembers);
        return { ...agg, viewLabel: "Toda a Agência", canEdit: false };
      }
      if (teamData.tipo === "LiderUnidade") {
        const allMembers = [];
        if (teamData.meusDados) allMembers.push(teamData.meusDados);
        allMembers.push(...Object.values(teamData.membros || {}));
        const agg = aggregateMembers(allMembers);
        return { ...agg, viewLabel: "Toda a Equipe", canEdit: false };
      }
    }

    // Unit view: __unidade__<id>
    if (selectedView.startsWith("__unidade__")) {
      const unitId = selectedView.replace("__unidade__", "");
      const unit = teamData.unidades?.[unitId];
      if (unit) {
        const allMembers = Object.values(unit.membros || {});
        const agg = aggregateMembers(allMembers);
        return { ...agg, viewLabel: `Equipe: ${unit.nome}`, canEdit: false };
      }
    }

    // Individual member by email
    if (teamData.tipo === "LiderAgencia") {
      for (const u of Object.values(teamData.unidades || {})) {
        const member = u.membros?.[selectedView];
        if (member) {
          return { metas: member.metas || [], records: member.records || [], viewLabel: member.nome, canEdit: false };
        }
      }
    }
    if (teamData.tipo === "LiderUnidade") {
      const member = teamData.membros?.[selectedView];
      if (member) {
        return { metas: member.metas || [], records: member.records || [], viewLabel: member.nome, canEdit: false };
      }
    }

    return { metas: [], records: [], viewLabel: "", canEdit: false };
  }, [teamData, selectedView]);

  const dataToUse = filteredData || records;

  const isLeader = teamData?.tipo === "LiderAgencia" || teamData?.tipo === "LiderUnidade";

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
              <p className="text-sm text-slate-400">
                {viewLabel || "Compare suas metas com os dados realizados"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Team selector for leaders */}
        {isLeader && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MetaTeamSelector
              teamData={teamData}
              selectedView={selectedView}
              onSelectView={(v) => { setSelectedView(v); setFilteredData(null); }}
            />
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-5">
            <DashboardFilters data={records} onFilteredData={setFilteredData} ano={ano} />
            <MetaComparativo
              data={dataToUse}
              metas={metas}
              onEdit={canEdit ? (m) => { setEditingMeta(m); setShowForm(true); } : null}
              showOwner={selectedView === "__todos__" || selectedView.startsWith("__unidade__")}
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