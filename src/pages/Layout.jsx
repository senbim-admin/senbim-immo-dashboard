
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  LayoutDashboard,
  Home,
  Users,
  Settings,
  LogOut,
  Building,
  Menu,
  Shield,
  BarChart2,
  CreditCard,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Tableau de bord", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Annonces", url: createPageUrl("Annonces"), icon: Home },
  { title: "Utilisateurs", url: createPageUrl("Utilisateurs"), icon: Users },
  { title: "Messagerie", url: createPageUrl("Messagerie"), icon: MessageSquare },
  { title: "Monétisation", url: createPageUrl("Monetisation"), icon: CreditCard },
  { title: "Modération", url: createPageUrl("Moderation"), icon: Shield },
  { title: "Statistiques", url: createPageUrl("Statistiques"), icon: BarChart2 },
  { title: "Support", url: createPageUrl("Support"), icon: LifeBuoy },
  { title: "Paramètres", url: createPageUrl("Parametres"), icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await User.logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 p-4">
        <div className="text-center bg-slate-800 p-10 rounded-xl shadow-2xl border border-slate-700">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-xl">
              <Building className="w-8 h-8 text-slate-900" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Senbim Immo</h1>
          <p className="text-slate-300 mb-6">Panneau d'administration</p>
          <Button
            onClick={() => User.login()}
            className="w-full bg-yellow-400 text-slate-900 font-bold hover:bg-yellow-500 h-12 text-lg"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Header */}
        <div className="flex items-center justify-center h-16 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold text-white">Senbim Immo</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                  location.pathname === item.url
                    ? "bg-yellow-400 text-slate-900 font-semibold"
                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4">
          <Button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-200"
            variant="ghost"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white shadow-sm lg:shadow-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6 lg:justify-end">
              <div className="flex items-center lg:hidden">
                <Button
                  onClick={() => setSidebarOpen(true)}
                  variant="ghost"
                  size="sm"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
