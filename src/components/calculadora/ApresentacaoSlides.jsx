import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Shield, Heart, Brain, Bone, Stethoscope, Building, Umbrella, Cross, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const fmtBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

function SlideWrapper({ children, className = "" }) {
  return (
    <div className={`pdf-page w-full aspect-video bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl overflow-hidden relative ${className}`}>
      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-900/10 rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-lime-500/15 rounded-full" />
      <div className="absolute top-1/4 -right-6 w-20 h-20 bg-lime-400/20 rounded-full" />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}

function SlideCapa({ cliente, consultor }) {
  return (
    <SlideWrapper>
      <div className="flex-1 flex items-center justify-center px-8 md:px-16">
        <div className="text-center md:text-right flex-1">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lime-600 text-2xl md:text-4xl font-black tracking-tight">PROTEÇÃO</motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-blue-900 text-4xl md:text-7xl font-black tracking-tight leading-none">FINANCEIRA</motion.p>
          <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ delay: 0.6, duration: 0.8 }}
            className="h-1 bg-lime-500 mt-4 mb-3 ml-auto" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="text-blue-900/70 text-lg md:text-2xl font-medium uppercase tracking-wide">{cliente?.nome || "Cliente"}</motion.p>
        </div>
      </div>
      <div className="px-8 pb-4 flex justify-between items-end">
        <p className="text-xs text-gray-400">Consultoria: {consultor}</p>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-900" />
          <span className="text-blue-900 font-black text-sm">APEX SHIELD</span>
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideBriefing({ cliente, analise, formData }) {
  const filhosNomes = cliente?.filhos_info?.map(f => f.nome).filter(Boolean).join(" e ") || `${formData.dependentes} dependente(s)`;
  return (
    <SlideWrapper>
      <div className="bg-blue-900 text-white text-center py-4 md:py-6">
        <h2 className="text-2xl md:text-5xl font-black tracking-tight">BRIEFING</h2>
      </div>
      <div className="flex-1 flex items-center px-6 md:px-16 gap-6 md:gap-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
          className="w-28 h-28 md:w-40 md:h-40 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl">
          <span className="text-white font-black text-sm md:text-lg text-center px-2">{formData.profissao?.toUpperCase() || "PROFISSIONAL"}</span>
        </motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
          className="w-28 h-28 md:w-40 md:h-40 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl">
          <span className="text-white font-black text-2xl md:text-4xl">{analise.idade} ANOS</span>
        </motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }}
          className="w-28 h-28 md:w-40 md:h-40 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl p-3">
          <span className="text-white font-bold text-[10px] md:text-xs text-center leading-tight uppercase">
            Construir o presente para garantir o melhor para {filhosNomes || "sua família"}
          </span>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="px-6 md:px-16 pb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><span className="text-lime-600 font-bold text-xs block">Renda Mensal:</span><span className="text-gray-800 font-black text-sm">{fmtBRL(analise.renda)}</span></div>
        <div><span className="text-lime-600 font-bold text-xs block">Custo Mensal:</span><span className="text-gray-800 font-black text-sm">{fmtBRL(analise.gastos)}</span></div>
        <div><span className="text-lime-600 font-bold text-xs block">Patrimônio:</span><span className="text-gray-800 font-black text-sm">{fmtBRL(analise.patrimonioBruto)}</span></div>
        <div><span className="text-lime-600 font-bold text-xs block">Filhos:</span><span className="text-gray-800 font-black text-sm">{filhosNomes || "—"}</span></div>
      </motion.div>
    </SlideWrapper>
  );
}

