import { ChevronRight, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const LEAD_STEPS = [
  { value: "Novo", label: "Novo", color: "rgb(128, 0, 128)" },
  { value: "AB Fone", label: "AB Fone", color: "rgb(255, 105, 180)" },
  { value: "AB Visita", label: "AB Visita", color: "rgb(135, 206, 250)" },
];

const CLIENTE_STEPS = [
  { value: "AB Fechamento", label: "AB Fechamento", color: "rgb(255, 215, 0)" },
  { value: "Delay", label: "Delay", color: "rgb(0, 255, 255)" },
  { value: "Análise", label: "Análise", color: "rgb(165, 42, 42)" },
  { value: "Venda Feita", label: "Venda Feita", color: "rgb(34, 139, 34)" },
  { value: "Entrega de Apólice", label: "Entrega Apólice", color: "rgb(200, 162, 200)" },
  { value: "Encerrado", label: "Encerrado", color: "rgb(105, 105, 105)" },
];

export default function FluxoPipeline({ tipo = "lead", activeStatus }) {
  const isLead = tipo === "lead";
  const steps = isLead ? LEAD_STEPS : CLIENTE_STEPS;

  const activeIndex = steps.findIndex(s => s.value === activeStatus);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 md:p-4 mb-4">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold">
          {isLead ? "Fluxo do Lead" : "Fluxo do Cliente"}
        </span>
        {!isLead && (
          <span className="text-emerald-400 text-[10px] ml-auto flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Convertido
          </span>
        )}
      </div>

      {/* Full flow overview on desktop */}
      <div className="hidden md:flex items-center gap-0">
        {isLead && (
          <>
            {LEAD_STEPS.map((step, i) => (
              <StepItem
                key={step.value}
                step={step}
                isActive={step.value === activeStatus}
                isPast={activeIndex > i}
                isFirst={i === 0}
                isLast={false}
              />
            ))}
            <div className="flex items-center mx-1">
              <div className="w-6 h-6 rounded-full bg-emerald-500/30 border-2 border-emerald-500/50 flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
            {CLIENTE_STEPS.map((step, i) => (
              <StepItem
                key={step.value}
                step={step}
                isActive={false}
                isPast={false}
                isFirst={false}
                isLast={i === CLIENTE_STEPS.length - 1}
                dimmed
              />
            ))}
          </>
        )}
        {!isLead && (
          <>
            {LEAD_STEPS.map((step, i) => (
              <StepItem
                key={step.value}
                step={step}
                isActive={false}
                isPast={true}
                isFirst={i === 0}
                isLast={false}
                dimmed
              />
            ))}
            <div className="flex items-center mx-1">
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-white" />
              </div>
            </div>
            {CLIENTE_STEPS.map((step, i) => (
              <StepItem
                key={step.value}
                step={step}
                isActive={step.value === activeStatus}
                isPast={activeIndex > i}
                isFirst={false}
                isLast={i === CLIENTE_STEPS.length - 1}
              />
            ))}
          </>
        )}
      </div>

      {/* Mobile: only current pipeline steps */}
      <div className="flex md:hidden items-center gap-0 overflow-x-auto no-scrollbar">
        {steps.map((step, i) => (
          <StepItem
            key={step.value}
            step={step}
            isActive={step.value === activeStatus}
            isPast={activeIndex > i}
            isFirst={i === 0}
            isLast={i === steps.length - 1}
            compact
          />
        ))}
      </div>
    </div>
  );
}

function StepItem({ step, isActive, isPast, isFirst, isLast, dimmed, compact }) {
  return (
    <div className="flex items-center flex-shrink-0">
      {!isFirst && <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0 mx-0.5" />}
      <motion.div
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`
          px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all border
          ${compact ? "px-2 py-1" : "px-2.5 py-1.5"}
          ${isActive
            ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 shadow-lg border-white/50"
            : isPast
              ? "opacity-80 border-transparent"
              : dimmed
                ? "opacity-30 border-transparent"
                : "opacity-40 border-transparent"
          }
        `}
        style={{
          backgroundColor: isActive || isPast ? step.color : `${step.color}33`,
          color: isActive
            ? (["rgb(255, 215, 0)", "rgb(0, 255, 255)", "rgb(135, 206, 250)", "rgb(200, 162, 200)"].includes(step.color) ? "#000" : "#fff")
            : isPast
              ? (["rgb(255, 215, 0)", "rgb(0, 255, 255)", "rgb(135, 206, 250)", "rgb(200, 162, 200)"].includes(step.color) ? "#000" : "#fff")
              : "rgba(255,255,255,0.5)"
        }}
      >
        {step.label}
      </motion.div>
    </div>
  );
}