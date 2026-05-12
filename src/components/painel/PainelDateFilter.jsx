import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, RotateCcw } from "lucide-react";

export default function PainelDateFilter({ dataInicio, dataFim, onChangeInicio, onChangeFim, onReset }) {
  return (
    <div className="flex items-center gap-3 flex-wrap bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 px-4 py-3">
      <Calendar className="w-5 h-5 text-cyan-400" />
      <div className="flex items-center gap-2">
        <Label className="text-white text-xs font-bold whitespace-nowrap">De:</Label>
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => onChangeInicio(e.target.value)}
          className="bg-white/10 border-white/20 text-white h-9 text-sm w-auto"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-white text-xs font-bold whitespace-nowrap">Até:</Label>
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => onChangeFim(e.target.value)}
          className="bg-white/10 border-white/20 text-white h-9 text-sm w-auto"
        />
      </div>
      <Button onClick={onReset} variant="ghost" size="sm" className="text-cyan-300 hover:text-white hover:bg-white/10">
        <RotateCcw className="w-4 h-4 mr-1" /> Mês Atual
      </Button>
    </div>
  );
}