function SlidePontosImportantes() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex items-center justify-center px-8 md:px-16">
        <div className="text-center">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-blue-900 text-2xl md:text-5xl font-black mb-6">
            PONTOS IMPORTANTES DO SEGURO<br />DE VIDA E EM VIDA
          </motion.h2>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}>
            <Shield className="w-16 h-16 md:w-24 md:h-24 text-blue-600/30 mx-auto" />
          </motion.div>
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideCobertura({ icon: Icon, title, valor, color, bgGradient, children, delay = 0 }) {
  return (
    <SlideWrapper>
      <div className="bg-lime-500/90 text-center py-3 md:py-4">
        <h2 className="text-xl md:text-4xl font-black text-white tracking-tight">COBERTURAS ESSENCIAIS</h2>
      </div>
      <div className="flex-1 flex items-stretch px-6 md:px-12 py-4 md:py-8 gap-4 md:gap-8">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className={`flex-1 ${bgGradient} rounded-2xl p-5 md:p-8 text-white flex flex-col justify-center shadow-xl`}>
          <div className="flex items-center gap-3 mb-3">
            <Icon className="w-6 h-6 md:w-8 md:h-8" />
            <h3 className="text-lg md:text-2xl font-black">{title}</h3>
          </div>
          <p className="text-2xl md:text-5xl font-black mb-3">{fmtBRL(valor)}</p>
        </motion.div>
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex-1 bg-white/80 rounded-2xl p-5 md:p-8 flex flex-col justify-center border border-gray-200 shadow-lg">
          <div className="text-gray-700 text-xs md:text-sm leading-relaxed space-y-2">{children}</div>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

function SlideTotal({ analise, formData, consultor }) {
  const percentualRenda = analise.renda > 0 ? ((analise.total / 12) / analise.renda * 100).toFixed(1) : "—";
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="bg-lime-500 text-white px-8 py-3 rounded-xl mb-6 shadow-xl">
          <h3 className="text-lg md:text-3xl font-black italic">MAIS DE {fmtBRL(analise.total)} EM COBERTURAS</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-blue-600 text-white px-10 py-6 rounded-2xl text-center shadow-2xl max-w-2xl">
          <p className="text-xl md:text-3xl font-black leading-snug">
            PROTEJA SEU PADRÃO DE VIDA E SUA FAMÍLIA
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-6 flex items-center gap-4">
          <Shield className="w-10 h-10 text-blue-900" />
          <span className="text-blue-900 font-black text-lg">APEX SHIELD</span>
          <span className="text-gray-400 mx-2">•</span>
          <span className="text-gray-500 text-sm">Em parceria com MetLife</span>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

export default function ApresentacaoSlides({ analise, formData, cliente, consultor, modulos }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides = [];
  slides.push({ id: "capa", render: () => <SlideCapa cliente={cliente} consultor={consultor} /> });
  slides.push({ id: "briefing", render: () => <SlideBriefing cliente={cliente} analise={analise} formData={formData} /> });
  slides.push({ id: "pontos", render: () => <SlidePontosImportantes /> });

  if (modulos.invalidez) {
    slides.push({ id: "invalidez", render: () => (
      <SlideCobertura icon={Activity} title="INVALIDEZ ACIDENTAL MAJORADA" valor={analise.invalidezTotal} bgGradient="bg-gradient-to-br from-blue-800 to-blue-900">
        <p className="font-bold">O que é?</p>
        <p>Cobertura de Invalidez Permanente Total ou Parcial por Acidente com cláusula de Majoração.</p>
        <p className="font-bold mt-2">Benefícios:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Perda total da visão de um olho: 100% do capital</li>
          <li>Perda total da audição de um ouvido: 100% do capital</li>
          <li>Perda total da fala: 100% do capital</li>
        </ul>
      </SlideCobertura>
    )});
  }

  if (modulos.fratura_ossea) {
    slides.push({ id: "fratura", render: () => (
      <SlideCobertura icon={Bone} title="FRATURA ÓSSEA" valor={analise.fraturaOssea} bgGradient="bg-gradient-to-br from-lime-600 to-lime-700">
        <p>Recurso destinado à manutenção do padrão de vida e despesas de reabilitação.</p>
        <p className="font-bold mt-2">Exemplos de cobertura:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Crânio/Vértebras: 100%</li>
          <li>Pelve/Quadril/Fêmur: 50%</li>
          <li>Braço/Perna/Clavícula: 25%</li>
        </ul>
      </SlideCobertura>
    )});
  }

  if (modulos.cirurgias) {
    slides.push({ id: "cirurgias", render: () => (
      <SlideCobertura icon={Stethoscope} title="CIRURGIAS" valor={analise.cirurgias} bgGradient="bg-gradient-to-br from-blue-700 to-indigo-800">
        <p className="font-bold">O que é?</p>
        <p>Cobertura que garante pagamento em parcela única para intervenções cirúrgicas específicas.</p>
        <p className="font-bold mt-2">Principais cirurgias:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Revascularização Miocárdica</li>
          <li>Cirurgia da Aorta / Válvulas Cardíacas</li>
          <li>Transplante de Órgãos</li>
        </ul>
      </SlideCobertura>
    )});
  }

  if (modulos.doencas_graves) {
    slides.push({ id: "doencas", render: () => (
      <SlideCobertura icon={Brain} title="DOENÇAS GRAVES" valor={analise.doencasGraves} bgGradient="bg-gradient-to-br from-blue-900 to-slate-900">
        <p className="font-bold">MAIS PROTEÇÃO — 32 Coberturas</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div><p className="font-bold text-lime-700 text-xs">Oncológica</p><p className="text-[10px]">Câncer, Transplante de Medula</p></div>
          <div><p className="font-bold text-blue-700 text-xs">Cardíaca/Renal</p><p className="text-[10px]">Infarto, By-pass, Transplantes</p></div>
          <div><p className="font-bold text-teal-700 text-xs">Neurológica</p><p className="text-[10px]">AVC, Parkinson, Alzheimer</p></div>
          <div><p className="font-bold text-amber-700 text-xs">Hepática</p><p className="text-[10px]">Cirrose, Hepatite, Transplantes</p></div>
        </div>
      </SlideCobertura>
    )});
  }

  if (modulos.sucessao) {
    slides.push({ id: "sucessao", render: () => (
      <SlideCobertura icon={Building} title="CAPITAL SEGURADO FALECIMENTO" valor={analise.sucessao} bgGradient="bg-gradient-to-br from-blue-900 to-blue-950">
        <p>Proteção personalizada com coberturas que garantem segurança financeira nos momentos mais difíceis.</p>
        <p className="mt-2"><strong>Custos de inventário:</strong> ITCMD + Advogado + Cartório = {analise.taxaTotal?.toFixed(1)}% do patrimônio</p>
        <p className="mt-2">Assistência familiar para que toda a família tenha o suporte devido.</p>
      </SlideCobertura>
    )});
  }

  if (modulos.assistencia_funeral) {
    slides.push({ id: "funeral", render: () => (
      <SlideCobertura icon={Cross} title="AMPARO FUNERAL FAMILIAR" valor={analise.assistenciaFuneral} bgGradient="bg-gradient-to-br from-lime-600 to-emerald-700">
        <p>Cobertura que oferece apoio completo na organização do funeral, desde o transporte até a escolha do sepultamento ou cremação.</p>
        <p className="mt-2">Permite que a família se concentre no luto sem se preocupar com burocracias ou custos elevados.</p>
      </SlideCobertura>
    )});
  }

  if (modulos.diaria_internacao) {
    slides.push({ id: "diaria", render: () => (
      <SlideCobertura icon={Heart} title="DIÁRIA POR INTERNAÇÃO HOSPITALAR" valor={analise.diariaInternacao} bgGradient="bg-gradient-to-br from-blue-800 to-blue-900">
        <p className="font-bold text-center text-lg">{fmtBRL(analise.diariaInternacao)} POR DIA</p>
        <ul className="list-disc ml-4 space-y-1 mt-3">
          <li>Suporte financeiro diário</li>
          <li>Manutenção do padrão de vida</li>
          <li>Reserva para despesas extras</li>
          <li>Cobertura imediata</li>
        </ul>
      </SlideCobertura>
    )});
  }

  slides.push({ id: "total", render: () => <SlideTotal analise={analise} formData={formData} consultor={consultor} /> });

  const goTo = (i) => {
    setDirection(i > currentSlide ? 1 : -1);
    setCurrentSlide(i);
  };

  const next = () => { if (currentSlide < slides.length - 1) goTo(currentSlide + 1); };
  const prev = () => { if (currentSlide > 0) goTo(currentSlide - 1); };

  const downloadPDF = async () => {
    const container = document.getElementById("slides-container");
    if (!container) return;
    const pages = container.querySelectorAll(".pdf-page");
    const pdf = new jsPDF("l", "mm", "a4"); // landscape
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: "#f8fafc" });
      const imgData = canvas.toDataURL("image/png");
      const w = 297, h = (canvas.height * w) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, w, Math.min(h, 210));
    }
    pdf.save(`Apresentacao_${cliente?.nome?.replace(/\s/g, "_") || "Cliente"}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={prev} disabled={currentSlide === 0} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? "bg-indigo-400 w-6" : "bg-white/20 hover:bg-white/40"}`} />
          ))}
        </div>
        <Button onClick={next} disabled={currentSlide === slides.length - 1} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Slide View */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slides[currentSlide].id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {slides[currentSlide].render()}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-white/40 text-xs">Slide {currentSlide + 1} de {slides.length}</p>

      {/* Hidden full render for PDF */}
      <div id="slides-container" className="hidden">
        {slides.map((s) => <div key={s.id}>{s.render()}</div>)}
      </div>

      {/* Download */}
      <Button onClick={downloadPDF} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 text-lg">
        <Download className="w-5 h-5 mr-2" /> Baixar Apresentação (PDF)
      </Button>
    </div>
  );
}