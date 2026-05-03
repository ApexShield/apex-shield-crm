import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";

import MetaForm from "../components/metas/MetaForm";
import MetaComparativo from "../components/metas/MetaComparativo";
import MetaTeamSelector from "../components/metas/MetaTeamSelector";

const MESES = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" }, { value: "04", label: "Abril" },
  { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

export default function Metas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
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

  const selectedPeriodo = `${ano}-${mes}`;
  const selectedPeriodoLabel = `${MESES.find(m => m.value === mes)?.label || ""} ${ano}`;

  // Resolve metas and records based on selectedView, filtered by selected month
  const { metas, records, viewLabel, canEdit } = useMemo(() => {
    if (!teamData) return { metas: [], records: [], viewLabel: "", canEdit: false };

    const filterByPeriodo = (metasList) => metasList.filter(m => m.periodo === selectedPeriodo);
    const filterRecordsByMonth = (recordsList) => recordsList.filter(r => {
      if (!r.data) return false;
      return r.data.startsWith(selectedPeriodo);
    });

    const aggregateMembers = (members) => {
      const allMetas = [];
      const allRecords = [];
      for (const m of members) {
        allRecords.push(...filterRecordsByMonth(m.records || []));
        for (const meta of filterByPeriodo(m.metas || [])) {
          allMetas.push({ ...meta, _owner_nome: m.nome });
        }
      }
      return { metas: allMetas, records: allRecords };
    };

    if (selectedView === "__meu__") {
      const d = teamData.meusDados || {};
      return {
        metas: filterByPeriodo(d.metas || []),
        records: filterRecordsByMonth(d.records || []),
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

    if (selectedView.startsWith("__unidade__")) {
      const unitId = selectedView.replace("__unidade__", "");
      const unit = teamData.unidades?.[unitId];
      if (unit) {
        const allMembers = Object.values(unit.membros || {});
        const agg = aggregateMembers(allMembers);
        return { ...agg, viewLabel: `Equipe: ${unit.nome}`, canEdit: false };
      }
    }

    if (teamData.tipo === "LiderAgencia") {
      for (const u of Object.values(teamData.unidades || {})) {
        const member = u.membros?.[selectedView];
        if (member) {
          return {
            metas: filterByPeriodo(member.metas || []),
            records: filterRecordsByMonth(member.records || []),
            viewLabel: member.nome,
            canEdit: false,
          };
        }
      }
    }
    if (teamData.tipo === "LiderUnidade") {
      const member = teamData.membros?.[selectedView];
      if (member) {
        return {
          metas: filterByPeriodo(member.metas || []),
          records: filterRecordsByMonth(member.records || []),
          viewLabel: member.nome,
          canEdit: false,
        };
      }
    }

    return { metas: [], records: [], viewLabel: "", canEdit: false };
  }, [teamData, selectedView, selectedPeriodo]);

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
            <Select value={ano} onValueChange={(v) => setAno(v)}>
              <SelectTrigger className="w-[100px] bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={mes} onValueChange={(v) => setMes(v)}>
              <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
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
              onSelectView={setSelectedView}
            />
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-5">
            <MetaComparativo
              data={records}
              metas={metas}
              onEdit={canEdit ? (m) => { setEditingMeta(m); setShowForm(true); } : null}
              showOwner={selectedView === "__todos__" || selectedView.startsWith("__unidade__")}
              periodoLabel={selectedPeriodoLabel}
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