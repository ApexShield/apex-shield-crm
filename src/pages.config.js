import Agenda from './pages/Agenda';
import BoasVindas from './pages/BoasVindas';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Leads from './pages/Leads';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "BoasVindas": BoasVindas,
    "GestaoUsuarios": GestaoUsuarios,
    "Leads": Leads,
}

export const pagesConfig = {
    mainPage: "BoasVindas",
    Pages: PAGES,
    Layout: __Layout,
};