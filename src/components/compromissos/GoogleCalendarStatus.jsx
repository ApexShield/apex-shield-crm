import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function GoogleCalendarStatus() {
  const [connecting, setConnecting] = useState(false);

  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("verificarConexaoUsuarioCalendar", {});
      return res.data;
    },
    refetchInterval: 30000,
  });

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await base44.functions.invoke("iniciarOAuthGoogle", {});
      const { authUrl } = res.data;
      if (authUrl) {
        const popup = window.open(authUrl, "_blank", "width=500,height=600");
        const timer = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(timer);
            setConnecting(false);
            // Re-check connection
            window.location.reload();
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Erro ao conectar:", err);
      setConnecting(false);
      alert("Erro ao iniciar conexão com Google. Tente novamente.");
    }
  };

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
    <Button
      onClick={handleConnect}
      disabled={connecting}
      variant="outline"
      size="sm"
      className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs gap-1.5"
    >
      {connecting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {connecting ? "Conectando..." : "Conectar Google Calendar"}
      </span>
      <span className="sm:hidden">
        {connecting ? "..." : "Conectar Google"}
      </span>
    </Button>
  );
}