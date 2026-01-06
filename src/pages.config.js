import Leads from './pages/Leads';
import BoasVindas from './pages/BoasVindas';
import Usuarios from './pages/Usuarios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Leads": Leads,
    "BoasVindas": BoasVindas,
    "Usuarios": Usuarios,
}

export const pagesConfig = {
    mainPage: "Leads",
    Pages: PAGES,
    Layout: __Layout,
};