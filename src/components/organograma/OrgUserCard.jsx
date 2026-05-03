import { getHierarchyConfig } from "../UserHierarchyConfig";

export default function OrgUserCard({ usuario, onClick, clickable }) {
  const config = getHierarchyConfig(usuario.tipo_hierarquia);
  const Icon = config.icon;
  const initial = usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || "?";
  const displayName = usuario.full_name || usuario.email?.split("@")[0] || "?";

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`${clickable ? 'cursor-pointer active:scale-95 md:hover:scale-105' : ''} transition-all duration-150`}
    >
      {/* Mobile: ultra-compact pill */}
      <div className={`md:hidden bg-gradient-to-br ${config.cardBg} rounded-lg p-1.5 shadow-md w-[72px] border border-white/20`}>
        <div className="flex flex-col items-center text-center gap-0.5">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-[8px]">
            {initial}
          </div>
          <p className="font-semibold text-white text-[7px] leading-tight truncate w-full">{displayName.split(" ")[0]}</p>
          <div className="flex items-center gap-px">
            <Icon className="w-2 h-2 text-white/60" />
            <p className="text-[6px] text-white/70 font-medium truncate">
              {usuario.tipo_hierarquia === "Líder de Agência" ? "Ag." : 
               usuario.tipo_hierarquia === "Líder de Unidade" ? "Un." : 
               usuario.tipo_hierarquia === "Corretor" ? "Cor." : "User"}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop: full card */}
      <div className={`hidden md:block bg-gradient-to-br ${config.cardBg} rounded-xl p-3 shadow-lg min-w-[140px] max-w-[160px] border-2 border-white/30`}>
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm mb-1.5 shadow-md">
            {initial}
          </div>
          <p className="font-bold text-white text-xs mb-0.5 leading-tight truncate w-full">{displayName}</p>
          <p className="text-[10px] text-white/60 truncate w-full">{usuario.email}</p>
          <div className="flex items-center gap-0.5 mt-0.5">
            <Icon className="w-3 h-3 text-white/70" />
            <p className="text-[10px] text-white/80 font-medium">{usuario.tipo_hierarquia || "Usuário"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}