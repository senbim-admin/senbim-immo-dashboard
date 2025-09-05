
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Signalement } from "@/api/entities";
import { Annonce } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  UserX, 
  Trash2, 
  CheckCircle,
  Clock,
  Search,
  Calendar,
  MessageSquare,
  User as UserIcon,
  Home,
  Loader2,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AnnoncePreview = ({ annonce }) => (
    <div className="space-y-3">
        <h4 className="font-bold text-lg">{annonce.titre}</h4>
        {annonce.images && annonce.images[0] && <img src={annonce.images[0]} alt="Aperçu de l'annonce" className="rounded-md max-h-48 w-full object-cover"/>}
        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">{annonce.description?.substring(0, 200) || "Pas de description."}...</p>
        <p className="font-semibold text-xl">{annonce.prix?.toLocaleString('fr-FR')} CFA</p>
        <Link to={createPageUrl(`ModifierAnnonce?id=${annonce.id}`)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full">
                Voir l'annonce complète dans un nouvel onglet
            </Button>
        </Link>
    </div>
);

const UserPreview = ({ user }) => (
    <div className="space-y-3">
        <h4 className="font-bold text-lg">{user.full_name}</h4>
        <div className="text-sm text-slate-700 space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Téléphone:</strong> {user.telephone || 'Non fourni'}</p>
            <p><strong>Inscrit le:</strong> {format(new Date(user.created_date), "d MMM yyyy", { locale: fr })}</p>
        </div>
        <Badge variant="outline" className={user.statut_compte === 'actif' ? "text-green-700 border-green-300" : "text-red-700 border-red-300"}>
            Statut du compte : {user.statut_compte}
        </Badge>
    </div>
);


export default function Moderation() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [reportedContent, setReportedContent] = useState(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchReportedContent = async () => {
        if (!selectedSignalement) {
            setReportedContent(null);
            return;
        }

        setIsDialogLoading(true);
        try {
            let content = null;
            if (selectedSignalement.type_contenu === 'annonce') {
                const annonces = await Annonce.list();
                content = annonces.find(a => a.id === selectedSignalement.contenu_id);
                if (!content) {
                    setReportedContent({ error: "Annonce introuvable ou déjà supprimée." });
                    setIsDialogLoading(false);
                    return;
                }
            } else if (selectedSignalement.type_contenu === 'utilisateur') {
                const users = await User.list();
                content = users.find(u => u.id === selectedSignalement.contenu_id);
                if (!content) {
                    setReportedContent({ error: "Utilisateur introuvable ou déjà supprimé." });
                    setIsDialogLoading(false);
                    return;
                }
            }
            setReportedContent(content);
        } catch (error) {
            setReportedContent({ error: "Contenu introuvable ou déjà supprimé." });
        }
        setIsDialogLoading(false);
    };

    if(isDialogOpen) {
      fetchReportedContent();
    }
  }, [selectedSignalement, isDialogOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const signalementsData = await Signalement.list('-created_date');
      setSignalements(signalementsData);
    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    }
    setLoading(false);
  };

  const getStatusColor = (statut) => {
    const colors = {
      'nouveau': 'bg-red-100 text-red-800 border-red-200',
      'en cours de traitement': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'résolu': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'annonce': return <Home className="w-4 h-4" />;
      case 'utilisateur': return <UserIcon className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleUpdateStatut = async (id, newStatut) => {
    await Signalement.update(id, { statut: newStatut });
    setIsDialogOpen(false);
    loadData();
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir suspendre ce compte utilisateur ?")) {
      await User.update(userId, { statut_compte: 'suspendu' });
      await handleUpdateStatut(selectedSignalement.id, 'résolu');
    }
  };

  const handleRejectAnnonce = async (annonceId) => {
    if (window.confirm("Êtes-vous sûr de vouloir rejeter cette annonce ? Son statut sera changé à 'refusée'.")) {
      await Annonce.update(annonceId, { statut: 'refusée' });
      await handleUpdateStatut(selectedSignalement.id, 'résolu');
    }
  };

  const handleDeleteAnnonce = async (annonceId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette annonce ? Cette action est irréversible.")) {
      await Annonce.delete(annonceId);
      await handleUpdateStatut(selectedSignalement.id, 'résolu');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce compte utilisateur ? Cette action est irréversible.")) {
      await User.delete(userId);
      await handleUpdateStatut(selectedSignalement.id, 'résolu');
    }
  };

  const filteredSignalements = signalements.filter(signalement => {
    const searchMatch = signalement.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       signalement.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatut === "all" || signalement.statut === filterStatut;
    return searchMatch && statusMatch;
  });

  const stats = {
    nouveaux: signalements.filter(s => s.statut === 'nouveau').length,
    enCours: signalements.filter(s => s.statut === 'en cours de traitement').length,
    resolus: signalements.filter(s => s.statut === 'résolu').length,
    total: signalements.length
  };

  if (loading) {
    return <div className="p-8"><div className="animate-pulse">Chargement des données de modération...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Modération</h1>
          <p className="text-slate-600">Gestion des signalements et surveillance du contenu</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {stats.nouveaux} nouveaux
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            {stats.enCours} en cours
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {stats.resolus} résolus
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total signalements</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Nouveaux</p>
                <p className="text-2xl font-bold text-red-600">{stats.nouveaux}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Résolus</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolus}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>


      <Tabs defaultValue="signalements" className="w-full">
        <TabsList>
          <TabsTrigger value="signalements">Signalements actifs</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="signalements" className="space-y-4">
           <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher par motif ou détails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="nouveau">Nouveau</SelectItem>
                    <SelectItem value="en cours de traitement">En cours</SelectItem>
                    <SelectItem value="résolu">Résolu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Signalements ({filteredSignalements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Type</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Signalé par</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSignalements.map((signalement) => (
                      <TableRow key={signalement.id} className="hover:bg-slate-50">
                        <TableCell><div className="flex items-center gap-2">{getTypeIcon(signalement.type_contenu)}<span className="capitalize">{signalement.type_contenu}</span></div></TableCell>
                        <TableCell><p className="font-medium">{signalement.motif}</p></TableCell>
                        <TableCell>{signalement.signale_par_email}</TableCell>
                        <TableCell><div className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3" />{format(new Date(signalement.created_date), "d MMM yyyy", { locale: fr })}</div></TableCell>
                        <TableCell><Badge className={getStatusColor(signalement.statut)}>{signalement.statut}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedSignalement(signalement)}
                              >
                                <Eye className="w-4 h-4 mr-1" /> Examiner
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Examen du Signalement</DialogTitle>
                              </DialogHeader>
                              {isDialogLoading ? (
                                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div>
                              ) : (
                                <div className="grid md:grid-cols-2 gap-6 pt-4">
                                  {/* Left Col: Report and Actions */}
                                  <div className="space-y-4">
                                    <Card>
                                      <CardHeader><CardTitle>Détails du Signalement</CardTitle></CardHeader>
                                      <CardContent className="space-y-3 text-sm">
                                        <p><strong>Signalé par :</strong> {selectedSignalement?.signale_par_email}</p>
                                        <p><strong>Motif :</strong> {selectedSignalement?.motif}</p>
                                        <div><strong>Détails :</strong><p className="p-2 bg-slate-50 rounded-md mt-1">{selectedSignalement?.details || "Aucun détail"}</p></div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader><CardTitle>Actions de Modération</CardTitle></CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                          <Button onClick={() => handleUpdateStatut(selectedSignalement.id, 'en cours de traitement')} className="bg-yellow-500 hover:bg-yellow-600">
                                            <Clock className="w-4 h-4 mr-2"/>En cours
                                          </Button>
                                          <Button onClick={() => handleUpdateStatut(selectedSignalement.id, 'résolu')} className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle className="w-4 h-4 mr-2"/>Résolu (sans action)
                                          </Button>
                                        </div>
                                        
                                        {reportedContent && !reportedContent.error && selectedSignalement.type_contenu === 'annonce' && (
                                          <div className="border-t pt-3 space-y-2">
                                            <p className="text-sm font-medium text-slate-700">Actions pour cette annonce :</p>
                                            <div className="flex flex-wrap gap-2">
                                              <Button onClick={() => handleRejectAnnonce(reportedContent.id)} className="bg-orange-500 hover:bg-orange-600 text-white">
                                                <XCircle className="w-4 h-4 mr-2"/>Rejeter l'annonce
                                              </Button>
                                              <Button onClick={() => handleDeleteAnnonce(reportedContent.id)} variant="destructive">
                                                <Trash2 className="w-4 h-4 mr-2"/>Supprimer définitivement
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        {reportedContent && !reportedContent.error && selectedSignalement.type_contenu === 'utilisateur' && (
                                          <div className="border-t pt-3 space-y-2">
                                            <p className="text-sm font-medium text-slate-700">Actions pour cet utilisateur :</p>
                                            <div className="flex flex-wrap gap-2">
                                              <Button onClick={() => handleBlockUser(reportedContent.id)} className="bg-orange-500 hover:bg-orange-600 text-white">
                                                <UserX className="w-4 h-4 mr-2"/>Suspendre le compte
                                              </Button>
                                              <Button onClick={() => handleDeleteUser(reportedContent.id)} variant="destructive">
                                                <Trash2 className="w-4 h-4 mr-2"/>Supprimer définitivement
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>
                                  {/* Right Col: Reported content */}
                                  <div>
                                    <Card>
                                      <CardHeader><CardTitle>Contenu Signalé</CardTitle></CardHeader>
                                      <CardContent>
                                        {reportedContent && !reportedContent.error && selectedSignalement.type_contenu === 'annonce' && <AnnoncePreview annonce={reportedContent} />}
                                        {reportedContent && !reportedContent.error && selectedSignalement.type_contenu === 'utilisateur' && <UserPreview user={reportedContent} />}
                                        {(!reportedContent || reportedContent.error) && <p className="text-red-500 p-4 bg-red-50 rounded-md">{reportedContent?.error || "Impossible de charger le contenu."}</p>}
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique">
           <Card>
            <CardHeader>
              <CardTitle>Historique des actions de modération</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signalements
                    .filter(s => s.statut === 'résolu')
                    .map((signalement) => (
                    <TableRow key={signalement.id}>
                      <TableCell>
                        {format(new Date(signalement.updated_date || signalement.created_date), "d MMM yyyy à HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="capitalize">{signalement.type_contenu}</TableCell>
                      <TableCell>{signalement.motif}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Résolu</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
