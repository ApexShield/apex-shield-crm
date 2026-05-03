import { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Manages independent navigation stacks per bottom tab.
 * - Each tab remembers its last visited path.
 * - Tapping the active tab resets to its root page.
 * - Going "back" within a tab pops to previous page in that tab's stack.
 */

const TAB_ROOTS = {
  Leads: "/Leads",
  DashboardAtividades: "/DashboardAtividades",
  Compromissos: "/Compromissos",
  AgenteApex: "/AgenteApex",
};

// Which tab "owns" each non-root page (pages reachable from a tab)
const PAGE_TO_TAB = {
  // Leads sub-pages (none currently, but ready)
};

// Persistent across renders (module-level)
const tabStacks = {
  Leads: ["/Leads"],
  DashboardAtividades: ["/DashboardAtividades"],
  Compromissos: ["/Compromissos"],
  AgenteApex: ["/AgenteApex"],
};

// Which tab is currently active
let activeTab = "Leads";

export function getActiveTab() {
  return activeTab;
}

export function getTabRoot(tabPage) {
  return TAB_ROOTS[tabPage] || createPageUrl(tabPage);
}

export function findTabForPath(pathname) {
  // Direct match to a tab root
  for (const [tab, root] of Object.entries(TAB_ROOTS)) {
    if (pathname === root || pathname === createPageUrl(tab)) return tab;
  }
  // Check PAGE_TO_TAB mapping
  const pageName = pathname.replace("/", "");
  if (PAGE_TO_TAB[pageName]) return PAGE_TO_TAB[pageName];
  return null;
}

export default function useTabNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabPress = useCallback((tabPage) => {
    const tabRoot = TAB_ROOTS[tabPage] || `/${tabPage}`;
    const currentPath = location.pathname;

    if (currentPath === tabRoot || currentPath === createPageUrl(tabPage)) {
      // Already on this tab's root → scroll to top (reset behavior)
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Clear persisted state for this tab to "reset" the stack
      activeTab = tabPage;
      tabStacks[tabPage] = [tabRoot];
      return;
    }

    // Switch to this tab
    activeTab = tabPage;

    // Navigate to the last known page in this tab's stack, or root
    const stack = tabStacks[tabPage];
    const target = stack && stack.length > 0 ? stack[stack.length - 1] : tabRoot;
    navigate(target);
  }, [location.pathname, navigate]);

  // Track current path in the active tab's stack
  const trackNavigation = useCallback((pathname) => {
    const tab = findTabForPath(pathname);
    if (tab) {
      activeTab = tab;
      const stack = tabStacks[tab];
      if (!stack.includes(pathname)) {
        stack.push(pathname);
      }
    }
  }, []);

  const goBackInTab = useCallback(() => {
    const stack = tabStacks[activeTab];
    if (stack && stack.length > 1) {
      stack.pop();
      const prev = stack[stack.length - 1];
      navigate(prev);
    } else {
      navigate(-1);
    }
  }, [navigate]);

  return { handleTabPress, trackNavigation, goBackInTab, activeTab };
}