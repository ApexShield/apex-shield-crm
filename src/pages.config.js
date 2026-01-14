import Agenda from './pages/Agenda';
import Aniversariantes from './pages/Aniversariantes';
import BoasVindas from './pages/BoasVindas';
import GestaoCustos from './pages/GestaoCustos';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Leads from './pages/Leads';
import Organograma from './pages/Organograma';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "Aniversariantes": Aniversariantes,
    "BoasVindas": BoasVindas,
    "GestaoCustos": GestaoCustos,
    "GestaoUsuarios": GestaoUsuarios,
    "Leads": Leads,
    "Organograma": Organograma,
}

export const pagesConfig = {
    mainPage: "BoasVindas",
    Pages: PAGES,
    Layout: __Layout,
};