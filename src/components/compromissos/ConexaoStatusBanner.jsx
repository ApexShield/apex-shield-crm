import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ConexaoStatusBanner() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["conexao-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("verificarConexaoGmail", {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" /> Verificando conexões...
      </div>
    );
  }

  if (!status) return null;

  const gmailOk = status.gmail;
  const calendarOk = status.calendar;
  const allOk = gmailOk && calendarOk;

  if (allOk) {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-sm text-green-300">
        <CheckCircle2 className="w-4 h-4" /> Gmail e Calendar conectados
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300">
      <AlertCircle className="w-4 h-4" />
      <span>
        {!gmailOk && !calendarOk && "Gmail e Calendar desconectados"}
        {!gmailOk && calendarOk && "Gmail desconectado"}
        {gmailOk && !calendarOk && "Google Calendar desconectado"}
        {" — contate o administrador para reconectar."}
      </span>
    </div>
  );
}