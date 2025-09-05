
import React, { useState, useEffect } from "react";
import { Annonce } from "@/api/entities";
import { User } from "@/api/entities";
import { Paiement } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  Users,
  Home,
  CreditCard,
  Calendar,
  MapPin,
  Eye,
  DollarSign
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend && (
              <Badge variant={trend === 'up' ? 'default' : 'secondary'} className={trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {trend === 'up' ? '+' : ''}{trendValue}%
              </Badge>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function Statistiques() {
  const [stats, setStats] = useState({
    totalAnnonces: 0,
    annoncesActives: 0,
    totalUtilisateurs: 0,
    nouveauxUtilisateurs: 0,
    revenuTotal: 0,
    revenuMoisCourant: 0
  });
  
  const [annonces, setAnnonces] = useState([]);
  const [users, setUsers] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('7j');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annoncesData, usersData, paiementsData] = await Promise.all([
        Annonce.list('-created_date'),
        User.list('-created_date'),
        Paiement.list('-created_date')
      ]);

      setAnnonces(annoncesData);
      setUsers(usersData);
      setPaiements(paiementsData);

      // Calcul des statistiques globales
      const now = new Date();
      const startOfThisMonth = startOfMonth(now);
      const endOfThisMonth = endOfMonth(now);
      
      const nouveauxUtilisateursCeMois = usersData.filter(user => {
        const userDate = new Date(user.created_date);
        return userDate >= startOfThisMonth && userDate <= endOfThisMonth;
      }).length;

      const revenuTotal = paiementsData
        .filter(p => p.statut === 'réussi')
        .reduce((sum, p) => sum + p.montant, 0);

      const revenuMoisCourant = paiementsData
        .filter(p => {
          const paiementDate = new Date(p.created_date);
          return p.statut === 'réussi' && 
                 paiementDate >= startOfThisMonth && 
                 paiementDate <= endOfThisMonth;
        })
        .reduce((sum, p) => sum + p.montant, 0);

      setStats({
        totalAnnonces: annoncesData.length,
        annoncesActives: annoncesData.filter(a => a.statut === 'disponible').length,
        totalUtilisateurs: usersData.length,
        nouveauxUtilisateurs: nouveauxUtilisateursCeMois,
        revenuTotal,
        revenuMoisCourant
      });

    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    }
    setLoading(false);
  };

  // Données pour les graphiques
  const getAnnoncesParJour = () => {
    const jours = [];
    const nbJours = periode === '7j' ? 7 : periode === '30j' ? 30 : 90;
    
    for (let i = nbJours - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'dd/MM');
      const annoncesJour = annonces.filter(a => 
        format(new Date(a.created_date), 'dd/MM/yyyy') === format(date, 'dd/MM/yyyy')
      ).length;
      
      jours.push({
        date: dateStr,
        annonces: annoncesJour
      });
    }
    return jours;
  };

  const getAnnoncesParStatut = () => {
    const statuts = {};
    annonces.forEach(annonce => {
      const statut = annonce.statut;
      statuts[statut] = (statuts[statut] || 0) + 1;
    });
    
    return Object.entries(statuts).map(([statut, count], index) => ({
      statut: statut.charAt(0).toUpperCase() + statut.slice(1),
      count,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getAnnoncesParVille = () => {
    const villes = {};
    annonces.forEach(annonce => {
      const ville = annonce.localisation_ville;
      if (ville) {
        villes[ville] = (villes[ville] || 0) + 1;
      }
    });
    
    return Object.entries(villes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ville, count]) => ({ ville, count }));
  };

  const getAnnoncesParTypeBien = () => {
    const types = {};
    annonces.forEach(annonce => {
      const type = annonce.type_bien;
      if (type) {
        types[type] = (types[type] || 0) + 1;
      }
    });
    
    return Object.entries(types).map(([type, count], index) => ({
      type: type.length > 20 ? type.substring(0, 20) + '...' : type,
      count,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getRevenuParMois = () => {
    const mois = {};
    paiements
      .filter(p => p.statut === 'réussi')
      .forEach(paiement => {
        const moisAnnee = format(new Date(paiement.created_date), 'MM/yyyy');
        mois[moisAnnee] = (mois[moisAnnee] || 0) + paiement.montant;
      });
    
    return Object.entries(mois)
      .sort()
      .map(([mois, montant]) => ({
        mois,
        montant
      }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Statistiques</h1>
        <Select value={periode} onValueChange={setPeriode}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7j">7 jours</SelectItem>
            <SelectItem value="30j">30 jours</SelectItem>
            <SelectItem value="90j">90 jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Annonces" 
          value={stats.totalAnnonces.toLocaleString('fr-FR')} 
          icon={Home} 
          colorClass="bg-blue-500"
        />
        <StatCard 
          title="Annonces Actives" 
          value={stats.annoncesActives.toLocaleString('fr-FR')} 
          icon={Eye} 
          colorClass="bg-green-500"
        />
        <StatCard 
          title="Total Utilisateurs" 
          value={stats.totalUtilisateurs.toLocaleString('fr-FR')} 
          icon={Users} 
          colorClass="bg-purple-500"
        />
        <StatCard 
          title="Revenus Totaux" 
          value={`${stats.revenuTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA`} 
          icon={DollarSign} 
          colorClass="bg-yellow-500"
        />
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="annonces" className="w-full">
        <TabsList>
          <TabsTrigger value="annonces">Annonces</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="revenus">Revenus</TabsTrigger>
          <TabsTrigger value="geographie">Géographie</TabsTrigger>
        </TabsList>

        <TabsContent value="annonces" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolution des annonces */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Évolution des annonces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getAnnoncesParJour()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="annonces" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par statut */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getAnnoncesParStatut()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ statut, count }) => `${statut}: ${count}`}
                    >
                      {getAnnoncesParStatut().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Types de biens */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type de bien</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getAnnoncesParTypeBien()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilisateurs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nouveaux utilisateurs ce mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {stats.nouveauxUtilisateurs}
                  </div>
                  <p className="text-slate-600">Inscriptions en {format(new Date(), 'MMMM yyyy', { locale: fr })}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Croissance utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {((stats.nouveauxUtilisateurs / Math.max(stats.totalUtilisateurs - stats.nouveauxUtilisateurs, 1)) * 100).toFixed(1)}%
                  </div>
                  <p className="text-slate-600">Taux de croissance mensuel</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenus" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenus ce mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {stats.revenuMoisCourant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA
                  </div>
                  <p className="text-slate-600">Revenus en {format(new Date(), 'MMMM yyyy', { locale: fr })}</p>
                </div>
              </CardContent>
            </Card>

            {/* Evolution des revenus */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getRevenuParMois()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA`, 'Revenus']} />
                    <Line type="monotone" dataKey="montant" stroke="#82ca9d" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographie" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Top 10 des villes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getAnnoncesParVille()} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="ville" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
