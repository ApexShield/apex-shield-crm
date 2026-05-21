import { CalendarCheck, Handshake, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return format(date, "dd/MM", { locale: ptBR });
}

function formatTime(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return format(date, "HH:mm");
}

function ListBlock({ title, icon: Icon, items, color, emptyMsg }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 shadow-lg border border-white/20 flex flex-col`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-white" />
        <h3 className="font-black text-sm text-white">{title}</h3>
        <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="flex-1 space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-white/60 text-xs text-center py-4">{emptyMsg}</p>
        ) : (
          items.slice(0, 10).map((item, idx) => (
            <div key={idx} className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-xs truncate">{item.nome}</p>
                <p className="text-white/70 text-[10px]">{formatDate(item.data)} {formatTime(item.data) && `• ${formatTime(item.data)}`}</p>
              </div>
              {item.extra && <span className="text-white/90 text-[10px] font-bold whitespace-nowrap">{item.extra}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ReunioesBlock({ compromissos, clientes, dataInicio, dataFim }) {
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.split("T")[0];
    return d >= dataInicio && d <= dataFim;
  };

  // Reuniões de Abordagem = compromissos tipo agendado com status AB Visita ou AB Fone
  const abordagens = compromissos.filter(c => 
    (c.tipo === "agendado") && 
    (c.status_origem === "AB Visita" || c.status_origem === "AB Fone" || !c.status_origem) &&
    inRange(c.data_inicio)
  ).map(c => ({ nome: c.cliente_nome || c.titulo, data: c.data_inicio }));

  // Reuniões de Fechamento = título começa com "F " ou "F" seguido de número (F2, F3, F4...), ou status_origem AB Fechamento
  const isFechamento = (c) => {
    const t = (c.titulo || "").trim();
    return /^F\s/i.test(t) || /^F\d/i.test(t) || c.status_origem === "AB Fechamento";
  };
  const fechamentos = compromissos.filter(c =>
    isFechamento(c) && inRange(c.data_inicio)
  ).map(c => ({ nome: c.cliente_nome || c.titulo, data: c.data_inicio }));

  // Propostas Fechadas = clientes com status Venda Feita no período
  const parseCurrency = (val) => {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  };

  const propostasFechadas = clientes
    .filter(c => c.status === "Venda Feita" && c.dados_apolice)
    .filter(c => {
      // Verificar se a venda foi feita no período (usando historico_status)
      const vendaEvt = (c.historico_status || []).find(h => h.para === "Venda Feita");
      if (vendaEvt) {
        // Converter data DD/MM/YYYY HH:mm para comparação
        const parts = vendaEvt.data?.split(" ")[0]?.split("/");
        if (parts?.length === 3) {
          const d = `${parts[2]}-${parts[1]}-${parts[0]}`;
          return d >= dataInicio && d <= dataFim;
        }
      }
      // Fallback: usar created_date
      return inRange(c.created_date);
    })
    .map(c => {
      const pa = parseCurrency(c.dados_apolice?.total_premio_iof);
      const periodo = c.dados_apolice?.periodo_cobertura ? `${c.dados_apolice.periodo_cobertura} anos` : "";
      const produto = c.dados_apolice?.produto || "";
      return {
        nome: c.nome,
        data: c.created_date,
        extra: pa > 0 ? `R$ ${pa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : produto || ""
      };
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ListBlock
        title="Reuniões de Abordagem"
        icon={CalendarCheck}
        items={abordagens}
        color="from-blue-500/80 to-blue-600/80"
        emptyMsg="Nenhuma abordagem no período"
      />
      <ListBlock
        title="Reuniões de Fechamento"
        icon={Handshake}
        items={fechamentos}
        color="from-amber-500/80 to-amber-600/80"
        emptyMsg="Nenhum fechamento no período"
      />
      <ListBlock
        title="Propostas Fechadas"
        icon={FileCheck}
        items={propostasFechadas}
        color="from-green-500/80 to-green-600/80"
        emptyMsg="Nenhuma proposta fechada no período"
      />
    </div>
  );
}