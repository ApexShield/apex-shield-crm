import { motion } from "framer-motion";
import { ShieldCheck, Heart, Bone, Activity, Hospital, Stethoscope, Clock, Skull, Shield, AlertTriangle, Ambulance, Siren, HeartPulse, UserX } from "lucide-react";

const coberturas = [
  { icon: ShieldCheck, title: "Morte com Capital Decrescente", desc: "Indenização que reduz ao longo do tempo, ideal para acompanhar financiamentos e dívidas que também diminuem." },
  { icon: Skull, title: "Morte Acidental", desc: "Pagamento adicional em caso de falecimento por acidente, protegendo a família de imprevistos." },
  { icon: AlertTriangle, title: "Invalidez Acidental", desc: "Indenização por perda da capacidade de trabalho decorrente de acidente." },
  { icon: Shield, title: "Invalidez Acidental Majorada", desc: "Cobertura ampliada com indenização majorada para casos graves de invalidez por acidente." },
  { icon: Heart, title: "Amparo Funeral", desc: "Auxílio para custos do funeral, garantindo tranquilidade à família no momento do luto." },
  { icon: Stethoscope, title: "Cirurgias", desc: "Reserva para despesas com procedimentos cirúrgicos previstos em tabela." },
  { icon: UserX, title: "Invalidez Permanente por Doença Funcional", desc: "Indenização quando uma doença gera perda funcional permanente que afeta o trabalho." },
  { icon: HeartPulse, title: "Doenças Graves", desc: "Capital pago ao diagnóstico de doenças graves previstas, como câncer, infarto e AVC." },
  { icon: Bone, title: "Fratura Óssea", desc: "Indenização por fraturas especificadas em tabela, ajudando no tratamento e na recuperação." },
  { icon: Activity, title: "Diária por Incapacidade Temporária", desc: "Renda diária durante o afastamento temporário do trabalho por acidente ou doença." },
  { icon: Hospital, title: "Diária por Internação Hospitalar", desc: "Valor por dia de internação, aliviando despesas não cobertas durante a hospitalização." },
  { icon: Clock, title: "Temporária por Morte", desc: "Cobertura por prazo determinado, com pagamento de capital aos beneficiários em caso de morte durante a vigência." },
  { icon: Ambulance, title: "Funeral Individual", desc: "Garante o custeio do funeral do segurado titular, de forma individual." },
  { icon: Siren, title: "Doenças Incapacitantes", desc: "Auxílio financeiro quando uma doença impede definitivamente o exercício da atividade profissional." },
];

export default function CorretoraCoberturas() {
  return (
    <section id="coberturas" className="relative bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.3em] text-[#0072CF]">Coberturas MetLife</span>
          <h2 className="text-3xl font-bold text-[#002D72] sm:text-4xl">Proteção Modular, Sob Medida para Cada Família</h2>
          <p className="mt-4 text-slate-600">Monte o seu plano combinando as coberturas que fazem sentido para o seu momento de vida.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-[#0072CF]/15 bg-[#F8FAFC] p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coberturas.map((cob, i) => {
              const Icon = cob.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                  className="group rounded-xl border border-transparent bg-white p-4 transition-colors hover:border-[#0072CF]/25 hover:shadow-md">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0072CF]/10 text-[#0072CF] transition-colors group-hover:bg-[#A4CE4E] group-hover:text-[#002D72]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold leading-tight text-[#002D72]">{cob.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{cob.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Coberturas contratadas conforme regras e períodos de carência da MetLife. Consulte condições.
        </p>
      </div>
    </section>
  );
}