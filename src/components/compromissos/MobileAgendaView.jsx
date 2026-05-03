import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Clock, ChevronRight, ChevronLeft, MapPin, Video, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { format, isSameDay, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_LABELS = {
  agendado: "Agendado",
  delay: "Delay",
  reuniao_realizada: "Reunião",
  venda_feita: "Venda",
  pessoal: "Pessoal",
  avanti: "Avanti",
};

function EventCard({ event, onClick }) {
  const start = new Date(event.data_inicio);
  const end = new Date(event.data_fim);
  const validStart = !isNaN(start.getTime());
  const validEnd = !isNaN(end.getTime());

  // Calculate duration in minutes
  const durationMin = validStart && validEnd
    ? Math.round((end - start) / 60000)
    : 60;
  const durationLabel = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 > 0 ? durationMin % 60 + "min" : ""}`
    : `${durationMin}min`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] no-select"
      style={{ background: `linear-gradient(135deg, ${event.cor || '#3b82f6'}22, ${event.cor || '#3b82f6'}08)` }}
    >
      <div className="flex items-stretch">
        {/* Color bar */}
        <div className="w-1.5 flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: event.cor || '#3b82f6' }} />
        
        <div className="flex-1 px-3.5 py-3 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm truncate flex-1">{event.titulo}</span>
            {event.email_participante && event.convidado_confirmou && (
              <span className="bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            )}
            {event.email_participante && event.convidado_recusou && (
              <span className="bg-red-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-sm">
                <XCircle className="w-3 h-3 text-white" />
              </span>
            )}
            {event.email_participante && !event.convidado_confirmou && !event.convidado_recusou && (
              <span className="bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Clock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>

          {/* Time + duration */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">
              {validStart && format(start, "HH:mm")} – {validEnd && format(end, "HH:mm")}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">{durationLabel}</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {event.modalidade === "online" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                <Video className="w-2.5 h-2.5" /> Online
              </span>
            )}
            {event.modalidade === "presencial" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" /> Presencial
              </span>
            )}
            {event.cliente_nome && (
              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                👤 {event.cliente_nome}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center px-2 flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </button>
  );
}

export default function MobileAgendaView({
  weekDays,
  mobileDayIndex,
  setMobileDayIndex,
  compromissos,
  currentWeekStart,
  setCurrentWeekStart,
  onEditEvent,
  onAddEvent,
}) {
  const mobileDay = weekDays[mobileDayIndex] || weekDays[0];

  const mobileDayEvents = useMemo(() => {
    if (!mobileDay) return [];
    return compromissos
      .filter((c) => {
        if (!c.data_inicio) return false;
        const cs = new Date(c.data_inicio);
        if (isNaN(cs.getTime())) return false;
        return isSameDay(cs, mobileDay);
      })
      .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
  }, [compromissos, mobileDay]);

  // Group events by time of day
  const { morning, afternoon, evening } = useMemo(() => {
    const m = [], a = [], e = [];
    mobileDayEvents.forEach((ev) => {
      const h = new Date(ev.data_inicio).getHours();
      if (h < 12) m.push(ev);
      else if (h < 18) a.push(ev);
      else e.push(ev);
    });
    return { morning: m, afternoon: a, evening: e };
  }, [mobileDayEvents]);

  const today = new Date();

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <button
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          className="p-2 rounded-xl bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="text-center">
          <span className="text-white font-bold text-sm">
            {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
          </span>
        </div>
        <button
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          className="p-2 rounded-xl bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Day selector strip */}
      <div className="flex gap-1 px-2 py-2">
        {weekDays.map((day, i) => {
          const isSelected = mobileDayIndex === i;
          const isToday = isSameDay(day, today);
          const dayEvents = compromissos.filter((c) => {
            if (!c.data_inicio) return false;
            const cs = new Date(c.data_inicio);
            return !isNaN(cs.getTime()) && isSameDay(cs, day);
          });

          return (
            <button
              key={i}
              onClick={() => setMobileDayIndex(i)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all no-select ${
                isSelected
                  ? "bg-gradient-to-b from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                  : isToday
                  ? "bg-white/10 ring-1 ring-indigo-400/30"
                  : "bg-white/[0.03]"
              }`}
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  isSelected ? "text-indigo-200" : "text-slate-500"
                }`}
              >
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span
                className={`text-lg font-black leading-tight mt-0.5 ${
                  isSelected ? "text-white" : isToday ? "text-indigo-300" : "text-slate-300"
                }`}
              >
                {format(day, "d")}
              </span>
              {/* Dot indicator for events */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div
                      key={j}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isSelected ? "#fff" : ev.cor || "#6366f1" }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      {!isSameDay(mobileDay, today) && (
        <div className="px-3 pb-1">
          <button
            onClick={() => {
              setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
              const dayOfWeek = today.getDay();
              setMobileDayIndex(dayOfWeek === 0 ? 6 : dayOfWeek - 1);
            }}
            className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full"
          >
            ← Voltar para hoje
          </button>
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-1 space-y-4">
        {mobileDayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <CalendarDays className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium text-sm">Nenhum compromisso</p>
            <p className="text-slate-600 text-xs mt-0.5">
              {format(mobileDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <>
            {/* Date header */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {format(mobileDay, "EEEE, d MMM", { locale: ptBR })}
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                {mobileDayEvents.length} {mobileDayEvents.length === 1 ? "evento" : "eventos"}
              </span>
            </div>

            {/* Morning */}
            {morning.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest px-1">
                  ☀️ Manhã
                </span>
                {morning.map((ev) => (
                  <EventCard key={ev.id} event={ev} onClick={() => onEditEvent(ev)} />
                ))}
              </div>
            )}

            {/* Afternoon */}
            {afternoon.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-orange-400/70 uppercase tracking-widest px-1">
                  🌤️ Tarde
                </span>
                {afternoon.map((ev) => (
                  <EventCard key={ev.id} event={ev} onClick={() => onEditEvent(ev)} />
                ))}
              </div>
            )}

            {/* Evening */}
            {evening.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest px-1">
                  🌙 Noite
                </span>
                {evening.map((ev) => (
                  <EventCard key={ev.id} event={ev} onClick={() => onEditEvent(ev)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Add button */}
        <Button
          onClick={onAddEvent}
          variant="outline"
          className="w-full border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-11 text-xs font-semibold gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar compromisso
        </Button>
      </div>
    </div>
  );
}