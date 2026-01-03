import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Clientes from './pages/Clientes';
import TicketDetalhes from './pages/TicketDetalhes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Tickets": Tickets,
    "Clientes": Clientes,
    "TicketDetalhes": TicketDetalhes,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};