import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroDataVisita, setFiltroDataVisita] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showDocumentos, setShowDocumentos] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const allClientes = await base44.entities.Cliente.list("-created_date", 500);
      // Se não for admin, filtrar apenas os leads do usuário
      if (user && user.role !== "admin") {
        return allClientes.filter(c => c.created_by === user.email);
      }
      return allClientes;
    },
    enabled: !!user
  });

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    return clientes
      .filter(c => !filtroStatus || c.status === filtroStatus)
      .filter(c => !busca || c.nome?.toLowerCase().includes(busca.toLowerCase()))
      .filter(c => !filtroDataVisita || c.data_visita === filtroDataVisita)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [clientes, filtroStatus, busca, filtroDataVisita]);

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
      console.log("Criando cliente com dados:", data);
      const result = await base44.entities.Cliente.create(data);
      console.log("Cliente criado:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Create Success!");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setShowForm(false);
      setEditingLead(null);
    },
    onError: (error) => {
      console.error("Erro ao criar:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log("Atualizando cliente:", id, data);
      const result = await base44.entities.Cliente.update(id, data);
      console.log("Cliente atualizado:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Update Success!");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setShowForm(false);
      setEditingLead(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar:", error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setSelectedLead(null);
    }
  });

  const handleSave = async (data) => {
    console.log("Salvando dados:", data);
    
    // Se for novo lead, calcular próximo código
    if (!editingLead) {
      const maxCodigo = clientes.reduce((max, c) => Math.max(max, c.codigo || 0), 0);
      data.codigo = maxCodigo + 1;
      data.status = data.status || "AB Fone";
      data.data_cadastro = data.data_cadastro || new Date().toISOString().split('T')[0];
    }
    
    try {
      if (editingLead) {
        await updateMutation.mutateAsync({ id: editingLead.id, data });
        alert("Cliente atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(data);
        alert("Cliente criado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
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

  return (
    <div className="min-h-screen bg-[#f0f0f5] p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header com Status Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Linha de Botões de Status */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {STATUS_CONFIG.map((status, index) => (
              <motion.button
                key={status.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFiltroStatus(status.value)}
                className={`px-3 py-2 rounded font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  filtroStatus === status.value ? 'ring-2 ring-offset-2 ring-blue-500 underline' : ''
                }`}
                style={{
                  backgroundColor: status.color,
                  color: status.textColor
                }}
              >
                {status.label}
              </motion.button>
            ))}
          </div>

          {/* Linha de Contadores */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {STATUS_CONFIG.map((status) => (
              <div
                key={`count-${status.value}`}
                className="text-center font-bold text-xs px-2 py-1 rounded border flex-shrink-0"
                style={{
                  backgroundColor: status.bgLight,
                  color: status.color === "rgb(135, 206, 250)" || status.color === "rgb(255, 215, 0)" || status.color === "rgb(0, 255, 255)" || status.color === "rgb(200, 162, 200)" ? "#000" : status.color,
                  minWidth: '40px'
                }}
              >
                {contadores[status.value] || 0}
              </div>
            ))}
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-md"
            />
            <Input
              type="date"
              placeholder="Filtrar por data da visita"
              value={filtroDataVisita}
              onChange={(e) => setFiltroDataVisita(e.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={() => { setBusca(""); setFiltroDataVisita(""); }}
              variant="destructive"
              className="bg-[#dc143c] hover:bg-[#b01030]"
            >
              LIMPAR
            </Button>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '500px' }}>
            <Table>
              <TableHeader className="sticky top-0 bg-slate-100 z-10">
                <TableRow>
                  <TableHead className="font-bold whitespace-nowrap">Cód</TableHead>
                  <TableHead className="font-bold whitespace-nowrap min-w-[150px]">Nome</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Data Criação</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Telefone</TableHead>
                  <TableHead className="font-bold whitespace-nowrap min-w-[200px]">E-mail</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Empresa</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Cargo</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Fonte Prospecção</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Renda</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Idade</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Profissão</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Estado Civil</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Filhos</TableHead>
                  <TableHead className="font-bold whitespace-nowrap">Data Visita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((cliente, index) => {
                  const cor = getStatusColor(cliente.status);
                  return (
                    <TableRow
                      key={cliente.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedLead(cliente)}
                      style={{ color: cor }}
                    >
                      <TableCell className="font-bold whitespace-nowrap">{cliente.codigo || cliente.id.slice(-4).toUpperCase()}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{cliente.nome}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{cliente.status}</TableCell>
                      <TableCell className="font-bold">
                        {format(new Date(cliente.created_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-bold">
                        {cliente.telefone ? (
                          <a 
                            href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-green-600"
                          >
                            {cliente.telefone}
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-bold">
                        {cliente.email ? (
                          <a 
                            href={`mailto:${cliente.email}`}
                            className="hover:underline text-blue-600"
                          >
                            {cliente.email}
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-bold">{cliente.empresa || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.cargo || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.fonte_prospeccao || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.renda || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.idade || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.profissao || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.estado_civil || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.filhos || "—"}</TableCell>
                      <TableCell className="font-bold">
                        {cliente.data_visita ? format(new Date(cliente.data_visita), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => { setEditingLead(null); setShowForm(true); }}
            className="bg-[#0078d7] hover:bg-[#006abc] text-white font-bold text-base px-8 py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            CRIAR LEAD
          </Button>
          <Button
            onClick={handleEdit}
            className="bg-[#ff8c00] hover:bg-[#e67e00] text-white font-bold text-base px-8 py-6"
            disabled={!selectedLead}
          >
            <Edit className="w-5 h-5 mr-2" />
            EDITAR
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-[#dc143c] hover:bg-[#b01030] text-white font-bold text-base px-8 py-6"
            disabled={!selectedLead}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            EXCLUIR
          </Button>
          <Button
            onClick={() => setShowDocumentos(true)}
            className="bg-[#8e44ad] hover:bg-[#732d91] text-white font-bold text-base px-8 py-6"
            disabled={!selectedLead}
          >
            <FileText className="w-5 h-5 mr-2" />
            LISTAR DOCUMENTOS
          </Button>

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
        <DocumentosDialog
          open={showDocumentos}
          onClose={() => setShowDocumentos(false)}
          cliente={selectedLead}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })}
        />
      )}
    </div>
  );
}