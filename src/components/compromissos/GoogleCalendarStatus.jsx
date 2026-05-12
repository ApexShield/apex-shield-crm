import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONNECTOR_ID = "6a02b60d6f5e1f53c2e11c6e";

export default function GoogleCalendarStatus() {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const { data: connectionStatus, isLoading, refetch } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("verificarConexaoUsuarioCalendar", {});
        return res.data;
      } catch {
        return { connected: false };
      }
    },
    refetchInterval: 60000,
  });

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          refetch();
          queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
        }
      }, 500);
    } catch (err) {
      console.error("Erro ao conectar:", err);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar sua conta Google Calendar?")) return;
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    } catch (err) {
      console.error("Erro ao desconectar:", err);
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
        <button onClick={handleDisconnect} className="ml-1 text-green-400/60 hover:text-red-400 transition-colors" title="Desconectar">
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      variant="outline"
      size="sm"
      className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 gap-1.5"
    >
      {connecting ? (
        <><Loader2 className="w-3 h-3 animate-spin" /> Conectando...</>
      ) : (
        <><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Conectar Google Calendar</>
      )}
    </Button>
  );
}