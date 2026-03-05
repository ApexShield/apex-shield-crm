import { getHierarchyConfig } from "../UserHierarchyConfig";

export default function OrgUserCard({ usuario, onClick, clickable }) {
  const config = getHierarchyConfig(usuario.tipo_hierarquia);
  const Icon = config.icon;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : ''} transition-all duration-200`}
    >
      <div className={`bg-gradient-to-br ${config.cardBg} rounded-xl p-3 shadow-lg min-w-[140px] max-w-[160px] border-2 border-white/30`}>
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm mb-1.5 shadow-md">
            {usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || "?"}
          </div>
          <p className="font-bold text-white text-xs mb-0.5 leading-tight truncate w-full">{usuario.full_name || usuario.email?.split("@")[0]}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Icon className="w-3 h-3 text-white/70" />
            <p className="text-[10px] text-white/80 font-medium">{usuario.tipo_hierarquia || "Usuário"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}