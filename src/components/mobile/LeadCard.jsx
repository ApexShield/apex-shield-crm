import { Phone, Calendar, Building2 } from "lucide-react";

export default function LeadCard({ cliente, isSelected, onClick, onDoubleClick, getStatusColor }) {
  const cor = getStatusColor(cliente.status);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 border transition-all min-h-[52px] ${
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
          <p className="font-bold text-white text-sm truncate">{cliente.nome}</p>
          <span className="text-xs text-white/30 flex-shrink-0 mobile-text-xxs">{cliente.codigo || cliente.id?.slice(-4)}</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
          {cliente.telefone && (
            <a
              href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-400 text-xs min-h-[28px]"
              onClick={e => e.stopPropagation()}
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="mobile-text-xxs">{cliente.telefone}</span>
            </a>
          )}
          {cliente.data_contato && (
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Calendar className="w-3 h-3" />
              <span className="mobile-text-xxs">
                {(() => {
                  const p = cliente.data_contato.split("T")[0].split("-");
                  return `${p[2]}/${p[1]}`;
                })()}
              </span>
            </div>
          )}
          {cliente.empresa && (
            <div className="flex items-center gap-1 text-white/40 text-xs truncate">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate mobile-text-xxs">{cliente.empresa}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: status badge */}
      <span
        className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 mobile-text-xxs"
        style={{ backgroundColor: cor, color: "white" }}
      >
        {cliente.status}
      </span>
    </div>
  );
}