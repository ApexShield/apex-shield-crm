import { Phone, Mail, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function LeadCard({ cliente, isSelected, onClick, getStatusColor }) {
  const cor = getStatusColor(cliente.status);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-3.5 border transition-all no-select ${
        isSelected
          ? "border-indigo-400 bg-indigo-500/20 ring-1 ring-indigo-400/50"
          : "border-white/10 bg-white/5 active:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm truncate">{cliente.nome}</p>
          <p className="text-[10px] text-white/50">{cliente.codigo || cliente.id?.slice(-4)}</p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: cor, color: "white" }}
        >
          {cliente.status}
        </span>
      </div>

      <div className="space-y-1">
        {cliente.telefone && (
          <a
            href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-green-400 text-xs"
            onClick={e => e.stopPropagation()}
          >
            <Phone className="w-3 h-3" />
            {cliente.telefone}
          </a>
        )}
        {cliente.email && (
          <div className="flex items-center gap-1.5 text-blue-400 text-xs truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
        {cliente.empresa && (
          <div className="flex items-center gap-1.5 text-white/60 text-xs truncate">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{cliente.empresa}</span>
          </div>
        )}
        {cliente.data_contato && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {(() => {
              const p = cliente.data_contato.split("T")[0].split("-");
              return `${p[2]}/${p[1]}/${p[0]}`;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}