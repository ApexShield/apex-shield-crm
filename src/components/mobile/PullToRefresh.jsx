import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  // Prevent native overscroll only when pull gesture is active
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventOverscroll = (e) => {
      if (pulling.current && pullDistance > 0) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchmove", preventOverscroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventOverscroll);
  }, [pullDistance]);

  const handleTouchStart = useCallback((e) => {
    // Only activate when page is scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const dampened = Math.min(dy * 0.4, 110);
    setPullDistance(dampened);
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current && !pullDistance) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 8 || refreshing;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator — only on mobile */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center z-20 pointer-events-none lg:hidden"
        style={{
          top: 0,
          height: showIndicator ? `${Math.max(pullDistance, refreshing ? 44 : 0)}px` : "0px",
          opacity: showIndicator ? 1 : 0,
          transition: pulling.current ? "opacity 0.15s" : "all 0.3s ease-out",
        }}
      >
        <div
          className={`w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
        >
          <RefreshCw className="w-4 h-4 text-white/80" />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: showIndicator
            ? `translateY(${refreshing ? 44 : pullDistance}px)`
            : "translateY(0)",
          transition: pulling.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}