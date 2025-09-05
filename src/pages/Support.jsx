
import React, { useState, useEffect } from "react";
import { Ticket } from "@/api/entities";
import { User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LifeBuoy, 
  Search,
  Send,
  Eye,
  Archive,
  Clock,
  Loader2,
  Calendar,
  User as UserIcon,
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ticketsData, userData] = await Promise.all([
          Ticket.list('-created_date'),
          User.me()
        ]);
        setTickets(ticketsData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Erreur de chargement des données:", error);
      }
      setLoading(false);
    };
    loadData();
  }, []);
  
  const getStatusBadge = (statut) => {
    const styles = {
      ouvert: "bg-red-100 text-red-800",
      "en cours": "bg-yellow-100 text-yellow-800",
      fermé: "bg-green-100 text-green-800"
    };
    return <Badge className={styles[statut]}>{statut}</Badge>;
  };

  const getPriorityBadge = (priorite) => {
    const styles = {
      basse: "bg-blue-100 text-blue-800",
      moyenne: "bg-gray-100 text-gray-800",
      haute: "bg-orange-100 text-orange-800"
    };
    return <Badge variant="outline" className={styles[priorite]}>{priorite}</Badge>;
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    await Ticket.update(ticketId, { statut: newStatus });
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, statut: newStatus } : t));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, statut: newStatus });
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !currentUser) return;
    setIsReplying(true);

    try {
      // 1. Envoyer l'email
      await SendEmail({
        to: selectedTicket.user_email,
        subject: `Re: [Ticket #${selectedTicket.id.slice(0, 5)}] ${selectedTicket.sujet}`,
        body: `Bonjour,
<br><br>
Voici une réponse concernant votre ticket :
<br><br>
<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${replyMessage}</pre>
<br>
Cordialement,
<br>
L'équipe de support Senbim Immo.`,
        from_name: "Senbim Immo - Support"
      });

      // 2. Mettre à jour le ticket dans la base de données
      const newResponse = {
        contenu: replyMessage,
        auteur_email: currentUser.email,
        date: new Date().toISOString()
      };
      const currentResponses = selectedTicket.reponses || [];
      const updatedResponses = [...currentResponses, newResponse];
      
      const updatedTicket = await Ticket.update(selectedTicket.id, {
        reponses: updatedResponses,
        statut: "en cours"
      });

      // 3. Mettre à jour l'état local
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setReplyMessage("");

    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
    }
    setIsReplying(false);
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date non disponible';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return format(date, 'd MMM yyyy', {locale: fr});
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'Date non disponible';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return format(date, 'd MMM yyyy, HH:mm', {locale: fr});
    } catch (error) {
      return 'Date invalide';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const searchMatch = ticket.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || ticket.statut === filterStatus;
    const priorityMatch = filterPriority === 'all' || ticket.priorite === filterPriority;
    return searchMatch && statusMatch && priorityMatch;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Support & Assistance</h1>
      
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Rechercher par sujet ou utilisateur..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="ouvert">Ouvert</SelectItem>
              <SelectItem value="en cours">En cours</SelectItem>
              <SelectItem value="fermé">Fermé</SelectItem>
            </SelectContent>
          </Select>
           <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              <SelectItem value="basse">Basse</SelectItem>
              <SelectItem value="moyenne">Moyenne</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LifeBuoy className="w-5 h-5"/> Tickets de support ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> :
                filteredTickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell>{getStatusBadge(ticket.statut)}</TableCell>
                    <TableCell className="font-medium">{ticket.sujet}</TableCell>
                    <TableCell>{ticket.user_email}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priorite)}</TableCell>
                    <TableCell>{formatDate(ticket.created_date)}</TableCell>
                    <TableCell className="text-right">
                       <Dialog open={isDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={(open) => {
                          if (!open) {
                              setIsDialogOpen(false);
                              setSelectedTicket(null);
                          }
                       }}>
                         <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedTicket(ticket); setIsDialogOpen(true); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir / Répondre
                            </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-4xl h-[80vh]">
                            <DialogHeader>
                               <DialogTitle>Ticket #{selectedTicket?.id.slice(0,5)}: {selectedTicket?.sujet}</DialogTitle>
                               <CardDescription>
                                 <div className="flex gap-4 items-center">
                                    <div className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {selectedTicket?.user_email}</div>
                                    <div className="flex items-center gap-1"><Flag className="w-3 h-3" /> {getPriorityBadge(selectedTicket?.priorite || 'moyenne')}</div>
                                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {getStatusBadge(selectedTicket?.statut || 'ouvert')}</div>
                                 </div>
                               </CardDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6 h-full py-4 overflow-hidden">
                                <div className="flex flex-col h-full">
                                    <h3 className="font-semibold mb-2">Historique de la conversation</h3>
                                    <ScrollArea className="flex-grow border rounded-md p-4 bg-slate-50">
                                        {/* Initial message */}
                                        <div className="mb-4 p-3 rounded-lg bg-white shadow-sm">
                                            <p className="font-bold text-sm">{selectedTicket?.user_email}</p>
                                            <p className="text-xs text-slate-500 mb-2">{formatDateTime(selectedTicket?.created_date)}</p>
                                            <p className="text-sm">{selectedTicket?.message}</p>
                                        </div>
                                        {/* Reponses */}
                                        {selectedTicket?.reponses?.map((reponse, index) => (
                                            <div key={index} className="mb-4 p-3 rounded-lg bg-blue-50 shadow-sm">
                                                <p className="font-bold text-sm">{reponse.auteur_email} (Support)</p>
                                                <p className="text-xs text-slate-500 mb-2">{formatDateTime(reponse.date)}</p>
                                                <p className="text-sm">{reponse.contenu}</p>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </div>
                                <div className="flex flex-col h-full">
                                    <h3 className="font-semibold mb-2">Répondre au ticket</h3>
                                    <Textarea 
                                      className="flex-grow" 
                                      placeholder="Tapez votre réponse ici..."
                                      value={replyMessage}
                                      onChange={(e) => setReplyMessage(e.target.value)}
                                    />
                                    <div className="flex justify-between items-center mt-4">
                                       <div className="flex gap-2">
                                          {selectedTicket?.statut !== 'fermé' && (
                                              <Button variant="secondary" onClick={() => handleUpdateStatus(selectedTicket.id, 'fermé')}>
                                                  <Archive className="w-4 h-4 mr-2" />
                                                  Fermer le ticket
                                              </Button>
                                          )}
                                       </div>
                                       <Button onClick={handleSendReply} disabled={isReplying || !replyMessage.trim()}>
                                          {isReplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          <Send className="w-4 h-4 mr-2"/>
                                          Envoyer la réponse
                                       </Button>
                                    </div>
                                </div>
                            </div>
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
    </div>
  );
}
