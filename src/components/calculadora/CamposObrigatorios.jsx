import { AlertTriangle, CheckCircle } from "lucide-react";

const CAMPOS_OBRIGATORIOS = [
  { key: "data_nascimento", label: "Data de Nascimento", check: (v) => !!v },
  { key: "renda_mensal", label: "Renda Mensal", check: (v) => !!v && v !== "0" && v !== "R$ 0,00" },
  { key: "gastos_mensais", label: "Custo Mensal", check: (v) => !!v && v !== "0" && v !== "R$ 0,00" },
  { key: "patrimonio_bruto", label: "Patrimônio", check: (v) => !!v && v !== "0" && v !== "R$ 0,00" },
  { key: "estado_civil", label: "Estado Civil", check: (v) => !!v },
  { key: "profissao", label: "Profissão", check: (v) => !!v },
];

const CAMPOS_RECOMENDADOS = [
  { key: "altura", label: "Altura", check: (v) => !!v },
  { key: "peso", label: "Peso", check: (v) => !!v },
];

export function validarCampos(formData) {
  const faltantes = CAMPOS_OBRIGATORIOS.filter(c => !c.check(formData[c.key]));
  const recomendados = CAMPOS_RECOMENDADOS.filter(c => !c.check(formData[c.key]));
  return { faltantes, recomendados, isValid: faltantes.length === 0 };
}

export default function CamposObrigatorios({ formData }) {
  const { faltantes, recomendados } = validarCampos(formData);

  if (faltantes.length === 0 && recomendados.length === 0) {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-4 py-3">
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-emerald-300 text-sm font-medium">Todos os campos necessários estão preenchidos!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {faltantes.length > 0 && (
        <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm font-bold">Campos obrigatórios em branco:</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {faltantes.map(c => (
              <span key={c.key} className="text-xs bg-red-500/30 text-red-200 px-2 py-1 rounded-md font-medium">{c.label}</span>
            ))}
          </div>
          <p className="text-red-300/60 text-xs mt-2">Preencha estes campos no painel do cliente para um cálculo preciso.</p>
        </div>
      )}
      {recomendados.length > 0 && (
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-xs font-medium">Recomendados: {recomendados.map(c => c.label).join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}