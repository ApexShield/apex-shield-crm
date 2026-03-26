import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DashboardExport({ data, ano }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const response = await base44.functions.invoke("exportDashboard", { ano }, { responseType: "arraybuffer" });
    
    const blob = new Blob([response.data], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_dashboard_${ano}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2" disabled={exporting}>
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? "Exportando..." : "Exportar Relatório"}
    </Button>
  );
}