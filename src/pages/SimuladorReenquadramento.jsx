import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Shield, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import SimuladorGrafico from "../components/simulador/SimuladorGrafico";
import SimuladorResumo from "../components/simulador/SimuladorResumo";
import { SEGURADORAS, calcularProjecao } from "../components/simulador/tabelasReajuste";

const IPCA_12M = 4.14; // IPCA acumulado 12 meses - Mar/2026 (IBGE)

export default function SimuladorReenquadramento() {
  const [idade, setIdade] = useState("");
  const [sexo, setSexo] = useState("ambos");
  const [coberturaMorte, setCoberturaMorte] = useState("");
  const [simulado, setSimulado] = useState(false);

  const valorCobertura = parseFloat((coberturaMorte || "0").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const idadeNum = parseInt(idade) || 0;

  const projecoes = useMemo(() => {
    if (!simulado || !idadeNum || !valorCobertura) return null;
    return calcularProjecao(idadeNum, sexo, valorCobertura, IPCA_12M);
  }, [simulado, idadeNum, sexo, valorCobertura]);

  const handleSimular = () => {
    if (!idadeNum || idadeNum < 18 || idadeNum > 80) {
      alert("Informe uma idade válida entre 18 e 80 anos");
      return;
    }
    if (!valorCobertura || valorCobertura <= 0) {
      alert("Informe o valor da cobertura de morte");
      return;
    }
    setSimulado(true);
  };

  const formatCurrency = (val) => {
    const num = parseFloat((val || "0").replace(/[^\d]/g, "")) / 100;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleCurrencyInput = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setCoberturaMorte(""); return; }
    const num = (parseFloat(raw) / 100);
    setCoberturaMorte(num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Calculator className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Simulador de Reenquadramento Etário
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Projeção de reajuste na cobertura de morte por seguradora
          </p>
        </div>
      </motion.div>

      {/* IPCA Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 md:p-4 flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            IPCA Acumulado 12 meses: <span className="text-blue-600 dark:text-blue-400">{IPCA_12M}%</span>
          </p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
            Fonte: IBGE (Mar/2026) — Usado como fator de reajuste anual da MetLife
          </p>
        </div>
      </motion.div>

      {/* Formulário de Entrada */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                  Idade do Segurado
                </Label>
                <Input
                  type="number"
                  min={18}
                  max={80}
                  value={idade}
                  onChange={(e) => { setIdade(e.target.value); setSimulado(false); }}
                  placeholder="Ex: 35"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                  Sexo
                </Label>
                <Select value={sexo} onValueChange={(v) => { setSexo(v); setSimulado(false); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Ambos (tabela única)</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                  Cobertura de Morte (valor atual)
                </Label>
                <Input
                  value={coberturaMorte}
                  onChange={handleCurrencyInput}
                  placeholder="R$ 0,00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSimular}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold gap-2 px-6"
              >
                <TrendingUp className="w-4 h-4" />
                Simular Projeção
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resultado */}
      {projecoes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 md:space-y-6"
        >
          {/* Legenda das Seguradoras */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-white font-bold text-sm">Comparativo de Seguradoras</span>
            </div>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                {SEGURADORAS.map((seg) => (
                  <div key={seg.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: seg.cor }}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {seg.nome}
                    </span>
                    {seg.destaque && (
                      <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                        Apenas IPCA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico */}
          <SimuladorGrafico
            projecoes={projecoes}
            idadeInicial={idadeNum}
            valorInicial={valorCobertura}
          />

          {/* Resumo */}
          <SimuladorResumo
            projecoes={projecoes}
            idadeInicial={idadeNum}
            valorInicial={valorCobertura}
          />

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Aviso:</strong> Esta simulação é uma projeção estimada baseada nas tabelas de reenquadramento etário de cada seguradora e no IPCA acumulado. Os valores reais podem variar conforme alterações nas tabelas, condições contratuais e regulamentações vigentes. Consulte sempre a apólice do cliente.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}