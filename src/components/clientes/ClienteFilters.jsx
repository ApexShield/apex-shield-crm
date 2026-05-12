import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "AB Fechamento", label: "AB Fechamento" },
  { value: "Análise", label: "Análise" },
  { value: "Venda Feita", label: "Venda Feita" },
  { value: "Entrega de Apólice", label: "Entrega de Apólice" },
  { value: "Encerrado", label: "Encerrado" },
];

const SORT_OPTIONS = [
  { value: "nome", label: "Nome" },
  { value: "data_conversao_cliente", label: "Data Conversão" },
  { value: "created_date", label: "Data Cadastro" },
  { value: "status", label: "Status" },
  { value: "profissao", label: "Profissão" },
  { value: "idade", label: "Idade" },
];

const ORDER_OPTIONS = [
  { value: "desc", label: "Decrescente" },
  { value: "asc", label: "Crescente" },
];

export default function ClienteFilters({
  busca, setBusca,
  filtroStatus, setFiltroStatus,
  dataInicial, setDataInicial,
  dataFinal, setDataFinal,
  sortColumn, setSortColumn,
  sortDirection, setSortDirection,
  onClear
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 md:p-4 mb-4 space-y-3">
      {/* Busca Master */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="🔍 Busca master — pesquise por nome, CPF, email, telefone, profissão, empresa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11 pl-10 text-sm w-full"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[120px]">
          <Label className="text-white/60 text-[10px] uppercase tracking-wider">Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value || "all"}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <Label className="text-white/60 text-[10px] uppercase tracking-wider">Data Inicial</Label>
          <Input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
            className="bg-white/10 border-white/20 text-white h-9 text-xs"
          />
        </div>

        <div className="min-w-[130px]">
          <Label className="text-white/60 text-[10px] uppercase tracking-wider">Data Final</Label>
          <Input
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
            className="bg-white/10 border-white/20 text-white h-9 text-xs"
          />
        </div>

        <div className="min-w-[130px]">
          <Label className="text-white/60 text-[10px] uppercase tracking-wider">Ordenar por</Label>
          <Select value={sortColumn || "data_conversao_cliente"} onValueChange={setSortColumn}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[120px]">
          <Label className="text-white/60 text-[10px] uppercase tracking-wider">Organizar</Label>
          <Select value={sortDirection} onValueChange={setSortDirection}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onClear} size="sm" className="bg-red-500/80 hover:bg-red-600 h-9 text-xs gap-1">
          <X className="w-3 h-3" /> Limpar
        </Button>
      </div>
    </div>
  );
}