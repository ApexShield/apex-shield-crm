import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Building2, ChevronDown, ChevronRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardKPICards from "./DashboardKPICards";
import DashboardCharts from "./DashboardCharts";
import DashboardConversion from "./DashboardConversion";

function MemberCard({ nome, email, tipo, records, isExpanded, onToggle }) {
  const tipoLabel = {
    LiderUnidade: "Líder de Unidade",
    LiderAgencia: "Líder de Agência",
    UsuarioVIP: "Corretor",
  }[tipo] || "Corretor";

  const tipoColor = {
    LiderUnidade: "bg-purple-100 text-purple-700",
    LiderAgencia: "bg-indigo-100 text-indigo-700",
    UsuarioVIP: "bg-slate-100 text-slate-700",
  }[tipo] || "bg-slate-100 text-slate-700";

  const totalLigacoes = records.reduce((s, r) => s + (r.ligacoes_realizadas || 0), 0);
  const totalAgend = records.reduce((s, r) => s + (r.agendamentos_feitos || 0), 0);
  const totalABs = records.reduce((s, r) => s + (r.abs_realizadas || 0), 0);
  const totalN = records.reduce((s, r) => s + (r.n_protocoladas || 0), 0);
  const totalPA = records.reduce((s, r) => s + (r.pa || 0), 0);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {nome?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate">{nome}</div>
          <div className="text-xs text-slate-500 truncate">{email}</div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoColor} flex-shrink-0`}>
          {tipoLabel}
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
          <span>Lig: <b className="text-slate-700">{totalLigacoes}</b></span>
          <span>Agend: <b className="text-slate-700">{totalAgend}</b></span>
          <span>ABs: <b className="text-slate-700">{totalABs}</b></span>
          <span>N: <b className="text-slate-700">{totalN}</b></span>
          <span>PA: <b className="text-indigo-600">R$ {totalPA.toLocaleString("pt-BR")}</b></span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 border-t border-slate-100">
              <DashboardKPICards data={records} />
              <DashboardCharts data={records} />
              <DashboardConversion data={records} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitSection({ unidade, isExpanded, onToggle, expandedMembers, setExpandedMembers }) {
  const membros = Object.values(unidade.membros || {});
  const totalRecords = unidade.totalRecords || [];

  const totalPA = totalRecords.reduce((s, r) => s + (r.pa || 0), 0);
  const totalLig = totalRecords.reduce((s, r) => s + (r.ligacoes_realizadas || 0), 0);
  const totalN = totalRecords.reduce((s, r) => s + (r.n_protocoladas || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-indigo-50/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800">{unidade.nome}</div>
          <div className="text-xs text-slate-500">Líder: {unidade.lider_nome} • {membros.length} membro(s)</div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
          <span>Lig: <b className="text-slate-700">{totalLig}</b></span>
          <span>N: <b className="text-slate-700">{totalN}</b></span>
          <span>PA: <b className="text-indigo-600">R$ {totalPA.toLocaleString("pt-BR")}</b></span>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 p-4 space-y-4">
              {/* Unit totals */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-700">Total da Unidade</span>
                </div>
                <DashboardKPICards data={totalRecords} />
              </div>

              {/* Members */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Membros</span>
                </div>
                {membros.length === 0 && (
                  <p className="text-sm text-slate-400 italic">Nenhum membro com dados registrados</p>
                )}
                {membros.map(m => (
                  <MemberCard
                    key={m.email}
                    nome={m.nome}
                    email={m.email}
                    tipo={m.tipo}
                    records={m.records}
                    isExpanded={expandedMembers[m.email]}
                    onToggle={() => setExpandedMembers(prev => ({ ...prev, [m.email]: !prev[m.email] }))}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardEquipeView({ teamData, ano }) {
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedMembers, setExpandedMembers] = useState({});

  if (!teamData) return null;

  if (teamData.tipo === "LiderAgencia") {
    const unidades = Object.values(teamData.unidades || {});

    // Calculate agency totals
    const allRecords = unidades.flatMap(u => u.totalRecords || []);

    return (
      <div className="space-y-4">
        {/* Agency overview */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Agência: {teamData.agencia_nome}</h2>
              <p className="text-indigo-100 text-sm">{unidades.length} unidade(s)</p>
            </div>
          </div>
        </div>

        {/* Agency KPIs */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">Visão Geral da Agência</span>
          </div>
          <DashboardKPICards data={allRecords} />
        </div>

        <DashboardCharts data={allRecords} />
        <DashboardConversion data={allRecords} />

        {/* Units */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Unidades</h3>
          </div>
          {unidades.map(u => (
            <UnitSection
              key={u.id}
              unidade={u}
              isExpanded={expandedUnits[u.id]}
              onToggle={() => setExpandedUnits(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
              expandedMembers={expandedMembers}
              setExpandedMembers={setExpandedMembers}
            />
          ))}
        </div>
      </div>
    );
  }

  if (teamData.tipo === "LiderUnidade") {
    const membros = Object.values(teamData.membros || {});
    const totalRecords = teamData.totalRecords || [];

    return (
      <div className="space-y-4">
        {/* Unit header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Unidade: {teamData.unidade_nome}</h2>
              <p className="text-purple-100 text-sm">{membros.length} corretor(es)</p>
            </div>
          </div>
        </div>

        {/* Team totals */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-bold text-purple-700">Total da Equipe</span>
          </div>
          <DashboardKPICards data={totalRecords} />
        </div>

        <DashboardCharts data={totalRecords} />
        <DashboardConversion data={totalRecords} />

        {/* Members */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800">Corretores</h3>
          </div>
          {membros.length === 0 && (
            <p className="text-sm text-slate-400 italic p-4 bg-white rounded-xl border">Nenhum corretor com dados registrados</p>
          )}
          {membros.map(m => (
            <MemberCard
              key={m.email}
              nome={m.nome}
              email={m.email}
              tipo={m.tipo}
              records={m.records}
              isExpanded={expandedMembers[m.email]}
              onToggle={() => setExpandedMembers(prev => ({ ...prev, [m.email]: !prev[m.email] }))}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}