import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Edit, FileText, TrendingUp, Plus, Upload, CalendarSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import usePersistedState from "../hooks/usePersistedState";
import { Button } from "@/components/ui/button";
import { format, parseISO, isAfter, isBefore, startOfDay } from "date-fns";

import ClienteFilters from "../components/clientes/ClienteFilters";
import ClienteListView from "../components/clientes/ClienteListView";
import ClienteMobileList from "../components/clientes/ClienteMobileList";
import CriarClienteDialog from "../components/clientes/CriarClienteDialog";
import FormularioLead from "../components/leads/FormularioLead";
import DocumentosDialog from "../components/leads/DocumentosDialog";
import ApoliceDialog from "../components/leads/ApoliceDialog";
import FluxoPipeline from "../components/FluxoPipeline";
import ImportExportLeads from "../components/leads/ImportExportLeads";

export default function ClientesConvertidos() {
  const [busca, setBusca] = usePersistedState("clientes_busca", "");
  const [filtroStatus, setFiltroStatus] = usePersistedState("clientes_filtroStatus", "all");
  const [dataInicial, setDataInicial] = usePersistedState("clientes_dataInicial", "");
  const [dataFinal, setDataFinal] = usePersistedState("clientes_dataFinal", "");
  const [sortColumn, setSortColumn] = usePersistedState("clientes_sortCol", "data_conversao_cliente");
  const [sortDirection, setSortDirection] = usePersistedState("clientes_sortDir", "desc");

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [showApolice, setShowApolice] = useState(false);
  const [showCriarCliente, setShowCriarCliente] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [preenchendoDatas, setPreenchendoDatas] = useState(false);

  // Listener para abrir apólice do formulário (idêntico ao Leads)
  useEffect(() => {
    const handleOpenApolice = (e) => {
      setSelectedCliente(e.detail);
      setShowApolice(true);
    };
    window.addEventListener('openApolice', handleOpenApolice);
    return () => window.removeEventListener('openApolice', handleOpenApolice);
  }, []);

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
        const subordinateEmails = allUsers.filter(u => u.lider_id === user.id || u.lider_email === user.email).map(u => u.email);
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

  const dadosFiltrados = useMemo(() => {
    let filtered = clientes;

    // Status filter
    if (filtroStatus && filtroStatus !== "all") {
      filtered = filtered.filter(c => c.status === filtroStatus);
    }

    // Date range filter
    if (dataInicial) {
      const start = startOfDay(parseISO(dataInicial));
      filtered = filtered.filter(c => {
        const d = c.data_conversao_cliente || c.created_date;
        return d && !isBefore(startOfDay(new Date(d)), start);
      });
    }
    if (dataFinal) {
      const end = startOfDay(parseISO(dataFinal));
      filtered = filtered.filter(c => {
        const d = c.data_conversao_cliente || c.created_date;
        return d && !isAfter(startOfDay(new Date(d)), end);
      });
    }

    // Master search
    if (busca) {
      const t = busca.toLowerCase().trim();
      filtered = filtered.filter(c => {
        const fields = [
          c.nome, c.cpf, c.email, c.telefone, c.profissao, c.empresa,
          c.cargo, c.estado_civil, c.endereco, c.fonte_prospeccao,
          c.dados_apolice?.produto, c.codigo
        ];
        return fields.some(f => f && String(f).toLowerCase().includes(t))
          || c.telefone?.replace(/\D/g, "").includes(busca.replace(/\D/g, ""));
      });
    }

    // Sort
    const col = sortColumn || "data_conversao_cliente";
    return [...filtered].sort((a, b) => {
      let valA, valB;
      if (col === "idade") {
        valA = a.data_nascimento || ""; valB = b.data_nascimento || "";
      } else if (col === "produto") {
        valA = a.dados_apolice?.produto || ""; valB = b.dados_apolice?.produto || "";
      } else {
        valA = a[col] || ""; valB = b[col] || "";
      }
      if (typeof valA === "string") { valA = valA.toLowerCase(); valB = (valB || "").toLowerCase(); }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [clientes, filtroStatus, dataInicial, dataFinal, busca, sortColumn, sortDirection]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => await base44.entities.Cliente.update(id, data),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["clientes"] }); setShowForm(false); setEditingCliente(null); }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Cliente.create(data),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["clientes"] }); setShowCriarCliente(false); }
  });

  // Statuses que pertencem ao funil de leads (pré-venda)
  const STATUSES_LEAD = ["Novo", "AB Fone", "AB Visita", "Delay"];

  const handleSave = async (data) => {
    if (!editingCliente) return;
    if (data.status !== editingCliente.status) {
      data.historico_status = [...(editingCliente.historico_status || []), { de: editingCliente.status, para: data.status, data: format(new Date(), "dd/MM/yyyy HH:mm"), timestamp: Date.now() }];
      // Se o status voltou para um status de lead, desconverter o cliente
      if (STATUSES_LEAD.includes(data.status)) {
        data.is_cliente = false;
      }
    }
    await updateMutation.mutateAsync({ id: editingCliente.id, data });
  };

  const handleSaveApolice = async (data) => {
    if (!selectedCliente) return;
    await updateMutation.mutateAsync({ id: selectedCliente.id, data });
    alert("Dados da apólice salvos com sucesso!");
    setShowApolice(false);
  };

  const handlePreencherDatas = async () => {
    const semData = clientes.filter(c => !c.dados_apolice?.data_implantacao && c.documentos?.length > 0);
    if (semData.length === 0) {
      toast.info("Todos os clientes com documentos já possuem data de implantação.");
      return;
    }
    if (!confirm(`Será feita a leitura dos documentos de ${semData.length} cliente(s) para extrair a data de implantação. Isso pode levar alguns minutos. Continuar?`)) return;
    
    setPreenchendoDatas(true);
    toast.info(`Processando ${semData.length} cliente(s)... Aguarde.`);
    try {
      const response = await base44.functions.invoke('preencherDataImplantacao', {});
      const r = response.data;
      toast.success(`Concluído! ${r.sucesso} preenchida(s), ${r.erro} erro(s), ${r.sem_documentos} sem docs.`);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    } catch (err) {
      toast.error("Erro ao processar: " + err.message);
    } finally {
      setPreenchendoDatas(false);
    }
  };

  const handleClearFilters = () => {
    setBusca(""); setFiltroStatus("all"); setDataInicial(""); setDataFinal("");
    setSortColumn("data_conversao_cliente"); setSortDirection("desc");
  };

  const handleDoubleClick = (cliente) => { setEditingCliente(cliente); setShowForm(true); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-white">Painel de Clientes</h1>
              <p className="text-sm text-emerald-300">Clientes cadastrados — {dadosFiltrados.length} de {clientes.length}</p>
            </div>
          </div>
          <Button onClick={() => setShowCriarCliente(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 font-bold px-5 py-5 text-sm shadow-lg shadow-emerald-500/20">
            <Plus className="w-5 h-5 mr-2" /> Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <ClienteFilters
          busca={busca} setBusca={setBusca}
          filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
          dataInicial={dataInicial} setDataInicial={setDataInicial}
          dataFinal={dataFinal} setDataFinal={setDataFinal}
          sortColumn={sortColumn} setSortColumn={setSortColumn}
          sortDirection={sortDirection} setSortDirection={setSortDirection}
          onClear={handleClearFilters}
        />

        {/* Fluxo Pipeline */}
        <FluxoPipeline tipo="cliente" activeStatus={selectedCliente?.status} />

        {/* Desktop Table */}
        <ClienteListView
          dados={dadosFiltrados}
          selectedCliente={selectedCliente}
          onSelect={setSelectedCliente}
          onDoubleClick={handleDoubleClick}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Mobile */}
        <ClienteMobileList
          dados={dadosFiltrados}
          selectedCliente={selectedCliente}
          onSelect={setSelectedCliente}
          onDoubleClick={handleDoubleClick}
        />

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex gap-3 flex-wrap">
          <Button onClick={() => { if (selectedCliente) handleDoubleClick(selectedCliente); }} disabled={!selectedCliente}
            className="bg-gradient-to-r from-orange-500 to-amber-600 font-bold px-6 py-6">
            <Edit className="w-5 h-5 mr-2" />Editar
          </Button>
          <Button onClick={() => setShowDocumentos(true)} disabled={!selectedCliente}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 font-bold px-6 py-6">
            <FileText className="w-5 h-5 mr-2" />Docs
          </Button>
          <Button onClick={() => setShowApolice(true)} disabled={!selectedCliente}
            className="bg-gradient-to-r from-pink-500 to-rose-600 font-bold px-6 py-6">
            <TrendingUp className="w-5 h-5 mr-2" />Apólice
          </Button>
          <Button onClick={() => setShowImportExport(true)}
            className="bg-gradient-to-r from-indigo-500 to-blue-600 font-bold px-6 py-6">
            <Upload className="w-5 h-5 mr-2" />Import/Export
          </Button>
          <Button onClick={handlePreencherDatas} disabled={preenchendoDatas}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 font-bold px-6 py-6">
            {preenchendoDatas ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CalendarSearch className="w-5 h-5 mr-2" />}
            {preenchendoDatas ? "Processando..." : "Preencher Datas Implantação"}
          </Button>
        </div>

        {/* Mobile Action Bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-emerald-500/30 px-1.5 py-1.5" style={{ background: "linear-gradient(to right, rgba(6,78,59,0.97), rgba(4,47,46,0.97))" }}>
          <div className="dense-touch grid grid-cols-4 gap-1">
            <Button onClick={() => { if (selectedCliente) handleDoubleClick(selectedCliente); }} disabled={!selectedCliente}
              size="sm" className="bg-orange-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md">
              <Edit className="w-4 h-4" /><span className="mobile-text-xxs">Editar</span>
            </Button>
            <Button onClick={() => setShowDocumentos(true)} disabled={!selectedCliente}
              size="sm" className="bg-purple-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md">
              <FileText className="w-4 h-4" /><span className="mobile-text-xxs">Docs</span>
            </Button>
            <Button onClick={() => setShowApolice(true)} disabled={!selectedCliente}
              size="sm" className="bg-pink-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md">
              <TrendingUp className="w-4 h-4" /><span className="mobile-text-xxs">Apólice</span>
            </Button>
            <Button onClick={() => setShowImportExport(true)}
              size="sm" className="bg-indigo-500 font-bold text-xs h-11 flex flex-col items-center justify-center gap-0.5 rounded-md">
              <Upload className="w-4 h-4" /><span className="mobile-text-xxs">Import</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <FormularioLead open={showForm} onClose={() => { setShowForm(false); setEditingCliente(null); }}
        lead={editingCliente} onSave={handleSave} isLoading={updateMutation.isPending} />

      <CriarClienteDialog
        open={showCriarCliente}
        onClose={() => setShowCriarCliente(false)}
        onCreate={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <ImportExportLeads
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
        clientes={clientes}
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })}
        mode="cliente"
      />

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