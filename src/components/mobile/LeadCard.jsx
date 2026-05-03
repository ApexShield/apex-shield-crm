import { Phone, Calendar, Building2, Mail } from "lucide-react";

export default function LeadCard({ cliente, isSelected, onClick, getStatusColor }) {
  const cor = getStatusColor(cliente.status);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-all no-select ${
        isSelected
          ? "border-indigo-400 bg-indigo-500/20 ring-1 ring-indigo-400/50"
          : "border-white/10 bg-white/5 active:bg-white/10"
      }`}
    >
      {/* Left: status bar */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: cor }}
      />

      {/* Center: info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-white text-[11px] truncate">{cliente.nome}</p>
          <span className="text-[8px] text-white/30 flex-shrink-0">{cliente.codigo || cliente.id?.slice(-4)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {cliente.telefone && (
            <a
              href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-green-400 text-[9px]"
              onClick={e => e.stopPropagation()}
            >
              <Phone className="w-2.5 h-2.5" />
              {cliente.telefone}
            </a>
          )}
          {cliente.data_contato && (
            <div className="flex items-center gap-0.5 text-white/40 text-[9px]">
              <Calendar className="w-2.5 h-2.5" />
              {(() => {
                const p = cliente.data_contato.split("T")[0].split("-");
                return `${p[2]}/${p[1]}`;
              })()}
            </div>
          )}
          {cliente.empresa && (
            <div className="flex items-center gap-0.5 text-white/40 text-[9px] truncate">
              <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{cliente.empresa}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: status badge */}
      <span
        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
        style={{ backgroundColor: cor, color: "white" }}
      >
        {cliente.status}
      </span>
    </div>
  );
}