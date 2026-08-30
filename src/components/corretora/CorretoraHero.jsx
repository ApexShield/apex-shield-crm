import { motion } from "framer-motion";
import { ShieldCheck, Award, Gem, ArrowRight } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5562991866728?text=Ol%C3%A1%2C%20Gustavo!%20Vim%20pelo%20site%20da%20Apex%20Shield%20e%20gostaria%20de%20fazer%20uma%20simula%C3%A7%C3%A3o%20personalizada%20de%20prote%C3%A7%C3%A3o%20e%20planejamento%20sucess%C3%B3rio.";

export default function CorretoraHero() {
  return (
    <section id="topo" className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:pt-32" style={{ background: "linear-gradient(135deg, #002D72 0%, #001535 100%)" }}>
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#0072CF]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#A4CE4E]/10 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#A4CE4E]/30 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#A4CE4E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A4CE4E]" /> Planejamento Sucessório & Seguro de Vida
          </span>
          <h1 className="font-bold text-4xl leading-tight text-white sm:text-5xl lg:text-[3.4rem]">
            Proteja o Futuro da Sua Família e Garanta a{" "}
            <span className="text-[#A4CE4E]">Sucessão dos Seus Bens</span>{" "}
            com Estratégia e Solidez.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Consultoria personalizada em Seguro de Vida e Planejamento Patrimonial com o padrão de segurança global MetLife.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a href="#lead-form" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#A4CE4E] px-8 py-4 text-base font-bold uppercase tracking-wide text-[#002D72] hover:bg-[#b8da62] transition-colors">
              Simular Meu Plano Personalizado
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
              Falar no WhatsApp
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4">
            {[
              { icon: ShieldCheck, text: "Especialista Certificado SUSEP" },
              { icon: Award, text: "Parceria Oficial MetLife" },
              { icon: Gem, text: "Atendimento Exclusivo" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                <item.icon className="h-5 w-5 text-[#A4CE4E]" />
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
          <div className="relative overflow-hidden rounded-[28px]">
            <img
              src="https://media.base44.com/images/public/6a82520ed85c97aab976d507/97afb8ef4_generated_image.png/v1/fill/w_612,h_540,fp_0.50_0.25,q_90,usm_0.66_1.00_0.01,enc_webp,quality_auto/97afb8ef4_generated_image.webp"
              alt="Família feliz"
              className="w-full h-[420px] sm:h-[540px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001535]/70 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-6 -left-4 sm:-left-8 max-w-[240px] p-5 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#A4CE4E]/20">
                <ShieldCheck className="h-6 w-6 text-[#A4CE4E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R$ 50mi</p>
                <p className="text-xs text-white/70">em proteção patrimonial estruturada</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
        {[
          { icon: "📈", value: "R$ 50mi+", label: "em proteção patrimonial estruturada" },
          { icon: "👥", value: "320+", label: "famílias protegidas" },
          { icon: "🕐", value: "12 anos", label: "de experiência em sucessão" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0072CF]/20 text-2xl">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs leading-snug text-white/65">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}