import { Phone, Shield, ShieldOff } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";

function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  try {
    const date = parseISO(dataNasc);
    if (isNaN(date.getTime())) return null;
    return differenceInYears(new Date(), date);
  } catch { return null; }
}

function getPessoasAsseguradas(cliente) {
  const titularTemSeguro = !!cliente.dados_apolice?.produto;
  const conjugeTemSeguro = cliente.dados_apolice?.funeral_individual_conjuge === "Sim";
  if (titularTemSeguro && conjugeTemSeguro) return { label: "Ambos c/ Seguro", color: "text-emerald-400" };
  if (!titularTemSeguro && !conjugeTemSeguro) return { label: "Ambos s/ Seguro", color: "text-red-400" };
  if (titularTemSeguro && !conjugeTemSeguro) return { label: "Cônjuge s/ Seguro", color: "text-amber-400" };
  return { label: "Titular s/ Seguro", color: "text-orange-400" };
}

const STATUS_COLORS = {
  "AB Fechamento": "rgb(255, 215, 0)",
  "Análise": "rgb(165, 42, 42)",
  "Venda Feita": "rgb(34, 139, 34)",
  "Entrega de Apólice": "rgb(200, 162, 200)",
  "Encerrado": "rgb(105, 105, 105)",
};

export default function ClienteMobileList({ dados, selectedCliente, onSelect, onDoubleClick }) {
  return (
    <div className="md:hidden pb-28 space-y-2">
      {dados.map(cliente => {
        const assegurados = getPessoasAsseguradas(cliente);
        const idade = calcularIdade(cliente.data_nascimento);
        return (
          <div
            key={cliente.id}
            onClick={() => onSelect(cliente)}
            onDoubleClick={() => onDoubleClick(cliente)}
            className={`rounded-lg px-3 py-2.5 border transition-all ${selectedCliente?.id === cliente.id ? "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/50" : "border-white/10 bg-white/5"}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white text-sm truncate flex-1">{cliente.nome}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white ml-2 flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[cliente.status] || "#666" }}>
                {cliente.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
              {cliente.profissao && <span className="text-white/60">{cliente.profissao}</span>}
              {idade && <span className="text-white/50">{idade} anos</span>}
              {cliente.estado_civil && <span className="text-white/50">{cliente.estado_civil}</span>}
              {cliente.filhos && <span className="text-white/50">{cliente.filhos} filho(s)</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
              {cliente.telefone && (
                <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`} target="_blank"
                  className="flex items-center gap-1 text-green-400" onClick={e => e.stopPropagation()}>
                  <Phone className="w-3 h-3" />{cliente.telefone}
                </a>
              )}
              <span className="flex items-center gap-1 text-cyan-300">
                <Shield className="w-3 h-3" />{cliente.dados_apolice?.produto || "Sem produto"}
              </span>
              <span className={`font-bold ${assegurados.color}`}>{assegurados.label}</span>
            </div>
          </div>
        );
      })}
      {dados.length === 0 && <p className="text-center text-white/50 py-12">Nenhum cliente encontrado.</p>}
    </div>
  );
}