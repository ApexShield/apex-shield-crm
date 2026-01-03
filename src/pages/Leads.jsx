import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [selectedLead, setSelectedLead] = useState(null);

  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list("-created_date", 500)
  });

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    return clientes
      .filter(c => !filtroStatus || c.status === filtroStatus)
      .filter(c => !busca || c.nome?.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [clientes, filtroStatus, busca]);

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

  return (
    <div className="min-h-screen bg-[#f0f0f5] p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header com Status Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Linha de Botões de Status */}
          <div className="flex flex-wrap gap-2 mb-3">
            {STATUS_CONFIG.map((status, index) => (
              <motion.button
                key={status.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFiltroStatus(status.value)}
                className={`px-4 py-2 rounded font-bold text-sm transition-all ${
                  filtroStatus === status.value ? 'ring-2 ring-offset-2 ring-blue-500 text-base underline' : ''
                }`}
                style={{
                  backgroundColor: status.color,
                  color: status.textColor,
                  minWidth: index === 0 || index === STATUS_CONFIG.length - 1 ? '95px' : '110px'
                }}
              >
                {status.label}
              </motion.button>
            ))}
          </div>

          {/* Linha de Contadores */}
          <div className="flex flex-wrap gap-2 mb-4">
            {STATUS_CONFIG.map((status) => (
              <div
                key={`count-${status.value}`}
                className="text-center font-bold text-sm px-2 py-1 rounded border"
                style={{
                  backgroundColor: status.bgLight,
                  color: status.color === "rgb(135, 206, 250)" || status.color === "rgb(255, 215, 0)" || status.color === "rgb(0, 255, 255)" || status.color === "rgb(200, 162, 200)" ? "#000" : status.color,
                  minWidth: '47px'
                }}
              >
                {contadores[status.value] || 0}
              </div>
            ))}
          </div>

          {/* Barra de Busca */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-md"
            />
            <Button
              onClick={() => setBusca("")}
              variant="destructive"
              className="bg-[#dc143c] hover:bg-[#b01030]"
            >
              LIMPAR
            </Button>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
            <Table>
              <TableHeader className="sticky top-0 bg-slate-100 z-10">
                <TableRow>
                  <TableHead className="w-[60px] font-bold">Cód</TableHead>
                  <TableHead className="w-[150px] font-bold">Nome</TableHead>
                  <TableHead className="w-[120px] font-bold">Status</TableHead>
                  <TableHead className="w-[110px] font-bold">Data Criação</TableHead>
                  <TableHead className="w-[130px] font-bold">Telefone</TableHead>
                  <TableHead className="w-[200px] font-bold">E-mail</TableHead>
                  <TableHead className="w-[120px] font-bold">Empresa</TableHead>
                  <TableHead className="w-[120px] font-bold">Cargo</TableHead>
                  <TableHead className="w-[140px] font-bold">Fonte Prospecção</TableHead>
                  <TableHead className="w-[100px] font-bold">Renda</TableHead>
                  <TableHead className="w-[70px] font-bold">Idade</TableHead>
                  <TableHead className="w-[120px] font-bold">Profissão</TableHead>
                  <TableHead className="w-[110px] font-bold">Estado Civil</TableHead>
                  <TableHead className="w-[70px] font-bold">Filhos</TableHead>
                  <TableHead className="w-[110px] font-bold">Data Visita</TableHead>
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
                      <TableCell className="font-bold">{cliente.id.slice(-4).toUpperCase()}</TableCell>
                      <TableCell className="font-bold">{cliente.nome}</TableCell>
                      <TableCell className="font-bold">{cliente.status}</TableCell>
                      <TableCell className="font-bold">
                        {format(new Date(cliente.created_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-bold">{cliente.telefone || "—"}</TableCell>
                      <TableCell className="font-bold">{cliente.email || "—"}</TableCell>
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
            className="bg-[#0078d7] hover:bg-[#006abc] text-white font-bold text-base px-8 py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            CRIAR LEAD
          </Button>
          <Button
            className="bg-[#ff8c00] hover:bg-[#e67e00] text-white font-bold text-base px-8 py-6"
            disabled={!selectedLead}
          >
            <Edit className="w-5 h-5 mr-2" />
            EDITAR
          </Button>
          <Button
            className="bg-[#dc143c] hover:bg-[#b01030] text-white font-bold text-base px-8 py-6"
            disabled={!selectedLead}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            EXCLUIR
          </Button>
          <Button
            className="bg-[#8e44ad] hover:bg-[#732d91] text-white font-bold text-base px-8 py-6"
            disabled={!selectedLead}
          >
            <FileText className="w-5 h-5 mr-2" />
            ABRIR ADN
          </Button>
        </div>
      </div>
    </div>
  );
}