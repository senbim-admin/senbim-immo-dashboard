import React, { useState, useEffect } from "react";
import { Conversation } from "@/api/entities";
import { MessagePrive } from "@/api/entities";
import { User } from "@/api/entities";
import { Annonce } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Search, 
  AlertTriangle,
  UserX,
  Eye,
  Ban,
  Users,
  Clock,
  Calendar,
  Shield,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ConversationDetail = ({ conversation, onBlock, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messagesData = await MessagePrive.filter({ conversation_id: conversation.id }, '-created_date');
        setMessages(messagesData);
      } catch (error) {
        console.error("Erreur de chargement des messages:", error);
      }
      setLoading(false);
    };
    loadMessages();
  }, [conversation.id]);

  if (loading) return <div className="p-4">Chargement des messages...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg">Conversation entre</h4>
          <p className="text-sm text-slate-600">{conversation.participant_1_email} ↔ {conversation.participant_2_email}</p>
          {conversation.signale_par_email && (
            <Badge className="mt-2 bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Signalée par {conversation.signale_par_email}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onBlock(conversation)} variant="destructive" size="sm">
            <Ban className="w-4 h-4 mr-1" />
            Bloquer conversation
          </Button>
        </div>
      </div>
      
      {conversation.motif_signalement && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm"><strong>Motif du signalement :</strong> {conversation.motif_signalement}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`p-3 rounded-lg border ${
                  message.signale ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{message.expediteur_email}</span>
                      {message.signale && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Signalé
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {format(new Date(message.created_date), "d MMM HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm">{message.contenu}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-slate-500 text-center py-4">Aucun message dans cette conversation</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Messagerie() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const conversationsData = await Conversation.list('-dernier_message_date');
      setConversations(conversationsData);
    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    }
    setLoading(false);
  };

  const handleBlockConversation = async (conversation) => {
    if (window.confirm("Êtes-vous sûr de vouloir bloquer cette conversation ? Les participants ne pourront plus échanger.")) {
      await Conversation.update(conversation.id, { 
        statut: 'bloquée', 
        bloque_par_admin: true 
      });
      setIsDialogOpen(false);
      loadData();
    }
  };

  const handleBlockUser = async (userEmail) => {
    if (window.confirm(`Êtes-vous sûr de vouloir suspendre le compte de ${userEmail} ?`)) {
      const users = await User.list();
      const user = users.find(u => u.email === userEmail);
      if (user) {
        await User.update(user.id, { statut_compte: 'suspendu' });
        loadData();
      }
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'archivée': 'bg-gray-100 text-gray-800 border-gray-200',
      'bloquée': 'bg-red-100 text-red-800 border-red-200',
      'signalée': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'active': return <MessageSquare className="w-4 h-4" />;
      case 'archivée': return <Archive className="w-4 h-4" />;
      case 'bloquée': return <Ban className="w-4 h-4" />;
      case 'signalée': return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchMatch = conv.participant_1_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       conv.participant_2_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       conv.dernier_message_contenu?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatut === "all" || conv.statut === filterStatut;
    
    return searchMatch && statusMatch;
  });

  const stats = {
    total: conversations.length,
    actives: conversations.filter(c => c.statut === 'active').length,
    signalees: conversations.filter(c => c.statut === 'signalée').length,
    bloquees: conversations.filter(c => c.statut === 'bloquée').length
  };

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Messagerie</h1>
          <p className="text-slate-600">Surveillance des échanges entre utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {stats.signalees} signalées
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {stats.bloquees} bloquées
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {stats.actives} actives
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total conversations</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Signalées</p>
                <p className="text-2xl font-bold text-red-600">{stats.signalees}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Bloquées</p>
                <p className="text-2xl font-bold text-orange-600">{stats.bloquees}</p>
              </div>
              <Ban className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="toutes" className="w-full">
        <TabsList>
          <TabsTrigger value="toutes">Toutes les conversations</TabsTrigger>
          <TabsTrigger value="signalees">Conversations signalées</TabsTrigger>
          <TabsTrigger value="bloquees">Conversations bloquées</TabsTrigger>
        </TabsList>

        <TabsContent value="toutes" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher par email ou contenu..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="signalée">Signalée</SelectItem>
                    <SelectItem value="bloquée">Bloquée</SelectItem>
                    <SelectItem value="archivée">Archivée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations ({filteredConversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Participants</TableHead>
                      <TableHead>Dernier message</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversations.map((conversation) => (
                      <TableRow 
                        key={conversation.id} 
                        className={`hover:bg-slate-50 ${
                          conversation.statut === 'signalée' ? 'bg-red-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span>{conversation.participant_1_email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-4 text-center">↔</span>
                              <span>{conversation.participant_2_email}</span>
                            </div>
                            {conversation.signale_par_email && (
                              <div className="text-xs text-red-600">
                                Signalée par {conversation.signale_par_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-slate-600 truncate" title={conversation.dernier_message_contenu}>
                            {conversation.dernier_message_contenu || "Aucun message"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(conversation.statut)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(conversation.statut)}
                              {conversation.statut}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {conversation.dernier_message_date 
                              ? format(new Date(conversation.dernier_message_date), "d MMM yyyy", { locale: fr })
                              : format(new Date(conversation.created_date), "d MMM yyyy", { locale: fr })
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedConversation(conversation)}
                                >
                                  <Eye className="w-4 h-4 mr-1" /> Voir
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>Détails de la conversation</DialogTitle>
                                </DialogHeader>
                                {selectedConversation && (
                                  <ConversationDetail
                                    conversation={selectedConversation}
                                    onBlock={handleBlockConversation}
                                    onClose={() => setIsDialogOpen(false)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBlockUser(conversation.participant_1_email)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBlockUser(conversation.participant_2_email)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredConversations.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    {searchTerm || filterStatut !== "all"
                      ? "Aucune conversation ne correspond à vos critères"
                      : "Aucune conversation pour le moment"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signalees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Conversations signalées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.filter(c => c.statut === 'signalée').map((conversation) => (
                  <Card key={conversation.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {conversation.participant_1_email} ↔ {conversation.participant_2_email}
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            <strong>Motif :</strong> {conversation.motif_signalement}
                          </p>
                          <p className="text-sm text-red-600">
                            <strong>Signalée par :</strong> {conversation.signale_par_email}
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedConversation(conversation)}
                            >
                              <Eye className="w-4 h-4 mr-1" /> Examiner
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Examen de la conversation signalée</DialogTitle>
                            </DialogHeader>
                            {selectedConversation && (
                              <ConversationDetail
                                conversation={selectedConversation}
                                onBlock={handleBlockConversation}
                                onClose={() => setIsDialogOpen(false)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {conversations.filter(c => c.statut === 'signalée').length === 0 && (
                  <p className="text-slate-500 text-center py-8">Aucune conversation signalée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloquees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-orange-500" />
                Conversations bloquées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.filter(c => c.statut === 'bloquée').map((conversation) => (
                  <Card key={conversation.id} className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {conversation.participant_1_email} ↔ {conversation.participant_2_email}
                          </p>
                          <p className="text-sm text-orange-600 mt-1">
                            {conversation.bloque_par_admin ? 'Bloquée par l\'administration' : 'Bloquée par un utilisateur'}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          <Ban className="w-3 h-3 mr-1" />
                          Bloquée
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {conversations.filter(c => c.statut === 'bloquée').length === 0 && (
                  <p className="text-slate-500 text-center py-8">Aucune conversation bloquée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}