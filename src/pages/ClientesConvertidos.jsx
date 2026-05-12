import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Edit, Trash2, FileText, Users, ArrowUpDown, ArrowUp, ArrowDown, UserCheck, TrendingUp, Phone, Mail, Building2 } from "lucide-react";
import usePersistedState from "../hooks/usePersistedState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import FormularioLead from "../components/leads/FormularioLead";
import DocumentosDialog from "../components/leads/DocumentosDialog";
import ApoliceDialog from "../components/leads/ApoliceDialog";

const STATUS_CONFIG = [
  { value: "", label: "TODOS", color: "rgb(25, 55, 109)", textColor: "white" },
  { value: "AB Fechamento", label: "AB FECHAMENTO", color: "rgb(255, 215, 0)", textColor: "black" },
  { value: "Análise", label: "ANÁLISE", color: "rgb(165, 42, 42)", textColor: "white" },
  { value: "Venda Feita", label: "VENDA FEITA", color: "rgb(34, 139, 34)", textColor: "white" },
  { value: "Entrega de Apólice", label: "ENTREGA APÓLICE", color: "rgb(200, 162, 200)", textColor: "black" },
  { value: "Encerrado", label: "ENCERRADO", color: "rgb(105, 105, 105)", textColor: "white" },
];

export default function ClientesConvertidos() {
  const [filtroStatus, setFiltroStatus] = usePersistedState("clientes_filtroStatus", "");
  const [busca, setBusca] = usePersistedState("clientes_busca", "");
  const [sortColumn, setSortColumn] = usePersistedState("clientes_sortCol", null);
  const [sortDirection, setSortDirection] = usePersistedState("clientes_sortDir", "desc");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [showApolice, setShowApolice] = useState(false);

  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: allClientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.filter({}, "-created_date", 5000),
    enabled: !!user
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  // Only show converted clients
  const clientes = useMemo(() => {
    if (!user || !allClientes.length) return [];
    let filtered = allClientes.filter(c => c.is_cliente === true);

    if (user.role !== "admin") {
      if (user.tipo_hierarquia === "Líder de Agência" || user.tipo_hierarquia === "Líder de Unidade") {
        const subordinateEmails = allUsers
          .filter(u => u.lider_id === user.id || u.lider_email === user.email)
          .map(u => u.email);
        filtered = filtered.filter(c => c.created_by === user.email || subordinateEmails.includes(c.created_by));
      } else {
        filtered = filtered.filter(c => c.created_by === user.email);
      }
    }
    return filtered;
  }, [allClientes, user, allUsers]);

  const handleSort = (column) => {
    if (sortColumn === column) setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    else { setSortColumn(column); setSortDirection("desc"); }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDirection === "desc" ? <ArrowDown className="w-3 h-3 ml-1 text-emerald-400" /> : <ArrowUp className="w-3 h-3 ml-1 text-emerald-400" />;
  };

  const dadosFiltrados = useMemo(() => {
    const filtered = clientes
      .filter(c => !filtroStatus || c.status === filtroStatus)
      .filter(c => {
        if (!busca) return true;
        const t = busca.toLowerCase();
        return c.nome?.toLowerCase().includes(t) || c.email?.toLowerCase().includes(t) || c.cpf?.toLowerCase().includes(t) || c.telefone?.replace(/\D/g, '').includes(busca.replace(/\D/g, ''));
      });
    if (!sortColumn) return filtered.sort((a, b) => new Date(b.data_conversao_cliente || b.created_date) - new Date(a.data_conversao_cliente || a.created_date));
    return filtered.sort((a, b) => {
      let valA = a[sortColumn] || "", valB = b[sortColumn] || "";
      if (typeof valA === "string") { valA = valA.toLowerCase(); valB = (valB || "").toLowerCase(); }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [clientes, filtroStatus, busca, sortColumn, sortDirection]);

  const contadores = useMemo(() => {
    const counts = { "": clientes.length };
    STATUS_CONFIG.slice(1).forEach(s => { counts[s.value] = clientes.filter(c => c.status === s.value).length; });
    return counts;
  }, [clientes]);

  const getStatusColor = (status) => STATUS_CONFIG.find(s => s.value === status)?.color || "rgb(0,0,0)";

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => await base44.entities.Cliente.update(id, data),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["clientes"] }); setShowForm(false); setEditingCliente(null); }
  });

  const handleSave = async (data) => {
    if (!editingCliente) return;
    if (data.status !== editingCliente.status) {
      data.historico_status = [...(editingCliente.historico_status || []), { de: editingCliente.status, para: data.status, data: format(new Date(), "dd/MM/yyyy HH:mm"), timestamp: Date.now() }];
    }
    await updateMutation.mutateAsync({ id: editingCliente.id, data });
    alert("Cliente atualizado com sucesso!");
  };

  const handleSaveApolice = async (data) => {
    if (!selectedCliente) return;
    await updateMutation.mutateAsync({ id: selectedCliente.id, data });
    alert("Apólice salva com sucesso!");
    setShowApolice(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-white">Painel de Clientes</h1>
              <p className="text-sm text-emerald-300">Clientes convertidos — acompanhamento pós-AB Fechamento</p>
            </div>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2">
            <span className="text-emerald-300 font-bold text-lg">{clientes.length}</span>
            <span className="text-emerald-200 text-sm ml-2">clientes convertidos</span>
          </div>
        </div>

        {/* Status Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 md:p-6 mb-4">
          <div className="dense-touch grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2 mb-3">
            {STATUS_CONFIG.map((status) => (
              <motion.button key={status.value} whileTap={{ scale: 0.95 }}
                onClick={() => setFiltroStatus(status.value)}
                className={`px-1 py-1.5 md:px-3 md:py-3 rounded md:rounded-lg font-bold text-[10px] md:text-xs transition-all ${filtroStatus === status.value ? 'ring-1 md:ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}`}
                style={{ backgroundColor: status.color, color: status.textColor, minHeight: "36px" }}>
                <div className="truncate leading-tight">{status.label}</div>
                <div className="text-sm md:text-lg leading-tight font-black">{contadores[status.value] || 0}</div>
              </motion.button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="🔍 Buscar nome, CPF, email, telefone..." value={busca} onChange={(e) => setBusca(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 md:h-9 text-sm w-full" />
            </div>
            <Button onClick={() => { setBusca(""); setFiltroStatus(""); }} className="bg-red-500/80 hover:bg-red-600 h-11 md:h-9" size="sm">Limpar</Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
          <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
            <Table className="table-auto w-full min-w-[1000px]">
              <TableHeader className="sticky top-0 bg-slate-800/90 backdrop-blur-sm z-10">
                <TableRow className="border-white/10">
                  {[
                    { key: "codigo", label: "Cód" }, { key: "nome", label: "Nome" }, { key: "cpf", label: "CPF" },
                    { key: "telefone", label: "Telefone" }, { key: "email", label: "Email" },
                    { key: "status", label: "Status" }, { key: "data_conversao_cliente", label: "Data Conversão" },
                    { key: "empresa", label: "Empresa" }, { key: "profissao", label: "Profissão" },
                    { key: "renda", label: "Renda" }, { key: "created_by", label: "Corretor" }
                  ].map(col => (
                    <TableHead key={col.key} className="font-bold text-white whitespace-nowrap cursor-pointer select-none hover:bg-white/10" onClick={() => handleSort(col.key)}>
                      <div className="flex items-center">{col.label}{getSortIcon(col.key)}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((cliente) => (
                  <TableRow key={cliente.id}
                    className={`cursor-pointer border-white/5 transition-colors ${selectedCliente?.id === cliente.id ? 'bg-emerald-500/30 ring-1 ring-emerald-400/50' : 'hover:bg-white/10'}`}
                    onClick={() => setSelectedCliente(cliente)}
                    onDoubleClick={() => { setEditingCliente(cliente); setShowForm(true); }}
                    style={{ color: getStatusColor(cliente.status) }}>
                    <TableCell className="font-bold text-white whitespace-nowrap">{cliente.codigo || cliente.id?.slice(-4)}</TableCell>
                    <TableCell className="font-bold text-white whitespace-nowrap">{cliente.nome}</TableCell>
                    <TableCell className="font-bold text-white/80 whitespace-nowrap">{cliente.cpf || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {cliente.telefone ? <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">{cliente.telefone}</a> : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {cliente.email ? <a href={`mailto:${cliente.email}`} className="text-blue-400 hover:underline">{cliente.email}</a> : "—"}
                    </TableCell>
                    <TableCell className="font-bold text-white whitespace-nowrap">{cliente.status}</TableCell>
                    <TableCell className="text-white/70 whitespace-nowrap text-xs">
                      {cliente.data_conversao_cliente ? format(new Date(cliente.data_conversao_cliente), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-white whitespace-nowrap">{cliente.empresa || "—"}</TableCell>
                    <TableCell className="text-white whitespace-nowrap">{cliente.profissao || "—"}</TableCell>
                    <TableCell className="text-white whitespace-nowrap">{cliente.renda || "—"}</TableCell>
                    <TableCell className="text-white/60 text-xs whitespace-nowrap">{cliente.created_by || "—"}</TableCell>
                  </TableRow>
                ))}
                {dadosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={11} className="text-center text-white/50 py-12">Nenhum cliente convertido encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden pb-28 space-y-2">
          {dadosFiltrados.map(cliente => (
            <div key={cliente.id}
              onClick={() => setSelectedCliente(cliente)}
              onDoubleClick={() => { setEditingCliente(cliente); setShowForm(true); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 border transition-all min-h-[52px] ${selectedCliente?.id === cliente.id ? "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/50" : "border-white/10 bg-white/5"}`}>
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(cliente.status) }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-white text-sm truncate">{cliente.nome}</p>
                  <span className="text-xs text-white/30 flex-shrink-0">{cliente.codigo || cliente.id?.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {cliente.telefone && <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`} target="_blank" className="flex items-center gap-1 text-green-400 text-xs" onClick={e => e.stopPropagation()}><Phone className="w-3 h-3" />{cliente.telefone}</a>}
                  {cliente.cpf && <span className="text-white/40 text-xs">{cliente.cpf}</span>}
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0" style={{ backgroundColor: getStatusColor(cliente.status), color: "white" }}>{cliente.status}</span>
            </div>
          ))}
          {dadosFiltrados.length === 0 && <p className="text-center text-white/50 py-12">Nenhum cliente convertido encontrado.</p>}
        </div>

        {/* Action Buttons Desktop */}
        <div className="hidden md:flex gap-3 flex-wrap">
          <Button onClick={() => { if (selectedCliente) { setEditingCliente(selectedCliente); setShowForm(true); }}} disabled={!selectedCliente}
            className="bg-gradient-to-r from-orange-500 to-amber-600 font-bold px-6 py-6"><Edit className="w-5 h-5 mr-2" />Editar</Button>
          <Button onClick={() => setShowDocumentos(true)} disabled={!selectedCliente}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 font-bold px-6 py-6"><FileText className="w-5 h-5 mr-2" />Docs</Button>
          <Button onClick={() => setShowApolice(true)} disabled={!selectedCliente}
            className="bg-gradient-to-r from-pink-500 to-rose-600 font-bold px-6 py-6"><TrendingUp className="w-5 h-5 mr-2" />Apólice</Button>
        </div>

        {/* Mobile Action Bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-emerald-500/30 px-1.5 py-1.5" style={{ background: "linear-gradient(to right, rgba(6,78,59,0.97), rgba(4,47,46,0.97))" }}>
          <div className="dense-touch grid grid-cols-3 gap-1">
            <Button onClick={() => { if (selectedCliente) { setEditingCliente(selectedCliente); setShowForm(true); }}} disabled={!selectedCliente}
              size="sm" className="bg-orange-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md"><Edit className="w-4 h-4" /><span className="mobile-text-xxs">Editar</span></Button>
            <Button onClick={() => setShowDocumentos(true)} disabled={!selectedCliente}
              size="sm" className="bg-purple-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md"><FileText className="w-4 h-4" /><span className="mobile-text-xxs">Docs</span></Button>
            <Button onClick={() => setShowApolice(true)} disabled={!selectedCliente}
              size="sm" className="bg-pink-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md"><TrendingUp className="w-4 h-4" /><span className="mobile-text-xxs">Apólice</span></Button>
          </div>
        </div>
      </div>

      <FormularioLead open={showForm} onClose={() => { setShowForm(false); setEditingCliente(null); }}
        lead={editingCliente} onSave={handleSave} isLoading={updateMutation.isPending} />

      {selectedCliente && (
        <>
          <DocumentosDialog open={showDocumentos} onClose={() => setShowDocumentos(false)} cliente={selectedCliente}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })} />
          <ApoliceDialog open={showApolice} onClose={() => setShowApolice(false)} cliente={selectedCliente}
            onSave={handleSaveApolice} isLoading={updateMutation.isPending} />
        </>
      )}
    </div>
  );
}