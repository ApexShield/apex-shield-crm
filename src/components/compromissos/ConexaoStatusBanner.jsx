import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle2, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConexaoStatusBanner() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["conexao-calendar-usuario"],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("verificarConexaoCalendar", {});
        return res.data;
      } catch (e) {
        console.warn("Erro ao verificar conexão:", e);
        return null;
      }
    },
    staleTime: 30 * 1000,
    retry: 1
  });

  // Listen for Google auth completion message
  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'google_auth_complete') {
        refetch();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const handleConectar = async () => {
    try {
      const res = await base44.functions.invoke("iniciarOAuthGoogle", {});
      if (res.data?.authUrl) {
        window.open(res.data.authUrl, '_blank', 'width=500,height=700');
      }
    } catch (e) {
      alert("Erro ao iniciar conexão: " + e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" /> Verificando conexão...
      </div>
    );
  }

  if (!status) return null;

  if (status.connected) {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-sm text-green-300">
        <CheckCircle2 className="w-4 h-4" /> Google Calendar conectado: <strong>{status.google_email}</strong>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm text-yellow-300">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>Google Calendar não conectado — conecte sua conta para sincronizar compromissos</span>
      </div>
      <Button onClick={handleConectar} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
        <Link2 className="w-3 h-3 mr-1" /> Conectar Google
      </Button>
    </div>
  );
}