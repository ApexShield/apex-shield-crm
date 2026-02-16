import { Crown, Shield, Users } from "lucide-react";

const corPorTipo = {
  "Líder de Agência": { bg: "from-emerald-400 to-green-600", icon: Crown },
  "Líder de Unidade": { bg: "from-blue-400 to-blue-600", icon: Shield },
  "Corretor": { bg: "from-cyan-400 to-blue-500", icon: Users }
};

export default function OrgUserCard({ usuario, onClick, clickable }) {
  const config = corPorTipo[usuario.tipo_hierarquia] || { bg: "from-slate-400 to-slate-600", icon: Users };
  const Icon = config.icon;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : ''} transition-all duration-200`}
    >
      <div className={`bg-gradient-to-br ${config.bg} rounded-xl p-3 shadow-lg min-w-[140px] max-w-[160px] border-2 border-white/30`}>
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