import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Phone, Shield, ShieldOff, Users } from "lucide-react";
import { format, differenceInYears, parseISO } from "date-fns";

function calcularIdade(dataNasc) {
  if (!dataNasc) return "—";
  try {
    const date = typeof dataNasc === "string" ? parseISO(dataNasc) : new Date(dataNasc);
    if (isNaN(date.getTime())) return "—";
    return differenceInYears(new Date(), date);
  } catch { return "—"; }
}

function getProduto(cliente) {
  return cliente.dados_apolice?.produto || "—";
}

function getPessoasAsseguradas(cliente) {
  const titularTemSeguro = !!cliente.dados_apolice?.produto;
  const conjugeTemSeguro = cliente.dados_apolice?.funeral_individual_conjuge === "Sim";

  if (titularTemSeguro && conjugeTemSeguro) return { label: "Ambos com Seguro", color: "text-emerald-400" };
  if (!titularTemSeguro && !conjugeTemSeguro) return { label: "Ambos sem Seguro", color: "text-red-400" };
  if (titularTemSeguro && !conjugeTemSeguro) return { label: "Cônjuge sem Seguro", color: "text-amber-400" };
  return { label: "Titular sem Seguro", color: "text-orange-400" };
}

const STATUS_COLORS = {
  "AB Fechamento": "rgb(255, 215, 0)",
  "Análise": "rgb(165, 42, 42)",
  "Venda Feita": "rgb(34, 139, 34)",
  "Entrega de Apólice": "rgb(200, 162, 200)",
  "Encerrado": "rgb(105, 105, 105)",
};

export default function ClienteListView({
  dados, selectedCliente, onSelect, onDoubleClick,
  sortColumn, sortDirection, onSort
}) {
  const getSortIcon = (column) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDirection === "desc"
      ? <ArrowDown className="w-3 h-3 ml-1 text-emerald-400" />
      : <ArrowUp className="w-3 h-3 ml-1 text-emerald-400" />;
  };

  const columns = [
    { key: "nome", label: "Nome" },
    { key: "profissao", label: "Profissão" },
    { key: "data_nascimento", label: "Dt. Nascimento" },
    { key: "idade", label: "Idade" },
    { key: "telefone", label: "Telefone" },
    { key: "estado_civil", label: "Estado Civil" },
    { key: "filhos", label: "Filhos" },
    { key: "produto", label: "Produtos" },
    { key: "pessoas_asseguradas", label: "Pessoas Asseguradas" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-4">
      <div className="overflow-x-auto" style={{ maxHeight: "60vh" }}>
        <Table className="table-auto w-full min-w-[1200px]">
          <TableHeader className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
            <TableRow className="border-white/10">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="font-bold text-white whitespace-nowrap cursor-pointer select-none hover:bg-white/10 text-xs"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center">{col.label}{getSortIcon(col.key)}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.map((cliente) => {
              const assegurados = getPessoasAsseguradas(cliente);
              return (
                <TableRow
                  key={cliente.id}
                  className={`cursor-pointer border-white/5 transition-colors ${selectedCliente?.id === cliente.id ? "bg-emerald-500/30 ring-1 ring-emerald-400/50" : "hover:bg-white/10"}`}
                  onClick={() => onSelect(cliente)}
                  onDoubleClick={() => onDoubleClick(cliente)}
                >
                  <TableCell className="font-bold text-white whitespace-nowrap text-sm">{cliente.nome || "—"}</TableCell>
                  <TableCell className="text-white/80 whitespace-nowrap text-xs">{cliente.profissao || "—"}</TableCell>
                  <TableCell className="text-white/70 whitespace-nowrap text-xs">
                    {cliente.data_nascimento ? format(parseISO(cliente.data_nascimento), "dd/MM/yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-white/80 whitespace-nowrap text-xs font-bold">
                    {calcularIdade(cliente.data_nascimento)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {cliente.telefone ? (
                      <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="text-green-400 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />{cliente.telefone}
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-white/80 whitespace-nowrap text-xs">{cliente.estado_civil || "—"}</TableCell>
                  <TableCell className="text-white/80 whitespace-nowrap text-xs text-center">{cliente.filhos || "0"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Shield className="w-3 h-3" />{getProduto(cliente)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <span className={`font-bold ${assegurados.color}`}>{assegurados.label}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <span className="font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLORS[cliente.status] || "#666" }}>
                      {cliente.status || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {dados.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-white/50 py-12">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}