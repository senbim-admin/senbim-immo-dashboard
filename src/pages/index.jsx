import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Annonces from "./Annonces";

import Agents from "./Agents";

import Messages from "./Messages";

import Utilisateurs from "./Utilisateurs";

import Parametres from "./Parametres";

import AjouterAnnonce from "./AjouterAnnonce";

import Monetisation from "./Monetisation";

import Moderation from "./Moderation";

import Statistiques from "./Statistiques";

import Support from "./Support";

import Messagerie from "./Messagerie";

import ModifierAnnonce from "./ModifierAnnonce";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Annonces: Annonces,
    
    Agents: Agents,
    
    Messages: Messages,
    
    Utilisateurs: Utilisateurs,
    
    Parametres: Parametres,
    
    AjouterAnnonce: AjouterAnnonce,
    
    Monetisation: Monetisation,
    
    Moderation: Moderation,
    
    Statistiques: Statistiques,
    
    Support: Support,
    
    Messagerie: Messagerie,
    
    ModifierAnnonce: ModifierAnnonce,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Annonces" element={<Annonces />} />
                
                <Route path="/Agents" element={<Agents />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Utilisateurs" element={<Utilisateurs />} />
                
                <Route path="/Parametres" element={<Parametres />} />
                
                <Route path="/AjouterAnnonce" element={<AjouterAnnonce />} />
                
                <Route path="/Monetisation" element={<Monetisation />} />
                
                <Route path="/Moderation" element={<Moderation />} />
                
                <Route path="/Statistiques" element={<Statistiques />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/Messagerie" element={<Messagerie />} />
                
                <Route path="/ModifierAnnonce" element={<ModifierAnnonce />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}