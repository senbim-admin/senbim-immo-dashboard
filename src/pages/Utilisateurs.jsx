
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { Annonce } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  UserX,
  UserCheck,
  Search,
  Mail,
  Phone,
  BadgeCheck,
  AlertTriangle,
  MapPin,
  CalendarDays
} from "lucide-react";

const regionsSenegal = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou",
  "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda",
  "Thiès", "Ziguinchor"
];

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ statut: 'all', type: 'all', region: 'all' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, annoncesData] = await Promise.all([
        User.list("-created_date"),
        Annonce.list(),
      ]);

      const annoncesCount = annoncesData.reduce((acc, annonce) => {
        if(annonce.created_by) {
            acc[annonce.created_by] = (acc[annonce.created_by] || 0) + 1;
        }
        return acc;
      }, {});
      
      const usersWithDefaults = usersData.map(user => ({
        ...user,
        annonces_count: annoncesCount[user.email] || 0,
        statut_compte: user.statut_compte || 'actif',
        type_compte: user.type_compte || 'particulier',
        email_verifie: user.email_verifie || false,
        telephone_verifie: user.telephone_verifie || false,
      }));

      setUsers(usersWithDefaults);
    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.statut_compte === 'actif' ? 'suspendu' : 'actif';
    try {
        await User.update(user.id, { statut_compte: newStatus });
        loadData(); // Recharger les données pour refléter le changement
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchMatch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filters.statut === 'all' || user.statut_compte === filters.statut;
      const typeMatch = filters.type === 'all' || user.type_compte === filters.type;
      // For region filter, if 'all' is selected, it matches all. Otherwise, exact match.
      const regionMatch = filters.region === 'all' || user.region === filters.region;
      return searchMatch && statusMatch && typeMatch && regionMatch;
    });
  }, [users, searchTerm, filters]);


  if (loading) return <div>Chargement des utilisateurs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Utilisateurs</h1>
          <p className="text-slate-600">Consultez, filtrez et gérez les comptes de la plateforme.</p>
        </div>
        <Badge variant="secondary" className="text-lg py-2 px-4">{filteredUsers.length} utilisateurs</Badge>
      </div>
      
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Rechercher par nom ou email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filters.region} onValueChange={(v) => handleFilterChange('region', v)}>
            <SelectTrigger><SelectValue placeholder="Filtrer par région" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {regionsSenegal.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.statut} onValueChange={(v) => handleFilterChange('statut', v)}>
            <SelectTrigger><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger><SelectValue placeholder="Filtrer par type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="particulier">Particulier</SelectItem>
              <SelectItem value="professionnel">Professionnel</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contact & Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Annonces</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                          <span className="font-bold">{user.full_name}</span>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className={`w-fit mt-1 ${user.role === 'admin' ? 'bg-slate-800 text-white' : ''}`}>
                            {user.role}
                          </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-4 w-4"/> 
                          <span>{user.email}</span>
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger>
                                  {user.email_verifie ? <BadgeCheck className="h-4 w-4 text-green-500"/> : <AlertTriangle className="h-4 w-4 text-orange-500"/>}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>{user.email_verifie ? "Email vérifié" : "Email non vérifié"}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </div>
                      {user.telephone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Phone className="h-4 w-4"/> 
                          <span>{user.telephone}</span>
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger>
                                  {user.telephone_verifie ? <BadgeCheck className="h-4 w-4 text-green-500"/> : <AlertTriangle className="h-4 w-4 text-orange-500"/>}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>{user.telephone_verifie ? "Téléphone vérifié" : "Téléphone non vérifié"}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </div>
                      )}
                      {user.region && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <MapPin className="h-4 w-4"/> 
                          <span>{user.region}</span>
                      </div>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{user.type_compte}</TableCell>
                    <TableCell className="text-center font-bold text-lg">{user.annonces_count}</TableCell>
                     <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                         <CalendarDays className="h-4 w-4"/>
                         {format(new Date(user.created_date), "d MMM yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={user.statut_compte === 'actif' ? "text-green-700 border-green-300 bg-green-50" : "text-red-700 border-red-300 bg-red-50"}>
                          {user.statut_compte === 'actif' ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => toggleUserStatus(user)}>
                              {user.statut_compte === 'actif' ? 
                                <UserX className="h-4 w-4 text-orange-600" /> : 
                                <UserCheck className="h-4 w-4 text-green-600" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.statut_compte === 'actif' ? 'Suspendre le compte' : 'Réactiver le compte'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
