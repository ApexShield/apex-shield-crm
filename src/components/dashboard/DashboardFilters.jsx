import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MESES = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const DIAS_SEMANA = [
  { value: "Segunda feira", label: "Segunda" },
  { value: "Terça feira", label: "Terça" },
  { value: "Quarta feira", label: "Quarta" },
  { value: "Quinta feira", label: "Quinta" },
  { value: "Sexta Feira", label: "Sexta" },
];

export default function DashboardFilters({ data, onFilteredData, ano }) {
  const [filterType, setFilterType] = useState("todos");
  const [mes, setMes] = useState("");
  const [semana, setSemana] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);

  const availableWeeks = [...new Set(data.map(d => d.semana))].sort((a, b) => a - b);

  const applyFilter = (type, newMes, newSemana, newDia, newInicio, newFim) => {
    let filtered = [...data];

    if (type === "mes" && newMes) {
      filtered = filtered.filter(d => {
        const m = new Date(d.data + "T12:00:00").getMonth() + 1;
        return m === parseInt(newMes);
      });
    } else if (type === "semana" && newSemana) {
      filtered = filtered.filter(d => d.semana === parseInt(newSemana));
    } else if (type === "dia_semana" && newDia) {
      filtered = filtered.filter(d => d.dia_semana === newDia);
    } else if (type === "periodo" && newInicio && newFim) {
      const inicio = format(newInicio, "yyyy-MM-dd");
      const fim = format(newFim, "yyyy-MM-dd");
      filtered = filtered.filter(d => d.data >= inicio && d.data <= fim);
    } else if (type === "dia_especifico" && newInicio) {
      const dia = format(newInicio, "yyyy-MM-dd");
      filtered = filtered.filter(d => d.data === dia);
    }

    onFilteredData(filtered);
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    setMes(""); setSemana(""); setDiaSemana(""); setDataInicio(null); setDataFim(null);
    if (type === "todos") onFilteredData(data);
  };

  const clearFilters = () => {
    setFilterType("todos");
    setMes(""); setSemana(""); setDiaSemana(""); setDataInicio(null); setDataFim(null);
    onFilteredData(data);
  };

  const activeFilter = filterType !== "todos";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-indigo-600" />
        <span className="font-semibold text-slate-700 text-sm">Filtros</span>
        {activeFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs text-red-500 h-7 gap-1">
            <X className="w-3 h-3" /> Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Filter type buttons */}
        {[
          { key: "todos", label: "Todos" },
          { key: "mes", label: "Mês" },
          { key: "semana", label: "Semana" },
          { key: "dia_semana", label: "Dia da Semana" },
          { key: "dia_especifico", label: "Dia Específico" },
          { key: "periodo", label: "Período" },
        ].map(f => (
          <Button
            key={f.key}
            variant={filterType === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterTypeChange(f.key)}
            className={`text-xs h-8 ${filterType === f.key ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Filter controls */}
      <div className="mt-3 flex flex-wrap gap-2 items-end">
        {filterType === "mes" && (
          <Select value={mes} onValueChange={v => { setMes(v); applyFilter("mes", v, semana, diaSemana, dataInicio, dataFim); }}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {filterType === "semana" && (
          <Select value={semana} onValueChange={v => { setSemana(v); applyFilter("semana", mes, v, diaSemana, dataInicio, dataFim); }}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Selecione a semana" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map(w => <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {filterType === "dia_semana" && (
          <Select value={diaSemana} onValueChange={v => { setDiaSemana(v); applyFilter("dia_semana", mes, semana, v, dataInicio, dataFim); }}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent>
              {DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {filterType === "dia_especifico" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 text-xs gap-2">
                <CalendarIcon className="w-3 h-3" />
                {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={d => { setDataInicio(d); if (d) applyFilter("dia_especifico", mes, semana, diaSemana, d, dataFim); }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        )}

        {filterType === "periodo" && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 text-xs gap-2">
                  <CalendarIcon className="w-3 h-3" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={d => { setDataInicio(d); if (d && dataFim) applyFilter("periodo", mes, semana, diaSemana, d, dataFim); }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-slate-400">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 text-xs gap-2">
                  <CalendarIcon className="w-3 h-3" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={d => { setDataFim(d); if (dataInicio && d) applyFilter("periodo", mes, semana, diaSemana, dataInicio, d); }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </div>
  );
}