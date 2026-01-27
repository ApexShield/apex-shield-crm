import Agenda from './pages/Agenda';
import Aniversariantes from './pages/Aniversariantes';
import BoasVindas from './pages/BoasVindas';
import CalculadoraRapida from './pages/CalculadoraRapida';
import GestaoCustos from './pages/GestaoCustos';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Leads from './pages/Leads';
import Organograma from './pages/Organograma';
import Compromissos from './pages/Compromissos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "Aniversariantes": Aniversariantes,
    "BoasVindas": BoasVindas,
    "CalculadoraRapida": CalculadoraRapida,
    "GestaoCustos": GestaoCustos,
    "GestaoUsuarios": GestaoUsuarios,
    "Leads": Leads,
    "Organograma": Organograma,
    "Compromissos": Compromissos,
}

export const pagesConfig = {
    mainPage: "BoasVindas",
    Pages: PAGES,
    Layout: __Layout,
};