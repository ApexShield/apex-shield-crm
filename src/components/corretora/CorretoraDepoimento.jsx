import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function CorretoraDepoimento() {
  return (
    <section id="depoimento" className="px-5 py-24 sm:px-8" style={{ background: "linear-gradient(135deg, #002D72 0%, #001535 100%)" }}>
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.3em] text-[#A4CE4E]">Prova Social</span>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Um Caso Real. Proteção que Cumpriu o que Prometeu.</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12">
          <div className="flex items-start gap-4 mb-8">
            <Quote className="h-10 w-10 text-[#A4CE4E] flex-shrink-0 mt-1" />
            <div>
              <p className="text-lg leading-relaxed text-white/90 italic">
                "A tranquilidade de saber que minha família está protegida mudou tudo. Gustavo trouxe clareza para um assunto que sempre pareceu distante — hoje tenho um plano que realmente entendo e confio."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0072CF]/30 text-white font-bold text-lg">JM</div>
                <div>
                  <p className="font-bold text-white">José Maria</p>
                  <p className="text-xs text-white/60">Cliente Apex Shield · Planejamento Sucessório</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h3 className="text-lg font-bold text-[#A4CE4E] mb-4">O Caso José Maria</h3>
            <p className="text-sm leading-relaxed text-white/80">
              José Maria viveu uma situação inusitada: com apenas <strong className="text-white">13 dias entre a aceitação da apólice</strong>, precisou acionar o seguro. Em seu trabalho como vendedor de veículos, escorregou no piso da loja e fraturou o fêmur, sendo submetido a uma cirurgia no quadril e ficando <strong className="text-white">mais de dois meses afastado</strong> de suas atividades. Foi a cobertura de <strong className="text-white">Fratura Óssea</strong> que preservou a sua renda: o seguro respondeu no momento exato em que ele precisava, garantindo o pagamento das despesas mensais, mantendo o padrão de vida da família e confirmando, na prática, o valor de uma <strong className="text-white">Proteção em Vida</strong> bem estruturada.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}