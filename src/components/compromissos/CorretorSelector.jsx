import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CorretorSelector({ teamMembers, selectedEmail, onSelect, userName }) {
  if (!teamMembers || teamMembers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-indigo-300" />
      <Select value={selectedEmail || "minha"} onValueChange={(v) => onSelect(v === "minha" ? null : v)}>
        <SelectTrigger className="bg-white/10 border-white/20 text-white w-[220px] h-9 text-sm">
          <SelectValue placeholder="Minha agenda" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="minha">📅 Minha agenda</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m.email} value={m.email}>
              {m.full_name || m.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}