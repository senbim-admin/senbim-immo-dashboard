
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Annonce } from "@/api/entities";
import { User } from "@/api/entities";
import StatCard from "../components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Users,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, enAttente: 0, disponible: 0, utilisateurs: 0 });
  const [recentAnnonces, setRecentAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annoncesData, usersData] = await Promise.all([
          Annonce.list("-created_date"),
          User.list()
        ]);
        
        setStats({
          total: annoncesData.length,
          enAttente: annoncesData.filter(a => a.statut === 'en attente').length,
          disponible: annoncesData.filter(a => ['disponible', 'validée', 'publiée'].includes(a.statut)).length,
          utilisateurs: usersData.length,
        });

        setRecentAnnonces(annoncesData.slice(0, 5));
      } catch (error) {
        console.error("Erreur de chargement des données:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'disponible':
      case 'validée':
      case 'publiée':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'en attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'masquée':
        return <Badge className="bg-slate-100 text-slate-800">Masquée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Annonces Totales" value={stats.total} icon={Home} colorClass="bg-blue-500" />
        <StatCard title="Annonces Disponibles" value={stats.disponible} icon={CheckCircle} colorClass="bg-green-500" />
        <StatCard title="Annonces en Attente" value={stats.enAttente} icon={Clock} colorClass="bg-yellow-500" />
        <StatCard title="Utilisateurs" value={stats.utilisateurs} icon={Users} colorClass="bg-purple-500" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link to={createPageUrl("AjouterAnnonce")}>
          <Button className="w-full h-16 text-lg bg-slate-800 hover:bg-slate-700">
            <PlusCircle className="mr-2 h-6 w-6" /> Ajouter une annonce
          </Button>
        </Link>
        <Link to={createPageUrl("Utilisateurs")}>
          <Button variant="outline" className="w-full h-16 text-lg border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white">
            <Users className="mr-2 h-6 w-6" /> Gérer les utilisateurs
          </Button>
        </Link>
        <Link to={createPageUrl("Annonces")}>
          <Button variant="outline" className="w-full h-16 text-lg border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white">
            <Home className="mr-2 h-6 w-6" /> Voir toutes les annonces
          </Button>
        </Link>
      </div>

      {/* Recent Annonces */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Annonces récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAnnonces.map((annonce) => (
                <TableRow key={annonce.id}>
                  <TableCell className="font-medium">{annonce.titre}</TableCell>
                  <TableCell>{annonce.prix?.toLocaleString('fr-FR')} CFA</TableCell>
                  <TableCell>{getStatusBadge(annonce.statut)}</TableCell>
                  <TableCell>{new Date(annonce.created_date).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
