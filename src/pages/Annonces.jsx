
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Annonce } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Search, Check, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ statut: 'all', type_bien: 'all' });

  const loadAnnonces = async () => {
    setLoading(true);
    try {
      const [annoncesData, usersData] = await Promise.all([
        Annonce.list("-created_date"),
        User.list()
      ]);
      setAnnonces(annoncesData);
      
      // Créer un mapping email -> nom complet pour l'affichage
      const users = usersData.reduce((acc, user) => {
        acc[user.email] = user.full_name;
        return acc;
      }, {});
      setUserMap(users);

    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    loadAnnonces();
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const openGoogleMaps = (annonce) => {
    const address = [annonce.localisation_quartier, annonce.localisation_ville, 'Senegal'].filter(Boolean).join(', ');
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank');
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      await Annonce.delete(id);
      loadAnnonces();
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await Annonce.update(id, { statut: newStatus });
    loadAnnonces();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'disponible':
      case 'validée': // Legacy status
      case 'publiée': // Legacy status
        return <Badge className="bg-green-100 text-green-800 border border-green-200">✓ Disponible</Badge>;
      case 'en attente':
        return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">⏳ En attente</Badge>;
      case 'refusée':
        return <Badge className="bg-red-100 text-red-800 border border-red-200">✗ Refusée</Badge>;
      case 'expirée':
        return <Badge className="bg-slate-100 text-slate-800 border border-slate-200">⏰ Expirée</Badge>;
      case 'masquée':
        return <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">👁️ Masquée</Badge>;
      case 'réservé':
      case 'réservée': // Legacy status
        return <Badge className="bg-orange-100 text-orange-800 border border-orange-200">📋 Réservé</Badge>;
      case 'vendu':
      case 'vendue': // Legacy status
        return <Badge className="bg-purple-100 text-purple-800 border border-purple-200">💰 Vendu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredAnnonces = annonces.filter(annonce => {
    const searchMatch = annonce.titre.toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusMatch = true;
    if (filters.statut !== 'all') {
      if (filters.statut === 'disponible') {
        statusMatch = ['disponible', 'validée', 'publiée'].includes(annonce.statut);
      } else if (filters.statut === 'réservé') {
        statusMatch = ['réservé', 'réservée'].includes(annonce.statut);
      } else if (filters.statut === 'vendu') {
        statusMatch = ['vendu', 'vendue'].includes(annonce.statut);
      } else {
        statusMatch = annonce.statut === filters.statut;
      }
    }
    
    const typeMatch = filters.type_bien === 'all' || annonce.type_bien === filters.type_bien;
    return searchMatch && statusMatch && typeMatch;
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Gestion des Annonces</h1>
      
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Rechercher une annonce..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filters.statut} onValueChange={(v) => handleFilterChange('statut', v)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en attente">En attente</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="refusée">Refusée</SelectItem>
              <SelectItem value="expirée">Expirée</SelectItem>
              <SelectItem value="masquée">Masquée</SelectItem>
              <SelectItem value="réservé">Réservé</SelectItem>
              <SelectItem value="vendu">Vendu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type_bien} onValueChange={(v) => handleFilterChange('type_bien', v)}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Location - Vente">Location - Vente</SelectItem>
              <SelectItem value="Terrains à vendre">Terrains à vendre</SelectItem>
              <SelectItem value="Chambres à louer">Chambres à louer</SelectItem>
              <SelectItem value="Propriétés commerciales à vendre">Propriétés commerciales à vendre</SelectItem>
              <SelectItem value="Propriétés commerciales à louer">Propriétés commerciales à louer</SelectItem>
              <SelectItem value="Bureaux à louer">Bureaux à louer</SelectItem>
              <SelectItem value="Appartements à louer">Appartements à louer</SelectItem>
              <SelectItem value="Appartements à vendre">Appartements à vendre</SelectItem>
              <SelectItem value="Villas à vendre">Villas à vendre</SelectItem>
              <SelectItem value="Villas à louer">Villas à louer</SelectItem>
              <SelectItem value="Hangars à louer">Hangars à louer</SelectItem>
              <SelectItem value="Hangars à vendre">Hangars à vendre</SelectItem>
              <SelectItem value="Locations journalières">Locations journalières</SelectItem>
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
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Annonceur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnnonces.map((annonce) => {
                return (
                  <TableRow key={annonce.id}>
                    <TableCell>
                      {/* Vérification plus robuste pour l'image */}
                      {Array.isArray(annonce.images) && annonce.images.length > 0 && annonce.images[0] ? (
                        <img 
                          src={annonce.images[0]} 
                          alt={annonce.titre} 
                          className="h-16 w-16 object-cover rounded-md hover:opacity-80 transition-opacity cursor-pointer" 
                          onClick={() => openGoogleMaps(annonce)}
                          title="Cliquer pour voir sur Google Maps"
                        />
                      ) : (
                        <div 
                          className="h-16 w-16 rounded-md bg-slate-100 flex items-center justify-center text-center text-xs text-slate-500 p-1 cursor-pointer hover:bg-slate-200 transition-colors"
                          onClick={() => openGoogleMaps(annonce)}
                          title="Cliquer pour voir sur Google Maps"
                        >
                          Pas de photo disponible
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{annonce.titre}</div>
                      <div className="text-sm text-slate-500">{annonce.localisation_ville}, {annonce.localisation_quartier}</div>
                    </TableCell>
                    <TableCell className="text-sm">{userMap[annonce.created_by] || 'N/A'}</TableCell>
                     <TableCell className="text-sm">{format(new Date(annonce.created_date), "d MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell>{annonce.prix.toLocaleString('fr-FR')} CFA</TableCell>
                    <TableCell>{getStatusBadge(annonce.statut)}</TableCell>
                    <TableCell className="space-x-1">
                      {annonce.statut === 'en attente' && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(annonce.id, 'disponible')} title="Valider l'annonce">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(annonce.id, 'refusée')} title="Refuser l'annonce">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {(annonce.statut === 'disponible' || annonce.statut === 'validée' || annonce.statut === 'publiée') && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(annonce.id, 'masquée')} title="Masquer l'annonce">
                            <XCircle className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(annonce.id, 'réservé')} title="Marquer comme réservée">
                            <Check className="h-4 w-4 text-orange-600" />
                          </Button>
                        </>
                      )}
                      {(annonce.statut === 'réservé' || annonce.statut === 'réservée') && (
                        <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(annonce.id, 'vendu')} title="Marquer comme vendue">
                          <Check className="h-4 w-4 text-purple-600" />
                        </Button>
                      )}
                       <Link to={createPageUrl(`ModifierAnnonce?id=${annonce.id}`)}>
                          <Button size="icon" variant="ghost" title="Modifier l'annonce">
                            <Edit className="h-4 w-4" />
                          </Button>
                       </Link>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(annonce.id)} title="Supprimer l'annonce">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
