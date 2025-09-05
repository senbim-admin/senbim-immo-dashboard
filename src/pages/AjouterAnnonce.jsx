
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Annonce } from "@/api/entities";
import { Categorie } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Corrected syntax here
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, X } from "lucide-react";

export default function AjouterAnnonce() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    prix: "",
    type_bien: "",
    localisation_ville: "",
    localisation_quartier: "",
    statut: "en attente", // Toujours en attente par défaut
  });
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [typesDeBiens, setTypesDeBiens] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await Categorie.filter({ type: 'type_bien', actif: true });
        setTypesDeBiens(data);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        try {
          const { file_url } = await UploadFile({ file });
          return file_url;
        } catch (error) {
          console.error("Error uploading file:", error);
          return null;
        }
      })
    );
    setImages((prev) => [...prev, ...uploadedUrls.filter(Boolean)]);
    setIsUploading(false);
  };
  
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Force le statut à "en attente" pour toutes les nouvelles annonces
      await Annonce.create({ 
        ...formData, 
        prix: Number(formData.prix), 
        images,
        statut: "en attente" // Modération obligatoire
      });
      navigate("/annonces");
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce:", error);
      // Optionally, show an error message to the user
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800">Ajouter une nouvelle annonce</h1>
      
      <Card>
        <CardHeader><CardTitle>Informations principales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre de l'annonce</Label>
            <Input id="titre" value={formData.titre} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={handleInputChange} rows={5} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Détails et localisation</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="prix">Prix (CFA)</Label>
            <Input id="prix" type="number" value={formData.prix} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="type_bien">Type de bien</Label>
            <Select onValueChange={(v) => handleSelectChange('type_bien', v)} value={formData.type_bien} required>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {typesDeBiens.map((type) => (
                  <SelectItem key={type.id} value={type.nom}>{type.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="localisation_ville">Ville</Label>
            <Input id="localisation_ville" value={formData.localisation_ville} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="localisation_quartier">Quartier</Label>
            <Input id="localisation_quartier" value={formData.localisation_quartier} onChange={handleInputChange} />
          </div>
          <div>
            {/* The initial status is always "en attente" based on the logic,
                so this select is potentially misleading or should be removed/disabled
                if the status is strictly controlled by the backend on creation.
                However, preserving existing UI element but ensuring backend logic overrides.
            */}
            <Label htmlFor="statut">Statut initial</Label>
            <Select onValueChange={(v) => handleSelectChange('statut', v)} value={formData.statut} required>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en attente">En attente de modération</SelectItem>
                {/* These options will be overridden by the form submission logic for new ads */}
                <SelectItem value="validée">Validée (visible publiquement)</SelectItem>
                <SelectItem value="masquée">Masquée (brouillon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt={`Annonce image ${index + 1}`} className="w-full h-32 object-cover rounded-md" />
                <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-slate-500" />
              <p className="mb-2 text-sm text-slate-500">
                <span className="font-semibold">Cliquez pour charger</span> ou glissez-déposez
              </p>
              {isUploading && <p className="text-xs text-slate-500">Chargement en cours...</p>}
            </div>
            <Input id="images" type="file" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </Label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="bg-slate-800 hover:bg-slate-700" disabled={isSaving || isUploading}>
          <Save className="mr-2 h-5 w-5" />
          {isSaving ? "Enregistrement..." : "Enregistrer l'annonce"}
        </Button>
      </div>
    </form>
  );
}
