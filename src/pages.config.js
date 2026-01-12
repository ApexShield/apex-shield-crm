import BoasVindas from './pages/BoasVindas';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Leads from './pages/Leads';
import Usuarios from './pages/Usuarios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BoasVindas": BoasVindas,
    "GestaoUsuarios": GestaoUsuarios,
    "Leads": Leads,
    "Usuarios": Usuarios,
}

export const pagesConfig = {
    mainPage: "BoasVindas",
    Pages: PAGES,
    Layout: __Layout,
};