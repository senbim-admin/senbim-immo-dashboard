import React, { useState, useEffect } from "react";
import { Agent } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  UserCheck, 
  Plus, 
  Search, 
  Phone,
  Mail,
  MapPin,
  Star
} from "lucide-react";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await Agent.list('-created_date');
      setAgents(data);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setLoading(false);
  };

  const getSpecialiteColor = (specialite) => {
    const colors = {
      'vente': 'bg-blue-100 text-blue-800 border-blue-200',
      'location': 'bg-green-100 text-green-800 border-green-200',
      'both': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[specialite] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredAgents = agents.filter(agent => {
    return (
      agent.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des agents</h1>
          <p className="text-slate-600">Gérez votre équipe commerciale</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel agent
        </Button>
      </div>

      {/* Barre de recherche */}
      <Card className="mb-8 shadow-sm border-0 bg-white">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher un agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grille des agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="shadow-sm border-0 bg-white hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                    {agent.photo ? (
                      <img 
                        src={agent.photo} 
                        alt={`${agent.prenom} ${agent.nom}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-600 font-semibold text-lg">
                        {agent.prenom?.charAt(0)}{agent.nom?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {agent.prenom} {agent.nom}
                    </h3>
                    <Badge className={getSpecialiteColor(agent.specialite)}>
                      {agent.specialite === 'both' ? 'Vente & Location' : agent.specialite}
                    </Badge>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${agent.actif ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{agent.telephone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 truncate">{agent.email}</span>
                </div>
                {agent.experience && (
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{agent.experience} ans d'expérience</span>
                  </div>
                )}
              </div>

              {agent.zone_geographique && agent.zone_geographique.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Zones couvertes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.zone_geographique.slice(0, 3).map((zone, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                    {agent.zone_geographique.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.zone_geographique.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" className="w-full">
                  Voir profil complet
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            {searchTerm 
              ? "Aucun agent ne correspond à votre recherche"
              : "Aucun agent enregistré pour le moment"
            }
          </p>
        </div>
      )}
    </div>
  );
}