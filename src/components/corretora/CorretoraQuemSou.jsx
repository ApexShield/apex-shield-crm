import { motion } from "framer-motion";
import { Instagram, Linkedin, Facebook } from "lucide-react";

export default function CorretoraQuemSou() {
  return (
    <section id="quem-sou" className="px-5 py-24 sm:px-8 bg-white">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.3em] text-[#0072CF]">Quem Sou</span>
          <h2 className="text-3xl font-bold text-[#002D72] sm:text-4xl">O Estrategista por Trás da Sua Proteção</h2>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="overflow-hidden rounded-3xl">
              <img
                src="https://media.base44.com/images/public/6a82520ed85c97aab976d507/7713bb30c_Gemini_Generated_Image_i387m1i387m1i3871.png/v1/fill/w_437,h_480,fp_0.50_0.20,q_90,usm_0.66_1.00_0.01,enc_webp,quality_auto/7713bb30c_Gemini_Generated_Image_i387m1i387m1i3871.webp"
                alt="Gustavo Ferreira — CEO Apex Shield"
                className="w-full max-w-md mx-auto object-cover"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="text-2xl font-bold text-[#002D72]">Gustavo Ferreira</h3>
            <p className="text-[#0072CF] font-semibold mb-4">CEO · Apex Shield</p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Acreditamos que proteger patrimônio é, antes de tudo, proteger pessoas. Minha missão é traduzir a complexidade do planejamento sucessório em decisões claras, seguras e sob medida para cada família.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "CEO e Estrategista de Proteção Patrimonial",
                "Especialista certificado SUSEP em Seguro de Vida",
                "Parceria oficial com a MetLife",
                "Mais de uma década estruturando sucessão patrimonial",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#A4CE4E] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Conecte-se</span>
              <a href="https://instagram.com/guga.a.ferreira" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002D72]/10 text-[#002D72] hover:bg-[#A4CE4E] hover:text-[#002D72] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/gugaaferreira" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002D72]/10 text-[#002D72] hover:bg-[#A4CE4E] hover:text-[#002D72] transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/gustavo.almeida.9231/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002D72]/10 text-[#002D72] hover:bg-[#A4CE4E] hover:text-[#002D72] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}