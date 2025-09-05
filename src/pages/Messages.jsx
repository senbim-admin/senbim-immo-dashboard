import React, { useState, useEffect } from "react";
import { Message } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MessageSquare, 
  Search, 
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterPriorite, setFilterPriorite] = useState("all");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await Message.list('-created_date');
      setMessages(data);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setLoading(false);
  };

  const getStatusColor = (statut) => {
    const colors = {
      'nouveau': 'bg-red-100 text-red-800 border-red-200',
      'lu': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'traite': 'bg-green-100 text-green-800 border-green-200',
      'archive': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPrioriteColor = (priorite) => {
    const colors = {
      'basse': 'bg-blue-100 text-blue-800 border-blue-200',
      'normale': 'bg-gray-100 text-gray-800 border-gray-200',
      'haute': 'bg-orange-100 text-orange-800 border-orange-200',
      'urgente': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priorite] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'nouveau': return <AlertCircle className="w-4 h-4" />;
      case 'lu': return <Clock className="w-4 h-4" />;
      case 'traite': return <CheckCircle className="w-4 h-4" />;
      case 'archive': return <Archive className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = filterStatut === "all" || message.statut === filterStatut;
    const matchesPriorite = filterPriorite === "all" || message.priorite === filterPriorite;
    
    return matchesSearch && matchesStatut && matchesPriorite;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des messages</h1>
          <p className="text-slate-600">Suivez et traitez les demandes clients</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {messages.filter(m => m.statut === 'nouveau').length} nouveaux
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            {messages.filter(m => m.statut === 'lu').length} en attente
          </Badge>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-8 shadow-sm border-0 bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, email ou contenu..."
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
                <SelectItem value="lu">Lu</SelectItem>
                <SelectItem value="traite">Traité</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriorite} onValueChange={setFilterPriorite}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des messages */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Contact</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    className={`hover:bg-slate-50 ${
                      message.statut === 'nouveau' ? 'bg-red-50' : ''
                    }`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{message.nom_complet}</p>
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            {message.email}
                          </div>
                          {message.telephone && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />
                              {message.telephone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">
                        {message.sujet || "Sans sujet"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-slate-600 truncate" title={message.message}>
                        {message.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(message.statut)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(message.statut)}
                          {message.statut}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPrioriteColor(message.priorite)} variant="outline">
                        {message.priorite}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(message.created_date), "d MMM yyyy à HH:mm", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Répondre
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredMessages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">
                {searchTerm || filterStatut !== "all" || filterPriorite !== "all"
                  ? "Aucun message ne correspond à vos critères"
                  : "Aucun message pour le moment"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}