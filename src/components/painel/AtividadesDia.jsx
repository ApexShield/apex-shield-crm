import { Cake, RefreshCw, Phone, CalendarCheck, Handshake, Bot, Bell } from "lucide-react";
import { format, isToday, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ActivityItem({ icon: Icon, color, title, items }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-white font-bold text-xs">{title}</span>
        <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="ml-6 space-y-1">
        {items.slice(0, 5).map((item, idx) => (
          <div key={idx} className="text-white/80 text-[11px] bg-white/5 rounded px-2 py-1">
            {item}
          </div>
        ))}
        {items.length > 5 && <span className="text-white/50 text-[10px]">+{items.length - 5} mais...</span>}
      </div>
    </div>
  );
}

export default function AtividadesDia({ clientes, compromissos }) {
  const [resumoIA, setResumoIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const hoje = new Date().toISOString().split("T")[0];

  // Aniversariantes de hoje
  const todayMD = format(new Date(), "MM-dd");
  const aniversariantes = clientes.filter(c => {
    if (!c.data_nascimento) return false;
    const md = c.data_nascimento.slice(5);
    return md === todayMD;
  }).map(c => c.nome);

  // Abordagens do dia
  const abordagensDia = compromissos.filter(c =>
    c.data_inicio?.split("T")[0] === hoje &&
    c.tipo === "agendado" &&
    (c.status_origem !== "AB Fechamento")
  ).map(c => `${c.cliente_nome || c.titulo} - ${c.data_inicio ? format(new Date(c.data_inicio), "HH:mm") : ""}`);

  // Fechamentos do dia
  const fechamentosDia = compromissos.filter(c =>
    c.data_inicio?.split("T")[0] === hoje &&
    c.status_origem === "AB Fechamento"
  ).map(c => `${c.cliente_nome || c.titulo} - ${c.data_inicio ? format(new Date(c.data_inicio), "HH:mm") : ""}`);

  // Retorno de contato (leads com data_contato = hoje)
  const retornoContato = clientes.filter(c =>
    c.data_contato && c.data_contato.split("T")[0] === hoje
  ).map(c => `${c.nome} - ${c.telefone || "sem telefone"}`);

  // Renovação de Apólices (leads com status Entrega de Apólice há mais de 330 dias)
  const renovacoes = clientes.filter(c => {
    if (c.status !== "Entrega de Apólice") return false;
    const vendaEvt = (c.historico_status || []).find(h => h.para === "Entrega de Apólice");
    if (!vendaEvt?.timestamp) return false;
    const dias = differenceInDays(new Date(), new Date(vendaEvt.timestamp));
    return dias >= 330;
  }).map(c => c.nome);

  const totalAtividades = aniversariantes.length + abordagensDia.length + fechamentosDia.length + retornoContato.length + renovacoes.length;

  const gerarResumoIA = async () => {
    setLoadingIA(true);
    const atividades = [];
    if (aniversariantes.length > 0) atividades.push(`Aniversariantes: ${aniversariantes.join(", ")}`);
    if (abordagensDia.length > 0) atividades.push(`Abordagens agendadas: ${abordagensDia.join("; ")}`);
    if (fechamentosDia.length > 0) atividades.push(`Fechamentos agendados: ${fechamentosDia.join("; ")}`);
    if (retornoContato.length > 0) atividades.push(`Retorno de contato: ${retornoContato.join("; ")}`);
    if (renovacoes.length > 0) atividades.push(`Renovação de apólices: ${renovacoes.join(", ")}`);

    const prompt = `Você é o assistente do APEX SHIELD CRM para corretores de seguros. Crie um resumo curto e motivacional das atividades de hoje (${format(new Date(), "dd/MM/yyyy")}):
${atividades.length > 0 ? atividades.join("\n") : "Nenhuma atividade programada para hoje."}
Faça um resumo objetivo com emojis, máx 4 linhas.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setResumoIA(res);
    setLoadingIA(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600/80 to-purple-700/80 rounded-2xl border border-white/20 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h3 className="font-black text-sm text-white">ATIVIDADES DO DIA</h3>
          <span className="bg-yellow-400/20 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full">
            {totalAtividades}
          </span>
        </div>
        <span className="text-white/60 text-xs">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</span>
      </div>

      <div className="space-y-3">
        <ActivityItem icon={Cake} color="text-pink-400" title="Aniversariantes" items={aniversariantes} />
        <ActivityItem icon={RefreshCw} color="text-orange-400" title="Renovação de Apólices" items={renovacoes} />
        <ActivityItem icon={Phone} color="text-cyan-400" title="Retorno de Contato" items={retornoContato} />
        <ActivityItem icon={CalendarCheck} color="text-blue-400" title="Abordagens do Dia" items={abordagensDia} />
        <ActivityItem icon={Handshake} color="text-amber-400" title="Fechamentos do Dia" items={fechamentosDia} />

        {totalAtividades === 0 && (
          <p className="text-white/50 text-xs text-center py-4">Nenhuma atividade programada para hoje 🎉</p>
        )}
      </div>

      {/* Resumo IA */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-bold text-xs">Resumo do Agente Virtual</span>
        </div>
        {resumoIA ? (
          <div className="bg-white/10 rounded-lg p-3 text-white/90 text-xs leading-relaxed whitespace-pre-line">
            {resumoIA}
          </div>
        ) : (
          <Button
            onClick={gerarResumoIA}
            disabled={loadingIA}
            size="sm"
            className="bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 border border-cyan-400/30 text-xs"
          >
            {loadingIA ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Gerando...</> : <><Bot className="w-3 h-3 mr-1" /> Gerar Resumo do Dia</>}
          </Button>
        )}
      </div>
    </div>
  );
}