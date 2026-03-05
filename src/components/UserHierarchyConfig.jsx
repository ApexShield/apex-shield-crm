import { Crown, Shield, UserCircle } from "lucide-react";

// Configuração visual centralizada por tipo de hierarquia
const hierarquiaConfig = {
  "Líder de Agência": {
    icon: Crown,
    // Organograma (fundo escuro)
    cardBg: "from-red-500 to-red-700",
    // Avatar gradient
    avatarBg: "from-red-500 to-red-700",
    // Badges/labels (fundo claro)
    badgeBg: "bg-red-100 text-red-700",
    // Textos
    label: "Líder de Agência",
    // Legenda organograma
    legendBg: "bg-red-500/20 border-red-400/30",
    legendIcon: "text-red-400",
    legendText: "text-red-200",
  },
  "Líder de Unidade": {
    icon: Shield,
    cardBg: "from-emerald-500 to-green-700",
    avatarBg: "from-emerald-500 to-green-700",
    badgeBg: "bg-emerald-100 text-emerald-700",
    label: "Líder de Unidade",
    legendBg: "bg-emerald-500/20 border-emerald-400/30",
    legendIcon: "text-emerald-400",
    legendText: "text-emerald-200",
  },
  "Corretor": {
    icon: UserCircle,
    cardBg: "from-sky-400 to-cyan-500",
    avatarBg: "from-sky-400 to-cyan-500",
    badgeBg: "bg-sky-100 text-sky-700",
    label: "Corretor",
    legendBg: "bg-sky-500/20 border-sky-400/30",
    legendIcon: "text-sky-400",
    legendText: "text-sky-200",
  },
};

const defaultConfig = {
  icon: UserCircle,
  cardBg: "from-slate-400 to-slate-600",
  avatarBg: "from-slate-400 to-slate-600",
  badgeBg: "bg-slate-100 text-slate-700",
  label: "Usuário",
  legendBg: "bg-slate-500/20 border-slate-400/30",
  legendIcon: "text-slate-400",
  legendText: "text-slate-200",
};

export function getHierarchyConfig(tipoHierarquia) {
  return hierarquiaConfig[tipoHierarquia] || defaultConfig;
}

export function HierarchyIcon({ tipoHierarquia, className = "w-4 h-4" }) {
  const config = getHierarchyConfig(tipoHierarquia);
  const Icon = config.icon;
  return <Icon className={className} />;
}

export function UserAvatar({ tipoHierarquia, name, email, size = "w-10 h-10", textSize = "text-sm" }) {
  const config = getHierarchyConfig(tipoHierarquia);
  const initial = name?.charAt(0) || email?.charAt(0) || "?";
  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${config.avatarBg} flex items-center justify-center text-white font-bold ${textSize} shadow-md`}>
      {initial}
    </div>
  );
}

export { hierarquiaConfig, defaultConfig };