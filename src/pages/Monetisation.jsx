import React, { useState, useEffect, useCallback } from "react";
import { Tarif } from "@/api/entities";
import { Forfait } from "@/api/entities";
import { Coupon } from "@/api/entities";
import { Paiement } from "@/api/entities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, Tag, Gift, FileClock, Edit, Trash2, Plus, Download, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Formulaire pour créer/éditer un tarif
const TarifForm = ({ tarif, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: tarif?.nom || "",
    description: tarif?.description || "",
    type_tarif: tarif?.type_tarif || "publication_simple",
    prix: tarif?.prix || "",
    duree_jours: tarif?.duree_jours || "",
    actif: tarif?.actif !== undefined ? tarif.actif : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      prix: Number(formData.prix),
      duree_jours: formData.duree_jours ? Number(formData.duree_jours) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nom">Nom du tarif</Label>
        <Input
          id="nom"
          value={formData.nom}
          onChange={(e) => setFormData({...formData, nom: e.target.value})}
          placeholder="Ex: Annonce simple, Option urgente"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Description du service"
        />
      </div>
      <div>
        <Label htmlFor="type_tarif">Type de tarif</Label>
        <Select value={formData.type_tarif} onValueChange={(value) => setFormData({...formData, type_tarif: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publication_simple">Publication simple</SelectItem>
            <SelectItem value="publication_avant">Publication mise en avant</SelectItem>
            <SelectItem value="publication_urgente">Publication urgente</SelectItem>
            <SelectItem value="option_premium">Option premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prix">Prix (FCFA)</Label>
          <Input
            id="prix"
            type="number"
            value={formData.prix}
            onChange={(e) => setFormData({...formData, prix: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="duree_jours">Durée (jours)</Label>
          <Input
            id="duree_jours"
            type="number"
            value={formData.duree_jours}
            onChange={(e) => setFormData({...formData, duree_jours: e.target.value})}
            placeholder="Ex: 30"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="actif"
          checked={formData.actif}
          onCheckedChange={(checked) => setFormData({...formData, actif: checked})}
        />
        <Label htmlFor="actif">Tarif actif</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {tarif ? 'Modifier' : 'Créer'} le tarif
        </Button>
      </div>
    </form>
  );
};

// --- Section Gestion des Tarifs ---
const GestionTarifs = () => {
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTarif, setEditingTarif] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadTarifs = useCallback(async () => {
    setLoading(true);
    const data = await Tarif.list();
    setTarifs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTarifs();
  }, [loadTarifs]);

  const handleSaveTarif = async (data) => {
    try {
      if (editingTarif) {
        await Tarif.update(editingTarif.id, data);
      } else {
        await Tarif.create(data);
      }
      setIsDialogOpen(false);
      setEditingTarif(null);
      loadTarifs();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleEditTarif = (tarif) => {
    setEditingTarif(tarif);
    setIsDialogOpen(true);
  };

  const handleNewTarif = () => {
    setEditingTarif(null);
    setIsDialogOpen(true);
  };

  const handleToggleActif = async (tarif) => {
    await Tarif.update(tarif.id, { actif: !tarif.actif });
    loadTarifs();
  };
  
  const handleDelete = async (id) => {
    if(window.confirm("Voulez-vous vraiment supprimer ce tarif ?")) {
      await Tarif.delete(id);
      loadTarifs();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Tarifs des Annonces et Options</CardTitle>
            <CardDescription>Gérez les prix pour la publication d'annonces et les options premium.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewTarif}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau tarif
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTarif ? 'Modifier le tarif' : 'Créer un nouveau tarif'}
                </DialogTitle>
              </DialogHeader>
              <TarifForm
                tarif={editingTarif}
                onSave={handleSaveTarif}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prix (FCFA)</TableHead>
              <TableHead>Durée (jours)</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan="6" className="text-center"><Loader2 className="inline-block animate-spin"/></TableCell></TableRow>
            ) : (
              tarifs.map(tarif => (
                <TableRow key={tarif.id}>
                  <TableCell className="font-medium">{tarif.nom}</TableCell>
                  <TableCell className="capitalize">{tarif.type_tarif.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{tarif.prix.toLocaleString('fr-FR')}</TableCell>
                  <TableCell>{tarif.duree_jours || 'N/A'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={tarif.actif}
                      onCheckedChange={() => handleToggleActif(tarif)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleEditTarif(tarif)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(tarif.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Formulaire pour créer/éditer un forfait
const ForfaitForm = ({ forfait, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: forfait?.nom || "",
    description: forfait?.description || "",
    prix: forfait?.prix || "",
    periode: forfait?.periode || "mensuel",
    nombre_annonces_inclus: forfait?.nombre_annonces_inclus || "",
    options_premium_incluses: forfait?.options_premium_incluses || [],
    actif: forfait?.actif !== undefined ? forfait.actif : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      prix: Number(formData.prix),
      nombre_annonces_inclus: Number(formData.nombre_annonces_inclus)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nom">Nom du forfait</Label>
        <Input
          id="nom"
          value={formData.nom}
          onChange={(e) => setFormData({...formData, nom: e.target.value})}
          placeholder="Ex: Forfait Pro Mensuel"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Description du forfait"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="prix">Prix (FCFA)</Label>
          <Input
            id="prix"
            type="number"
            value={formData.prix}
            onChange={(e) => setFormData({...formData, prix: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="periode">Période</Label>
          <Select value={formData.periode} onValueChange={(value) => setFormData({...formData, periode: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensuel">Mensuel</SelectItem>
              <SelectItem value="annuel">Annuel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nombre_annonces_inclus">Nombre d'annonces</Label>
          <Input
            id="nombre_annonces_inclus"
            type="number"
            value={formData.nombre_annonces_inclus}
            onChange={(e) => setFormData({...formData, nombre_annonces_inclus: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="actif"
          checked={formData.actif}
          onCheckedChange={(checked) => setFormData({...formData, actif: checked})}
        />
        <Label htmlFor="actif">Forfait actif</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {forfait ? 'Modifier' : 'Créer'} le forfait
        </Button>
      </div>
    </form>
  );
};

// --- Section Gestion des Forfaits Pro ---
const GestionForfaits = () => {
  const [forfaits, setForfaits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingForfait, setEditingForfait] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadForfaits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Forfait.list();
      setForfaits(data);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadForfaits();
  }, [loadForfaits]);

  const handleSaveForfait = async (data) => {
    try {
      if (editingForfait) {
        await Forfait.update(editingForfait.id, data);
      } else {
        await Forfait.create(data);
      }
      setIsDialogOpen(false);
      setEditingForfait(null);
      loadForfaits();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleEditForfait = (forfait) => {
    setEditingForfait(forfait);
    setIsDialogOpen(true);
  };

  const handleNewForfait = () => {
    setEditingForfait(null);
    setIsDialogOpen(true);
  };

  const handleToggleActif = async (forfait) => {
    await Forfait.update(forfait.id, { actif: !forfait.actif });
    loadForfaits();
  };
  
  const handleDelete = async (id) => {
    if(window.confirm("Voulez-vous vraiment supprimer ce forfait ?")) {
      await Forfait.delete(id);
      loadForfaits();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Forfaits Professionnels</CardTitle>
            <CardDescription>Créez et gérez les abonnements pour les agents et agences.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewForfait}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau forfait
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingForfait ? 'Modifier le forfait' : 'Créer un nouveau forfait'}
                </DialogTitle>
              </DialogHeader>
              <ForfaitForm
                forfait={editingForfait}
                onSave={handleSaveForfait}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prix (FCFA)</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Annonces incluses</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan="6" className="text-center"><Loader2 className="inline-block animate-spin"/></TableCell></TableRow>
            ) : forfaits.length === 0 ? (
              <TableRow><TableCell colSpan="6" className="text-center text-slate-500">Aucun forfait créé</TableCell></TableRow>
            ) : (
              forfaits.map(forfait => (
                <TableRow key={forfait.id}>
                  <TableCell className="font-medium">{forfait.nom}</TableCell>
                  <TableCell>{forfait.prix.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="capitalize">{forfait.periode}</TableCell>
                  <TableCell>{forfait.nombre_annonces_inclus}</TableCell>
                  <TableCell>
                    <Switch
                      checked={forfait.actif}
                      onCheckedChange={() => handleToggleActif(forfait)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleEditForfait(forfait)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(forfait.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Formulaire pour créer/éditer un coupon
const CouponForm = ({ coupon, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    description: coupon?.description || "",
    type_reduction: coupon?.type_reduction || "pourcentage",
    valeur: coupon?.valeur || "",
    date_expiration: coupon?.date_expiration || "",
    limite_utilisation: coupon?.limite_utilisation || "",
    actif: coupon?.actif !== undefined ? coupon.actif : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      valeur: Number(formData.valeur),
      limite_utilisation: formData.limite_utilisation ? Number(formData.limite_utilisation) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Code promo</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
          placeholder="Ex: BIENVENUE10"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Description du coupon"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type_reduction">Type de réduction</Label>
          <Select value={formData.type_reduction} onValueChange={(value) => setFormData({...formData, type_reduction: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
              <SelectItem value="fixe">Montant fixe (FCFA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="valeur">
            Valeur {formData.type_reduction === 'pourcentage' ? '(%)' : '(FCFA)'}
          </Label>
          <Input
            id="valeur"
            type="number"
            value={formData.valeur}
            onChange={(e) => setFormData({...formData, valeur: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date_expiration">Date d'expiration</Label>
          <Input
            id="date_expiration"
            type="date"
            value={formData.date_expiration}
            onChange={(e) => setFormData({...formData, date_expiration: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="limite_utilisation">Limite d'utilisation</Label>
          <Input
            id="limite_utilisation"
            type="number"
            value={formData.limite_utilisation}
            onChange={(e) => setFormData({...formData, limite_utilisation: e.target.value})}
            placeholder="Illimité si vide"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="actif"
          checked={formData.actif}
          onCheckedChange={(checked) => setFormData({...formData, actif: checked})}
        />
        <Label htmlFor="actif">Coupon actif</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {coupon ? 'Modifier' : 'Créer'} le coupon
        </Button>
      </div>
    </form>
  );
};

// --- Section Gestion des Coupons ---
const GestionCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Coupon.list();
      setCoupons(data);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleSaveCoupon = async (data) => {
    try {
      if (editingCoupon) {
        await Coupon.update(editingCoupon.id, data);
      } else {
        await Coupon.create(data);
      }
      setIsDialogOpen(false);
      setEditingCoupon(null);
      loadCoupons();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleNewCoupon = () => {
    setEditingCoupon(null);
    setIsDialogOpen(true);
  };

  const handleToggleActif = async (coupon) => {
    await Coupon.update(coupon.id, { actif: !coupon.actif });
    loadCoupons();
  };
  
  const handleDelete = async (id) => {
    if(window.confirm("Voulez-vous vraiment supprimer ce coupon ?")) {
      await Coupon.delete(id);
      loadCoupons();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Coupons de Promotion</CardTitle>
            <CardDescription>Créez des codes de réduction pour vos campagnes marketing.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewCoupon}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Modifier le coupon' : 'Créer un nouveau coupon'}
                </DialogTitle>
              </DialogHeader>
              <CouponForm
                coupon={editingCoupon}
                onSave={handleSaveCoupon}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan="7" className="text-center"><Loader2 className="inline-block animate-spin"/></TableCell></TableRow>
            ) : coupons.length === 0 ? (
              <TableRow><TableCell colSpan="7" className="text-center text-slate-500">Aucun coupon créé</TableCell></TableRow>
            ) : (
              coupons.map(coupon => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell className="capitalize">{coupon.type_reduction}</TableCell>
                  <TableCell>
                    {coupon.type_reduction === 'pourcentage' ? `${coupon.valeur}%` : `${coupon.valeur.toLocaleString('fr-FR')} FCFA`}
                  </TableCell>
                  <TableCell>
                    {coupon.utilisations_actuelles || 0}
                    {coupon.limite_utilisation && ` / ${coupon.limite_utilisation}`}
                  </TableCell>
                  <TableCell>
                    {coupon.date_expiration ? format(new Date(coupon.date_expiration), "d MMM yyyy", { locale: fr }) : 'Aucune'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.actif}
                      onCheckedChange={() => handleToggleActif(coupon)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleEditCoupon(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Section Historique des Paiements ---
const HistoriquePaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaiements = async () => {
      try {
        const data = await Paiement.list('-created_date');
        setPaiements(data);
      } catch (error) {
        console.error("Erreur de chargement:", error);
      }
      setLoading(false);
    };
    loadPaiements();
  }, []);
  
  const exportToCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Produit', 'Montant', 'Statut', 'Coupon', 'Référence'];
    const rows = paiements.map(p => [
      format(new Date(p.created_date), 'yyyy-MM-dd HH:mm'),
      p.user_email,
      p.produit_nom,
      p.montant,
      p.statut,
      p.coupon_applique || 'N/A',
      p.reference_externe
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historique_paiements.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Historique des Paiements</CardTitle>
            <CardDescription>Consultez toutes les transactions effectuées sur la plateforme.</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4"/>
            Exporter en CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Montant (FCFA)</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
              <TableRow><TableCell colSpan="5" className="text-center"><Loader2 className="inline-block animate-spin"/></TableCell></TableRow>
            ) : paiements.length === 0 ? (
              <TableRow><TableCell colSpan="5" className="text-center text-slate-500">Aucun paiement enregistré</TableCell></TableRow>
            ) : (
                paiements.map(p => (
                    <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.created_date), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                        <TableCell>{p.user_email}</TableCell>
                        <TableCell>{p.produit_nom}</TableCell>
                        <TableCell className="font-medium">{p.montant.toLocaleString('fr-FR')}</TableCell>
                        <TableCell><Badge variant={p.statut === 'réussi' ? 'default' : 'destructive'} className={p.statut === 'réussi' ? 'bg-green-600' : ''}>{p.statut}</Badge></TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Composant principal de la page ---
export default function Monetisation() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Monétisation</h1>
      <Tabs defaultValue="tarifs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="tarifs"><CreditCard className="mr-2 h-4 w-4" /> Tarifs</TabsTrigger>
          <TabsTrigger value="forfaits"><Tag className="mr-2 h-4 w-4" /> Forfaits Pro</TabsTrigger>
          <TabsTrigger value="coupons"><Gift className="mr-2 h-4 w-4" /> Coupons Promo</TabsTrigger>
          <TabsTrigger value="historique"><FileClock className="mr-2 h-4 w-4" /> Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tarifs" className="mt-4">
            <GestionTarifs />
        </TabsContent>
        <TabsContent value="forfaits" className="mt-4">
            <GestionForfaits />
        </TabsContent>
        <TabsContent value="coupons" className="mt-4">
            <GestionCoupons />
        </TabsContent>
        <TabsContent value="historique" className="mt-4">
            <HistoriquePaiements />
        </TabsContent>
      </Tabs>
    </div>
  );
}