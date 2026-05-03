import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Only activate when at top of page (window scroll)
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    if (window.scrollY > 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    const dampened = Math.min(dy * 0.45, 110);
    setPullDistance(dampened);
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 8 || refreshing;

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center z-20 pointer-events-none transition-opacity lg:hidden"
        style={{
          top: 0,
          height: showIndicator ? `${Math.max(pullDistance, refreshing ? 44 : 0)}px` : 0,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div
          className={`w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
        >
          <RefreshCw className="w-4 h-4 text-white/80" />
        </div>
      </div>

      <div
        style={{
          transform: showIndicator && !refreshing
            ? `translateY(${pullDistance}px)`
            : refreshing
              ? "translateY(44px)"
              : "translateY(0)",
          transition: pulling.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}