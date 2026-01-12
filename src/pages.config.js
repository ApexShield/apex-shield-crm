import BoasVindas from './pages/BoasVindas';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Leads from './pages/Leads';
import Agenda from './pages/Agenda';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BoasVindas": BoasVindas,
    "GestaoUsuarios": GestaoUsuarios,
    "Leads": Leads,
    "Agenda": Agenda,
}

export const pagesConfig = {
    mainPage: "BoasVindas",
    Pages: PAGES,
    Layout: __Layout,
};