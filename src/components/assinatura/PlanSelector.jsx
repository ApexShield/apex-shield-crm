import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "mensal",
    label: "Mensal",
    price: "29,90",
    priceNum: 29.90,
    period: "/mês",
    priceId: "price_1TBRc4LVnpTd5qx7maQqhy65",
    badge: null,
  },
  {
    id: "anual",
    label: "Anual",
    price: "322,92",
    priceNum: 322.92,
    period: "/ano",
    priceId: "price_1TBRc4LVnpTd5qx7jCvuiZdW",
    badge: "10% OFF",
    monthlyEquivalent: "26,91",
  },
];

export default function PlanSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PLANS.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelect(plan)}
          className={cn(
            "relative rounded-xl border-2 p-4 text-left transition-all",
            selected?.id === plan.id
              ? "border-indigo-500 bg-indigo-50/50 shadow-md"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          {plan.badge && (
            <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {plan.badge}
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
              selected?.id === plan.id ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
            )}>
              {selected?.id === plan.id && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-bold text-slate-800">{plan.label}</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-slate-500">R$</span>
            <span className="text-2xl font-black text-slate-800">{plan.price}</span>
            <span className="text-xs text-slate-500">{plan.period}</span>
          </div>
          {plan.monthlyEquivalent && (
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Equivale a R$ {plan.monthlyEquivalent}/mês
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

export { PLANS };