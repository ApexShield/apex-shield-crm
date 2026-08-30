import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageCircle, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const WHATSAPP_URL = "https://wa.me/5562991866728?text=Ol%C3%A1%2C%20Gustavo!%20Vim%20pelo%20site%20da%20Apex%20Shield%20e%20gostaria%20de%20fazer%20uma%20simula%C3%A7%C3%A3o%20personalizada%20de%20prote%C3%A7%C3%A3o%20e%20planejamento%20sucess%C3%B3rio.";

export default function CorretoraLeadForm() {
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", objetivo: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) return;
    setSending(true);
    try {
      await base44.functions.invoke("capturarLead", {
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        fonte_prospeccao: "Site Corretora",
        observacao: form.objetivo ? `Objetivo: ${form.objetivo}` : undefined,
      });
      setSent(true);
    } catch {
      // fallback: open WhatsApp
      window.open(WHATSAPP_URL, "_blank");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="lead-form" className="px-5 py-24 sm:px-8" style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)" }}>
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.3em] text-[#0072CF]">Captura de Leads</span>
          <h2 className="text-3xl font-bold text-[#002D72] sm:text-4xl">Simule Seu Plano Personalizado de Proteção</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="mb-8 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-bold text-white hover:bg-[#20bd5a] transition-colors mx-auto w-fit">
            <MessageCircle className="h-5 w-5" />
            Falar Agora no WhatsApp
          </a>

          {sent ? (
            <div className="rounded-2xl border border-[#A4CE4E]/30 bg-white p-10 text-center shadow-lg">
              <CheckCircle className="h-16 w-16 text-[#A4CE4E] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#002D72] mb-2">Simulação Solicitada!</h3>
              <p className="text-slate-600">Entraremos em contato em breve com seu plano personalizado.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[#0072CF]/10 bg-white p-8 shadow-lg space-y-5">
              <div>
                <Label className="text-[#002D72] font-semibold">Nome Completo</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Seu nome completo" required className="mt-1" />
              </div>
              <div>
                <Label className="text-[#002D72] font-semibold">WhatsApp / Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" required className="mt-1" />
              </div>
              <div>
                <Label className="text-[#002D72] font-semibold">E-mail</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="seu@email.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-[#002D72] font-semibold">Objetivo Principal</Label>
                <Select value={form.objetivo} onValueChange={v => setForm(f => ({ ...f, objetivo: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sucessão Familiar">Sucessão Familiar</SelectItem>
                    <SelectItem value="Proteção em Vida">Proteção em Vida</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-[#002D72] hover:bg-[#001535] text-white py-6 text-base font-bold rounded-xl">
                {sending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                {sending ? "Enviando..." : "Simular Meu Plano"}
              </Button>
              <p className="text-center text-xs text-slate-400">Seus dados estão protegidos. Sem spam.</p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}