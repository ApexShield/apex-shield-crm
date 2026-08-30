import { useState } from "react";
import { Shield, Menu, X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5562991866728?text=Ol%C3%A1%2C%20Gustavo!%20Vim%20pelo%20site%20da%20Apex%20Shield%20e%20gostaria%20de%20fazer%20uma%20simula%C3%A7%C3%A3o%20personalizada%20de%20prote%C3%A7%C3%A3o%20e%20planejamento%20sucess%C3%B3rio.";

const links = [
  { label: "Coberturas", href: "#coberturas" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Depoimento", href: "#depoimento" },
  { label: "Quem Sou", href: "#quem-sou" },
];

export default function CorretoraNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#001535]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="#topo" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0072CF]/20">
            <Shield className="h-5 w-5 text-[#A4CE4E]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/90">
            <span className="text-[#A4CE4E]">APEX SHIELD</span>{" "}
            <span className="hidden sm:inline text-white/60">PROTEÇÃO PATRIMONIAL</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/70 hover:text-white transition-colors">{l.label}</a>
          ))}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-[#A4CE4E] px-5 py-2 text-sm font-bold uppercase tracking-wide text-[#002D72] hover:bg-[#b8da62] transition-colors">
            Falar com Especialista
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#001535] px-5 py-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-white/70 hover:text-white py-2">{l.label}</a>
          ))}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="block rounded-full bg-[#A4CE4E] px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-[#002D72]">
            Falar com Especialista
          </a>
        </div>
      )}
    </nav>
  );
}