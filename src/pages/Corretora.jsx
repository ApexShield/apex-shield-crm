import CorretoraNavbar from "@/components/corretora/CorretoraNavbar";
import CorretoraHero from "@/components/corretora/CorretoraHero";
import CorretoraCoberturas from "@/components/corretora/CorretoraCoberturas";
import CorretoraSolucoes from "@/components/corretora/CorretoraSolucoes";
import CorretoraDepoimento from "@/components/corretora/CorretoraDepoimento";
import CorretoraQuemSou from "@/components/corretora/CorretoraQuemSou";
import CorretoraLeadForm from "@/components/corretora/CorretoraLeadForm";
import { Shield } from "lucide-react";

export default function Corretora() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <CorretoraNavbar />
      <CorretoraHero />
      <CorretoraCoberturas />
      <CorretoraSolucoes />
      <CorretoraDepoimento />
      <CorretoraQuemSou />
      <CorretoraLeadForm />

      {/* Footer */}
      <footer className="bg-[#001535] border-t border-white/10 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#A4CE4E]" />
            <span className="text-sm font-bold text-white/80">APEX SHIELD</span>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Apex Shield Corretora. Todos os direitos reservados.
          </p>
          <p className="text-xs text-white/30">
            Seguro de Vida e Planejamento Sucessório · Parceria MetLife
          </p>
        </div>
      </footer>
    </div>
  );
}