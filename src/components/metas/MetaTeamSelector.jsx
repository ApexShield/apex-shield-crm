import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Building2 } from "lucide-react";

export default function MetaTeamSelector({ teamData, selectedView, onSelectView }) {
  const options = useMemo(() => {
    if (!teamData) return [];
    const opts = [];

    if (teamData.tipo === "LiderAgencia") {
      opts.push({ value: "__meu__", label: "Minhas Metas", icon: "user" });
      opts.push({ value: "__todos__", label: "Toda a Agência", icon: "building" });
      
      const unidades = Object.values(teamData.unidades || {});
      for (const u of unidades) {
        if (u.id !== "direct_brokers") {
          opts.push({ value: `__unidade__${u.id}`, label: `Equipe: ${u.nome}`, icon: "users" });
        }
        const membros = Object.values(u.membros || {});
        for (const m of membros) {
          opts.push({ value: m.email, label: m.nome, icon: "user", sub: u.nome });
        }
      }
    } else if (teamData.tipo === "LiderUnidade") {
      opts.push({ value: "__meu__", label: "Minhas Metas", icon: "user" });
      opts.push({ value: "__todos__", label: "Toda a Equipe", icon: "users" });
      
      const membros = Object.values(teamData.membros || {});
      for (const m of membros) {
        opts.push({ value: m.email, label: m.nome, icon: "user" });
      }
    }

    return opts;
  }, [teamData]);

  if (!teamData || teamData.tipo === "Corretor") return null;

  const IconMap = { user: User, users: Users, building: Building2 };

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-cyan-400" />
      <Select value={selectedView} onValueChange={onSelectView}>
        <SelectTrigger className="w-[280px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Selecionar visualização" />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => {
            const Icon = IconMap[opt.icon] || User;
            return (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{opt.label}</span>
                  {opt.sub && <span className="text-[10px] text-slate-400 ml-1">({opt.sub})</span>}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}