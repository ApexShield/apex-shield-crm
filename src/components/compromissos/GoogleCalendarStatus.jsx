import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function GoogleCalendarStatus() {
  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("verificarConexaoUsuarioCalendar", {});
      return res.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-indigo-300">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Verificando...</span>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs text-green-300 font-medium hidden sm:inline">
          Google: {connectionStatus.google_email}
        </span>
        <span className="text-xs text-green-300 font-medium sm:hidden">
          Google ✓
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-xs text-amber-300 font-medium hidden sm:inline">
        Google Calendar desconectado
      </span>
      <span className="text-xs text-amber-300 font-medium sm:hidden">
        Google ✗
      </span>
    </div>
  );
}