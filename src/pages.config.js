import Agenda from './pages/Agenda';
import BoasVindas from './pages/BoasVindas';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Leads from './pages/Leads';
import Organograma from './pages/Organograma';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "BoasVindas": BoasVindas,
    "GestaoUsuarios": GestaoUsuarios,
    "Leads": Leads,
    "Organograma": Organograma,
}

export const pagesConfig = {
    mainPage: "BoasVindas",
    Pages: PAGES,
    Layout: __Layout,
};