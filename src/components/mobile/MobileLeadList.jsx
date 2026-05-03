import { useState, useEffect, useRef, useCallback } from "react";
import LeadCard from "./LeadCard";

const BATCH_SIZE = 30;
const LOAD_MORE_THRESHOLD = 200;

export default function MobileLeadList({ leads, selectedId, onSelect, onEdit, getStatusColor }) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Reset visible count when leads change (filter applied)
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [leads.length]);

  // IntersectionObserver to load more as user scrolls
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    if (visibleCount >= leads.length) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, leads.length));
        }
      },
      { rootMargin: `${LOAD_MORE_THRESHOLD}px` }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [visibleCount, leads.length]);

  const visibleLeads = leads.slice(0, visibleCount);

  if (leads.length === 0) {
    return <p className="text-center text-white/50 py-10 text-sm">Nenhum lead encontrado</p>;
  }

  return (
    <div className="space-y-1">
      {visibleLeads.map(cliente => (
        <LeadCard
          key={cliente.id}
          cliente={cliente}
          isSelected={selectedId === cliente.id}
          onClick={() => onSelect(cliente)}
          onDoubleClick={() => onEdit(cliente)}
          getStatusColor={getStatusColor}
        />
      ))}
      {visibleCount < leads.length && (
        <div ref={sentinelRef} className="flex items-center justify-center py-3">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-xs ml-2">{visibleCount} de {leads.length}</span>
        </div>
      )}
    </div>
  );
}