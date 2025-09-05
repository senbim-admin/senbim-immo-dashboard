
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Categorie } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  User as UserIcon,
  Tag,
  MapPin,
  FileText,
  Bell,
  BookOpen,
  Database,
  Save,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";

// Sous-composant pour gérer les catégories
const GestionCategories = ({ type, titre }) => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const loadItems = async () => {
    const data = await Categorie.filter({ type: type });
    setItems(data);
  };

  useEffect(() => {
    loadItems();
  }, [type]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await Categorie.create({ nom: newItemName, type: type, actif: true });
    setNewItemName("");
    loadItems();
  };
  
  const handleDeleteItem = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      await Categorie.delete(id);
      loadItems();
    }
  };

  const handleUpdateItem = async (id) => {
    if (!editingName.trim()) return;
    await Categorie.update(id, { nom: editingName });
    setEditingId(null);
    setEditingName("");
    loadItems();
  };
  
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingName(item.nom);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Nouveau ${titre.toLowerCase().slice(0, -1)}...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <Button onClick={handleAddItem}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
              {editingId === item.id ? (
                <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
              ) : (
                <span>{item.nom}</span>
              )}
              <div className="flex gap-1">
                {editingId === item.id ? (
                   <Button size="sm" onClick={() => handleUpdateItem(item.id)}>Enregistrer</Button>
                ) : (
                   <Button size="icon" variant="ghost" onClick={() => startEditing(item)}><Edit className="h-4 w-4" /></Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Sous-composant pour gérer les localisations
const GestionLocalisations = ({ type, titre }) => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    try {
      const data = await Categorie.filter({ type: type });
      setItems(data);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, [type]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setLoading(true);
    try {
      await Categorie.create({ nom: newItemName, type: type, actif: true });
      setNewItemName("");
      await loadItems();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
    setLoading(false);
  };
  
  const handleDeleteItem = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      try {
        await Categorie.delete(id);
        await loadItems();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleUpdateItem = async (id) => {
    if (!editingName.trim()) return;
    try {
      await Categorie.update(id, { nom: editingName });
      setEditingId(null);
      setEditingName("");
      await loadItems();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };
  
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingName(item.nom);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Nouvelle ${titre.toLowerCase().endsWith('s') ? titre.toLowerCase().slice(0, -1) : titre.toLowerCase()}...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleAddItem} disabled={loading || !newItemName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucun élément ajouté pour le moment</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                {editingId === item.id ? (
                  <Input 
                    value={editingName} 
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateItem(item.id);
                      }
                    }}
                  />
                ) : (
                  <span>{item.nom}</span>
                )}
                <div className="flex gap-1">
                  {editingId === item.id ? (
                     <Button size="sm" onClick={() => handleUpdateItem(item.id)}>
                       Enregistrer
                     </Button>
                  ) : (
                     <Button size="icon" variant="ghost" onClick={() => startEditing(item)}>
                       <Edit className="h-4 w-4" />
                     </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Parametres() {
  const [user, setUser] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    nouvelles_annonces: true,
    nouveaux_utilisateurs: true,
    signalements: true,
    paiements: true,
    messages_admin: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Charger les paramètres de notification depuis l'utilisateur
      if (currentUser && currentUser.notification_settings) {
        setNotificationSettings(currentUser.notification_settings);
      }
    };
    fetchUser();
  }, []);

  const handleNotificationChange = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    
    // Sauvegarder dans le profil utilisateur
    try {
      await User.updateMyUserData({ 
        notification_settings: newSettings 
      });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      // Optionally, revert the state or show an error message to the user
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Paramètres</h1>

      <Tabs defaultValue="compte" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-4">
          <TabsTrigger value="compte"><UserIcon className="h-4 w-4 mr-1 md:hidden" /> Compte</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-1 md:hidden" /> Catégories</TabsTrigger>
          <TabsTrigger value="localisations"><MapPin className="h-4 w-4 mr-1 md:hidden" /> Localisations</TabsTrigger>
          <TabsTrigger value="annonces"><FileText className="h-4 w-4 mr-1 md:hidden" /> Annonces</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1 md:hidden" /> Notifications</TabsTrigger>
          <TabsTrigger value="contenu"><BookOpen className="h-4 w-4 mr-1 md:hidden" /> Contenu</TabsTrigger>
          <TabsTrigger value="donnees"><Database className="h-4 w-4 mr-1 md:hidden" /> Données</TabsTrigger>
        </TabsList>

        <TabsContent value="compte">
          <Card>
            <CardHeader><CardTitle>Paramètres du compte</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adresse e-mail</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div>
                <Label>Changer le mot de passe</Label>
                <p className="text-sm text-slate-500">
                  La gestion du mot de passe se fait via votre fournisseur de connexion (ex: Google).
                </p>
              </div>
              <Button variant="destructive">Déconnexion de tous les appareils</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
           <GestionCategories type="type_bien" titre="Types de biens" />
           <GestionCategories type="tag" titre="Tags personnalisés (Ex: Neuf, Meublé)" />
        </TabsContent>
        
        <TabsContent value="localisations" className="space-y-4">
          <GestionLocalisations type="ville" titre="Villes" />
          <GestionLocalisations type="quartier" titre="Quartiers populaires" />
          
          <Card>
            <CardHeader>
              <CardTitle>Configuration des cartes</CardTitle>
              <CardDescription>Paramètres d'affichage pour la géolocalisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Activer l'affichage des cartes</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Zoom par défaut</Label>
                <Select defaultValue="12">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Ville (10)</SelectItem>
                    <SelectItem value="12">Quartier (12)</SelectItem>
                    <SelectItem value="15">Rue (15)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Centre par défaut</Label>
                <Input placeholder="Dakar, Sénégal" defaultValue="Dakar, Sénégal" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annonces">
          <Card>
            <CardHeader><CardTitle>Paramètres des annonces</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Nombre maximum de photos par annonce</Label>
                    <Input type="number" defaultValue="10" className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                    <Label>Durée de publication par défaut (jours)</Label>
                    <Input type="number" defaultValue="30" className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                    <Label>Activer la modération automatique des annonces</Label>
                    <Switch />
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications par email</CardTitle>
                <CardDescription>Configurez les notifications que vous souhaitez recevoir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nouvelles annonces</Label>
                    <p className="text-sm text-slate-500">Recevoir un email lors de la publication d'une nouvelle annonce</p>
                  </div>
                  <Switch
                    checked={notificationSettings.nouvelles_annonces}
                    onCheckedChange={(value) => handleNotificationChange('nouvelles_annonces', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nouveaux utilisateurs</Label>
                    <p className="text-sm text-slate-500">Recevoir un email lors de l'inscription d'un nouvel utilisateur</p>
                  </div>
                  <Switch
                    checked={notificationSettings.nouveaux_utilisateurs}
                    onCheckedChange={(value) => handleNotificationChange('nouveaux_utilisateurs', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Signalements</Label>
                    <p className="text-sm text-slate-500">Recevoir un email en cas de signalement</p>
                  </div>
                  <Switch
                    checked={notificationSettings.signalements}
                    onCheckedChange={(value) => handleNotificationChange('signalements', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Paiements</Label>
                    <p className="text-sm text-slate-500">Recevoir un email lors des transactions</p>
                  </div>
                  <Switch
                    checked={notificationSettings.paiements}
                    onCheckedChange={(value) => handleNotificationChange('paiements', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Messages administratifs</Label>
                    <p className="text-sm text-slate-500">Recevoir les communications importantes</p>
                  </div>
                  <Switch
                    checked={notificationSettings.messages_admin}
                    onCheckedChange={(value) => handleNotificationChange('messages_admin', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fréquence des notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Résumé quotidien</Label>
                  <Select defaultValue="matin">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desactive">Désactivé</SelectItem>
                      <SelectItem value="matin">Matin (8h)</SelectItem>
                      <SelectItem value="soir">Soir (18h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Rapport hebdomadaire</Label>
                  <Select defaultValue="lundi">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desactive">Désactivé</SelectItem>
                      <SelectItem value="lundi">Lundi</SelectItem>
                      <SelectItem value="vendredi">Vendredi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contenu">
            <Card>
                <CardHeader><CardTitle>Textes et mentions personnalisables</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Mentions légales</Label>
                        <Textarea rows={5} placeholder="Entrez vos mentions légales ici..."/>
                    </div>
                     <div>
                        <Label>Conditions d'utilisation</Label>
                        <Textarea rows={5} placeholder="Entrez vos conditions d'utilisation ici..."/>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="donnees">
            <Card>
                <CardHeader><CardTitle>Sauvegarde et données</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <Button>Exporter les annonces (CSV)</Button>
                   <Button>Exporter les utilisateurs (CSV)</Button>
                   <p className="text-sm text-slate-500">La connexion aux services externes (Google Maps, etc.) se gère dans l'espace de travail.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
