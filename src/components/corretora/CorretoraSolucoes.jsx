import { motion } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/5562991866728?text=Ol%C3%A1%2C%20Gustavo!%20Vim%20pelo%20site%20da%20Apex%20Shield%20e%20gostaria%20de%20fazer%20uma%20simula%C3%A7%C3%A3o%20personalizada%20de%20prote%C3%A7%C3%A3o%20e%20planejamento%20sucess%C3%B3rio.";

const solucoes = [
  {
    badge: "Liquidez para o Inventário",
    title: "Inventário e Liquidez Imediata",
    desc: "O seguro paga com agilidade, liberando capital em dias para que sua família cubra as custas do inventário e evite o bloqueio de até 20% do patrimônio durante o processo.",
    img: "https://media.base44.com/images/public/6a82520ed85c97aab976d507/92e5d137a_generated_image.png/v1/fill/w_350,h_176,fp_0.50_0.30,q_90,usm_0.66_1.00_0.01,enc_webp,quality_auto/92e5d137a_generated_image.webp",
  },
  {
    badge: "Cobertura Antecipada",
    title: "Proteção em Vida",
    desc: "Coberturas diagnósticas para doenças graves, invalidez e cirurgias. Você recebe suporte financeiro no momento que mais precisa, sem comprometer seu padrão de vida.",
    img: "https://media.base44.com/images/public/6a82520ed85c97aab976d507/bbe56c386_generated_image.png/v1/fill/w_350,h_176,fp_0.50_0.30,q_90,usm_0.66_1.00_0.01,enc_webp,quality_auto/bbe56c386_generated_image.webp",
  },
  {
    badge: "Herança Protegida",
    title: "Segurança Sucessória Familiar",
    desc: "Garanta a continuidade do padrão de vida de quem você ama. Planejamento que protege a herança, reduz tributos e assegura a transição patrimonial sem conflitos.",
    img: "https://media.base44.com/images/public/6a82520ed85c97aab976d507/ee55a6b38_generated_image.png/v1/fill/w_350,h_176,fp_0.50_0.30,q_90,usm_0.66_1.00_0.01,enc_webp,quality_auto/ee55a6b38_generated_image.webp",
  },
];

export default function CorretoraSolucoes() {
  return (
    <section id="solucoes" className="px-5 py-24 sm:px-8" style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)" }}>
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.3em] text-[#0072CF]">Dores & Soluções</span>
          <h2 className="text-3xl font-bold text-[#002D72] sm:text-4xl">Riscos Invisíveis, Proteção Tangível</h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {solucoes.map((sol, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group overflow-hidden rounded-2xl border border-[#0072CF]/10 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <div className="relative h-44 overflow-hidden">
                <img src={sol.img} alt={sol.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-[#002D72]/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">{sol.badge}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#002D72] mb-2">{sol.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 mb-4">{sol.desc}</p>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#0072CF] hover:text-[#A4CE4E] transition-colors">
                  Saber mais →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}