import { useState, useMemo, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, FileText, Download, Upload, TrendingUp, BarChart3, Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import usePersistedState from "../hooks/usePersistedState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FormularioLead from "../components/leads/FormularioLead";
import DocumentosDialog from "../components/leads/DocumentosDialog";
import FunilVendas from "../components/leads/FunilVendas";
import ApoliceDialog from "../components/leads/ApoliceDialog";
import Relatorios from "../components/leads/Relatorios";
import ImportExportLeads from "../components/leads/ImportExportLeads";
import LeadCard from "../components/mobile/LeadCard";
import MobileLeadList from "../components/mobile/MobileLeadList";
import PullToRefresh from "../components/mobile/PullToRefresh";

// Configuração dos status com cores do VBA
const STATUS_CONFIG = [
  { value: "", label: "TODOS", color: "rgb(25, 55, 109)", textColor: "white", bgLight: "rgb(200, 215, 235)" },
  { value: "Novo", label: "NOVO", color: "rgb(128, 0, 128)", textColor: "white", bgLight: "rgb(230, 200, 230)" },
  { value: "AB Fone", label: "AB FONE", color: "rgb(255, 105, 180)", textColor: "white", bgLight: "rgb(255, 220, 235)" },
  { value: "AB Visita", label: "AB VISITA", color: "rgb(135, 206, 250)", textColor: "black", bgLight: "rgb(220, 240, 255)" },
  { value: "AB Fechamento", label: "AB FECHAMENTO", color: "rgb(255, 215, 0)", textColor: "black", bgLight: "rgb(255, 250, 205)" },
  { value: "Delay", label: "DELAY", color: "rgb(0, 255, 255)", textColor: "black", bgLight: "rgb(200, 255, 255)" },
  { value: "Análise", label: "ANÁLISE", color: "rgb(165, 42, 42)", textColor: "white", bgLight: "rgb(230, 200, 200)" },
  { value: "Venda Feita", label: "VENDA FEITA", color: "rgb(34, 139, 34)", textColor: "white", bgLight: "rgb(200, 240, 200)" },
  { value: "Entrega de Apólice", label: "ENTREGA APÓLICE", color: "rgb(200, 162, 200)", textColor: "black", bgLight: "rgb(230, 210, 230)" },
  { value: "Encerrado", label: "ENCERRADO", color: "rgb(105, 105, 105)", textColor: "white", bgLight: "rgb(220, 220, 220)" },
];

export default function Leads() {
  // Persisted state survives tab switches in bottom nav
  const [filtroStatus, setFiltroStatus] = usePersistedState("leads_filtroStatus", "");
  const [busca, setBusca] = usePersistedState("leads_busca", "");
  const [filtroDataVisita, setFiltroDataVisita] = usePersistedState("leads_filtroData", "");
  const [usuarioFiltro, setUsuarioFiltro] = usePersistedState("leads_usuarioFiltro", "todos");
  const [sortColumn, setSortColumn] = usePersistedState("leads_sortCol", null);
  const [sortDirection, setSortDirection] = usePersistedState("leads_sortDir", "desc");

  // Transient UI state (no need to persist)
  const [selectedLead, setSelectedLead] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [showApolice, setShowApolice] = useState(false);
  const [showRelatorios, setShowRelatorios] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Listener para abrir apólice do formulário
  useEffect(() => {
    const handleOpenApolice = (e) => {
      setSelectedLead(e.detail);
      setShowApolice(true);
    };
    window.addEventListener('openApolice', handleOpenApolice);
    return () => window.removeEventListener('openApolice', handleOpenApolice);
  }, []);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  const { data: allClientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      return await base44.entities.Cliente.filter({}, "-created_date", 5000);
    },
    enabled: !!user
  });

  // Usuários subordinados - baseado na nova hierarquia
  const usuariosVisiveis = useMemo(() => {
    if (!user || !allUsers.length) return [];
    
    // Admin vê todos
    if (user.role === "admin") {
      return allUsers.filter(u => u.id !== user.id);
    }
    
    // Líder de Agência vê todos da hierarquia
    if (user.tipo_hierarquia === "Líder de Agência") {
      const subordinados = allUsers.filter(u => {
        if (u.id === user.id) return false;
        
        // Líder de Unidade diretamente vinculado
        if (u.lider_id === user.id || u.lider_email === user.email) return true;
        
        // Corretores vinculados aos Líderes de Unidade
        const lideresUnidade = allUsers.filter(lu => 
          lu.tipo_hierarquia === "Líder de Unidade" && 
          (lu.lider_id === user.id || lu.lider_email === user.email)
        );
        const lideresUnidadeIds = lideresUnidade.map(lu => lu.id);
        const lideresUnidadeEmails = lideresUnidade.map(lu => lu.email);
        
        if (lideresUnidadeIds.includes(u.lider_id) || lideresUnidadeEmails.includes(u.lider_email)) {
          return true;
        }
        
        return false;
      });
      
      return subordinados;
    }
    
    // Líder de Unidade vê seus subordinados diretos
    if (user.tipo_hierarquia === "Líder de Unidade") {
      return allUsers.filter(u => {
        if (u.id === user.id) return false;
        return u.lider_email === user.email || u.lider_id === user.id;
      });
    }
    
    return [];
  }, [user, allUsers]);

  // Filtrar leads baseado em permissões e filtro de usuário
  const clientes = useMemo(() => {
    if (!user || !allClientes.length) return [];
    
    let leadsFiltrados = [];
    
    // Admin vê todos os leads
    if (user.role === "admin") {
      leadsFiltrados = allClientes;
    }
    // Líder de Agência vê leads próprios + de todos da hierarquia
    else if (user.tipo_hierarquia === "Líder de Agência") {
      const emailsSubordinados = usuariosVisiveis.map(u => u.email);
      leadsFiltrados = allClientes.filter(c => 
        c.created_by === user.email || emailsSubordinados.includes(c.created_by)
      );
    }
    // Líder de Unidade vê leads próprios + dos subordinados diretos
    else if (user.tipo_hierarquia === "Líder de Unidade") {
      const emailsSubordinados = usuariosVisiveis.map(u => u.email);
      leadsFiltrados = allClientes.filter(c => 
        c.created_by === user.email || emailsSubordinados.includes(c.created_by)
      );
    }
    // Todos os outros usuários (Corretores e usuários sem tipo_hierarquia) veem apenas seus próprios leads
    else {
      leadsFiltrados = allClientes.filter(c => c.created_by === user.email);
    }
    
    // Aplicar filtro de usuário selecionado
    if (usuarioFiltro && usuarioFiltro !== "todos") {
      leadsFiltrados = leadsFiltrados.filter(c => c.created_by === usuarioFiltro);
    }
    
    return leadsFiltrados;
  }, [allClientes, user, usuarioFiltro, usuariosVisiveis]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDirection === "desc" 
      ? <ArrowDown className="w-3 h-3 ml-1 text-indigo-400" /> 
      : <ArrowUp className="w-3 h-3 ml-1 text-indigo-400" />;
  };

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    const filtered = clientes
      .filter(c => !filtroStatus || c.status === filtroStatus)
      .filter(c => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        const termoNum = busca.replace(/\D/g, '');
        return (
          c.nome?.toLowerCase().includes(termo) ||
          c.email?.toLowerCase().includes(termo) ||
          c.empresa?.toLowerCase().includes(termo) ||
          c.cargo?.toLowerCase().includes(termo) ||
          c.profissao?.toLowerCase().includes(termo) ||
          c.fonte_prospeccao?.toLowerCase().includes(termo) ||
          c.codigo?.toLowerCase().includes(termo) ||
          c.status?.toLowerCase().includes(termo) ||
          c.renda?.toLowerCase().includes(termo) ||
          c.endereco?.toLowerCase().includes(termo) ||
          c.cpf?.toLowerCase().includes(termo) ||
          (termoNum && c.telefone?.replace(/\D/g, '').includes(termoNum))
        );
      })
      .filter(c => {
        if (!filtroDataVisita) return true;
        const dataContato = c.data_contato ? c.data_contato.split('T')[0] : null;
        return dataContato === filtroDataVisita;
      });

    if (!sortColumn) {
      return filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return filtered.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";

      if (["data_contato", "agendar_visita", "created_date", "data_cadastro"].includes(sortColumn)) {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [clientes, filtroStatus, busca, filtroDataVisita, sortColumn, sortDirection]);

  // Calcular contadores
  const contadores = useMemo(() => {
    const counts = { "": clientes.length };
    STATUS_CONFIG.slice(1).forEach(status => {
      counts[status.value] = clientes.filter(c => c.status === status.value).length;
    });
    return counts;
  }, [clientes]);

  const getStatusColor = (status) => {
    const config = STATUS_CONFIG.find(s => s.value === status);
    return config ? config.color : "rgb(0, 0, 0)";
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.Cliente.create(data);
      return result;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["clientes"] });
      const previous = queryClient.getQueryData(["clientes"]);
      const optimistic = { ...newData, id: `temp-${Date.now()}`, created_by: user?.email, created_date: new Date().toISOString() };
      queryClient.setQueryData(["clientes"], (old) => [optimistic, ...(old || [])]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["clientes"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setShowForm(false);
      setEditingLead(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await base44.entities.Cliente.update(id, data);
      return result;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["clientes"] });
      const previous = queryClient.getQueryData(["clientes"]);
      queryClient.setQueryData(["clientes"], (old) =>
        (old || []).map(c => c.id === id ? { ...c, ...data } : c)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["clientes"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setShowForm(false);
      setEditingLead(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["clientes"] });
      const previous = queryClient.getQueryData(["clientes"]);
      queryClient.setQueryData(["clientes"], (old) => (old || []).filter(c => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["clientes"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setSelectedLead(null);
    }
  });

  const gerarAlias = (email) => {
    if (!email) return "USER";
    const parts = email.split('@')[0].split(/[._-]/);
    let alias = "";
    parts.forEach(part => {
      if (/\d/.test(part)) {
        alias += part.match(/\d+/)[0];
      } else {
        alias += part.charAt(0).toUpperCase();
      }
    });
    return alias.substring(0, 6);
  };

  const handleSave = async (data) => {
    // Se for novo lead, calcular próximo código com alias
    if (!editingLead) {
      const alias = gerarAlias(user?.email);
      const userLeads = clientes.filter(c => c.created_by === user?.email);
      const nextNum = userLeads.length + 1;
      data.codigo = `${alias}COD${String(nextNum).padStart(2, '0')}`;
      data.status = data.status || "AB Fone";
      data.data_cadastro = data.data_cadastro || new Date().toISOString().split('T')[0];
    } else if (data.status !== editingLead.status) {
      // Rastrear mudança de status com histórico
      const mudanca = {
        de: editingLead.status,
        para: data.status,
        data: format(new Date(), "dd/MM/yyyy HH:mm"),
        timestamp: Date.now()
      };
      data.historico_status = [...(editingLead.historico_status || []), mudanca];
    }
    
    try {
      if (editingLead) {
        await updateMutation.mutateAsync({ id: editingLead.id, data });
        alert("Cliente atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(data);
        alert("Cliente criado com sucesso!");
      }
      setShowForm(false);
      setEditingLead(null);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const nextCodigo = clientes.reduce((max, c) => Math.max(max, c.codigo || 0), 0) + 1;

  const handleEdit = () => {
    if (!selectedLead) return;
    setEditingLead(selectedLead);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (!selectedLead) return;
    if (confirm(`Confirma a exclusão de ${selectedLead.nome}?`)) {
      deleteMutation.mutate(selectedLead.id);
    }
  };

  const handleSaveApolice = async (data) => {
    if (!selectedLead) return;
    try {
      await updateMutation.mutateAsync({ id: selectedLead.id, data });
      alert("Dados da apólice salvos com sucesso!");
      setShowApolice(false);
    } catch (error) {
      alert("Erro ao salvar apólice: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header Moderno */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black text-white">Dashboard de Leads</h1>
                <p className="text-sm text-indigo-300">Gerencie seus clientes e oportunidades</p>
              </div>
            </div>
            {(user?.role === "admin" || user?.tipo_hierarquia === "Líder de Agência" || user?.tipo_hierarquia === "Líder de Unidade") && usuariosVisiveis.length > 0 && (
              <div className="w-[280px]">
                <Select value={usuarioFiltro} onValueChange={setUsuarioFiltro}>
                  <SelectTrigger className="bg-gradient-to-r from-indigo-500 to-purple-600 border-2 border-white/30 text-white font-bold shadow-lg">
                    <SelectValue placeholder="Filtrar por corretor" />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-400/50">
                    <SelectItem value="todos" className="text-white hover:bg-white/20 font-bold">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Todos os corretores
                      </div>
                    </SelectItem>
                    {usuariosVisiveis.map(u => (
                      <SelectItem key={u.id} value={u.email} className="text-white hover:bg-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
                            {u.full_name?.charAt(0) || u.email?.charAt(0)}
                          </div>
                          <span className="font-medium">{u.full_name || u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Status Buttons e Funil */}
        <div className="grid lg:grid-cols-3 gap-4 mb-4 md:mb-6">
          {/* Coluna de Status */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 md:p-6">
            <h3 className="text-white font-bold mb-2 md:mb-4 flex items-center gap-2 text-sm md:text-base">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              Filtrar por Status
            </h3>
            
            {/* Grid de Botões de Status - 44px touch targets on mobile */}
            <div className="dense-touch grid grid-cols-5 md:grid-cols-5 gap-1 md:gap-2 mb-2 md:mb-4">
              {STATUS_CONFIG.map((status) => (
                <motion.button
                  key={status.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFiltroStatus(status.value)}
                  className={`px-1 py-1.5 md:px-3 md:py-3 rounded md:rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                    filtroStatus === status.value ? 'ring-1 md:ring-2 ring-white ring-offset-1 md:ring-offset-2 ring-offset-slate-900' : ''
                  }`}
                  style={{
                    backgroundColor: status.color,
                    color: status.textColor,
                    minHeight: "36px"
                  }}
                >
                  <div className="truncate leading-tight mobile-text-xxs">{status.label}</div>
                  <div className="text-sm md:text-lg leading-tight font-black">{contadores[status.value] || 0}</div>
                </motion.button>
              ))}
            </div>

            {/* Busca e Filtros */}
            <div className="space-y-1.5 md:space-y-0 md:flex md:gap-2 md:flex-wrap">
              {/* Busca - full width on mobile */}
              <div className="flex-1 md:min-w-[300px]">
                <Input
                  placeholder="🔍 Buscar nome, telefone, CPF, empresa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 md:h-9 text-sm md:text-sm w-full"
                />
              </div>
              {/* Data + Limpar + contador em linha */}
              <div className="flex gap-1.5 md:gap-2 items-center">
                <Input
                  type="date"
                  value={filtroDataVisita}
                  onChange={(e) => setFiltroDataVisita(e.target.value)}
                  className="bg-white/10 border-white/20 text-white h-11 md:h-9 text-sm md:text-sm flex-1 md:flex-none md:w-auto min-w-0"
                />
                <Button
                  onClick={() => { setBusca(""); setFiltroDataVisita(""); setFiltroStatus(""); }}
                  className="bg-red-500/80 hover:bg-red-600 h-11 md:h-9 text-sm px-3 md:px-4 flex-shrink-0"
                  size="sm"
                >
                  Limpar
                </Button>
                {(busca || filtroDataVisita || filtroStatus) && (
                  <div className="flex items-center bg-white/10 px-2 md:px-4 py-1.5 md:py-2 rounded-md flex-shrink-0">
                    <span className="text-white font-semibold text-xs md:text-sm">{dadosFiltrados.length} leads</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Funil de Vendas - hidden on mobile */}
          <div className="lg:col-span-1 hidden lg:block">
            <FunilVendas clientes={clientes} />
          </div>
        </div>

        {/* Table (Desktop) */}
        <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
          <div className="overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y" style={{ maxHeight: '500px', WebkitOverflowScrolling: 'touch' }}>
            <Table className="table-auto w-full min-w-[1200px]">
              <TableHeader className="sticky top-0 bg-slate-800/90 backdrop-blur-sm z-10">
                <TableRow className="border-white/10">
                  {[
                    { key: "codigo", label: "Cód" },
                    { key: "nome", label: "Nome" },
                    { key: "data_contato", label: "Data Contato" },
                    { key: "agendar_visita", label: "Data Visita" },
                    { key: "status", label: "Status" },
                    { key: "telefone", label: "Telefone" },
                    { key: "email", label: "E-mail" },
                    { key: "empresa", label: "Empresa" },
                    { key: "cargo", label: "Cargo" },
                    { key: "fonte_prospeccao", label: "Fonte" },
                    { key: "renda", label: "Renda" },
                    { key: "idade", label: "Idade" },
                    { key: "profissao", label: "Profissão" },
                    { key: "created_by", label: "Proprietário" },
                  ].map(col => (
                    <TableHead
                      key={col.key}
                      className="font-bold text-white whitespace-nowrap cursor-pointer select-none hover:bg-white/10 transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center">
                        {col.label}
                        {getSortIcon(col.key)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((cliente) => {
                  const cor = getStatusColor(cliente.status);
                  return (
                    <TableRow
                      key={cliente.id}
                      className={`cursor-pointer border-white/5 transition-colors ${
                        selectedLead?.id === cliente.id 
                          ? 'bg-indigo-500/30 ring-1 ring-indigo-400/50' 
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedLead(cliente)}
                      onDoubleClick={() => {
                        setEditingLead(cliente);
                        setShowForm(true);
                      }}
                      style={{ color: cor }}
                    >
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.codigo || cliente.id.slice(-4).toUpperCase()}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.nome}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">
                        {cliente.data_contato ? (() => {
                          const parts = cliente.data_contato.split('T')[0].split('-');
                          return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        })() : <span className="text-white/50">—</span>}
                      </TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">
                        {cliente.agendar_visita ? (() => {
                          const d = new Date(cliente.agendar_visita);
                          if (isNaN(d.getTime())) return <span className="text-white/50">—</span>;
                          return format(d, "dd/MM/yyyy");
                        })() : <span className="text-white/50">—</span>}
                      </TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.status}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        {cliente.telefone ? (
                          <a 
                            href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-green-400"
                          >
                            {cliente.telefone}
                          </a>
                        ) : <span className="text-white/50">—</span>}
                      </TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        {cliente.email ? (
                          <a 
                            href={`mailto:${cliente.email}`}
                            className="hover:underline text-blue-400"
                          >
                            {cliente.email}
                          </a>
                        ) : <span className="text-white/50">—</span>}
                      </TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.empresa || "—"}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.cargo || "—"}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.fonte_prospeccao || "—"}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.renda || "—"}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.idade || "—"}</TableCell>
                      <TableCell className="font-bold text-white whitespace-nowrap">{cliente.profissao || "—"}</TableCell>
                      <TableCell className="font-bold text-white/70 text-xs whitespace-nowrap" title={cliente.created_by || "—"}>{cliente.created_by || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards - scrollable list with limited render */}
        <div className="md:hidden pb-28">
          <MobileLeadList
            leads={dadosFiltrados}
            selectedId={selectedLead?.id}
            onSelect={setSelectedLead}
            onEdit={(cliente) => {
              setEditingLead(cliente);
              setShowForm(true);
            }}
            getStatusColor={getStatusColor}
          />
        </div>

        {/* Botões de Ação - Desktop */}
        <div className="hidden md:flex gap-3 flex-wrap">
          <Button
            onClick={() => { setEditingLead(null); setShowForm(true); }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 font-bold px-6 py-6 text-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar
          </Button>
          <Button
            onClick={handleEdit}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 font-bold px-6 py-6 text-sm"
            disabled={!selectedLead}
          >
            <Edit className="w-5 h-5 mr-2" />
            Editar
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 font-bold px-6 py-6 text-sm"
            disabled={!selectedLead}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Excluir
          </Button>
          <Button
            onClick={() => setShowDocumentos(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 font-bold px-6 py-6 text-sm"
            disabled={!selectedLead}
          >
            <FileText className="w-5 h-5 mr-2" />
            Docs
          </Button>
          <Button
            onClick={() => setShowRelatorios(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-6 py-6 text-sm"
          >
            <FileText className="w-5 h-5 mr-2" />
            Relatórios
          </Button>
          <Button
            onClick={() => setShowImportExport(true)}
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 font-bold px-6 py-6 text-sm"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </Button>
        </div>

        {/* Mobile Action Bar - fixed above BottomNav, 44px touch targets */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-indigo-500/30 px-1.5 py-1.5" style={{ background: "linear-gradient(to right, rgba(30,27,75,0.97), rgba(49,46,129,0.97))" }}>
          <div className="dense-touch grid grid-cols-6 gap-1">
            <Button
              onClick={() => { setEditingLead(null); setShowForm(true); }}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 font-bold text-xs h-11 px-0 flex flex-col items-center justify-center gap-0.5 rounded-md"
            >
              <Plus className="w-4 h-4" />
              <span className="mobile-text-xxs">Criar</span>
            </Button>
            <Button
              onClick={handleEdit}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 font-bold text-xs h-11 px-0 flex flex-col items-center justify-center gap-0.5 rounded-md"
              disabled={!selectedLead}
            >
              <Edit className="w-4 h-4" />
              <span className="mobile-text-xxs">Editar</span>
            </Button>
            <Button
              onClick={handleDelete}
              size="sm"
              className="bg-red-500 hover:bg-red-600 font-bold text-xs h-11 px-0 flex flex-col items-center justify-center gap-0.5 rounded-md"
              disabled={!selectedLead}
            >
              <Trash2 className="w-4 h-4" />
              <span className="mobile-text-xxs">Excluir</span>
            </Button>
            <Button
              onClick={() => setShowDocumentos(true)}
              size="sm"
              className="bg-purple-500 hover:bg-purple-600 font-bold text-xs h-11 px-0 flex flex-col items-center justify-center gap-0.5 rounded-md"
              disabled={!selectedLead}
            >
              <FileText className="w-4 h-4" />
              <span className="mobile-text-xxs">Docs</span>
            </Button>
            <Button
              onClick={() => setShowRelatorios(true)}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 font-bold text-xs h-11 px-0 flex flex-col items-center justify-center gap-0.5 rounded-md"
            >
              <FileText className="w-4 h-4" />
              <span className="mobile-text-xxs">Relat.</span>
            </Button>
            <Button
              onClick={() => setShowImportExport(true)}
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600 font-bold text-xs h-11 px-0 flex flex-col items-center justify-center gap-0.5 rounded-md"
            >
              <Upload className="w-4 h-4" />
              <span className="mobile-text-xxs">Import</span>
            </Button>
          </div>
        </div>
      </div>

      <FormularioLead
        open={showForm}
        onClose={() => { setShowForm(false); setEditingLead(null); }}
        lead={editingLead}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        nextCodigo={nextCodigo}
      />

      {selectedLead && (
        <>
          <DocumentosDialog
            open={showDocumentos}
            onClose={() => setShowDocumentos(false)}
            cliente={selectedLead}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })}
          />
          <ApoliceDialog
            open={showApolice}
            onClose={() => setShowApolice(false)}
            cliente={selectedLead}
            onSave={handleSaveApolice}
            isLoading={updateMutation.isPending}
          />
        </>
      )}

      <Relatorios
        open={showRelatorios}
        onClose={() => setShowRelatorios(false)}
        clientes={clientes}
      />

      <ImportExportLeads
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
        clientes={clientes}
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })}
      />
    </div>
  );
}