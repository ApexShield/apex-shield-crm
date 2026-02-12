/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Aniversariantes from './pages/Aniversariantes';
import BoasVindas from './pages/BoasVindas';
import CalculadoraRapida from './pages/CalculadoraRapida';
import Compromissos from './pages/Compromissos';
import GestaoCustos from './pages/GestaoCustos';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Home from './pages/Home';
import Leads from './pages/Leads';
import Organograma from './pages/Organograma';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import TermosServico from './pages/TermosServico';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Aniversariantes": Aniversariantes,
    "BoasVindas": BoasVindas,
    "CalculadoraRapida": CalculadoraRapida,
    "Compromissos": Compromissos,
    "GestaoCustos": GestaoCustos,
    "GestaoUsuarios": GestaoUsuarios,
    "Home": Home,
    "Leads": Leads,
    "Organograma": Organograma,
    "PoliticaPrivacidade": PoliticaPrivacidade,
    "TermosServico": TermosServico,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};