import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User } from "lucide-react";

export default function DashboardMemberFilter({ membros, selectedMember, onSelect, label }) {
  const membrosList = Object.values(membros || {});

  if (membrosList.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-indigo-500" />
      <Select value={selectedMember} onValueChange={onSelect}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder={label || "Filtrar por membro"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__todos__">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>Todos (Equipe Completa)</span>
            </div>
          </SelectItem>
          {membrosList.map(m => (
            <SelectItem key={m.email} value={m.email}>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>{m.nome}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}