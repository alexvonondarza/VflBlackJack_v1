import React, { useState } from "react";
import { 
  useGetActiveSession,
  useListGameSessions,
  useCreateGameSession,
  useEndGameSession,
  useAddPlayerToSession,
  useRemovePlayerFromSession,
  useListPlayers,
  useGetBank,
  useBuyChips,
  getGetActiveSessionQueryKey,
  getListGameSessionsQueryKey,
  getListPlayersQueryKey,
  getGetBankQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export default function Session() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: activeSession, isLoading: isActiveSessionLoading } = useGetActiveSession();
  const { data: pastSessions, isLoading: isPastSessionsLoading } = useListGameSessions();
  const { data: allPlayers, isLoading: isPlayersLoading } = useListPlayers();
  const { data: bank } = useGetBank();

  const createSession = useCreateGameSession();
  const endSession = useEndGameSession();
  const addPlayer = useAddPlayerToSession();
  const removePlayer = useRemovePlayerFromSession();
  const buyChips = useBuyChips();

  const [newSessionName, setNewSessionName] = useState("");

  const formatCurrency = (val: number) => {
    return val.toFixed(2).replace('.', ',') + " €";
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetActiveSessionQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListGameSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBankQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    createSession.mutate(
      { data: { name: newSessionName.trim() } },
      {
        onSuccess: () => {
          setNewSessionName("");
          toast({ title: "Spielabend gestartet" });
          invalidateAll();
        },
        onError: () => {
          toast({ title: "Fehler", description: "Spielabend konnte nicht gestartet werden.", variant: "destructive" });
        }
      }
    );
  };

  const handleEndSession = (id: number) => {
    endSession.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Spielabend beendet" });
          invalidateAll();
        },
        onError: () => {
          toast({ title: "Fehler", description: "Spielabend konnte nicht beendet werden.", variant: "destructive" });
        }
      }
    );
  };

  const handleAddPlayer = (sessionId: number, playerId: number, playerName: string) => {
    addPlayer.mutate(
      { id: sessionId, data: { playerId } },
      {
        onSuccess: () => {
          toast({ title: `${playerName} hinzugefügt`, description: "5,00 € Fixum wurden abgezogen." });
          invalidateAll();
        },
        onError: () => {
          toast({ title: "Fehler", description: "Spieler konnte nicht hinzugefügt werden.", variant: "destructive" });
        }
      }
    );
  };

  const handleRemovePlayer = (sessionId: number, playerId: number, playerName: string) => {
    removePlayer.mutate(
      { id: sessionId, playerId },
      {
        onSuccess: () => {
          toast({ title: `${playerName} entfernt`, description: "Fixum wurde zurückerstattet." });
          invalidateAll();
        },
        onError: () => {
          toast({ title: "Fehler", description: "Spieler konnte nicht entfernt werden.", variant: "destructive" });
        }
      }
    );
  };

  const handleBuyChips = (playerId: number, amount: number, onSuccessCb: () => void) => {
    buyChips.mutate(
      { id: playerId, data: { amount } },
      {
        onSuccess: () => {
          toast({ title: "Jetons gekauft", description: `${formatCurrency(amount)} wurden gutgeschrieben.` });
          onSuccessCb();
          invalidateAll();
        },
        onError: () => {
          toast({ title: "Fehler", description: "Jetons konnten nicht gekauft werden.", variant: "destructive" });
        }
      }
    );
  };

  if (isActiveSessionLoading || isPlayersLoading) {
    return (
      <div className="p-4 md:p-8 font-mono max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // State B: Active Session
  if (activeSession) {
    const sessionPlayers = activeSession.players || [];
    const sessionPlayerIds = new Set(sessionPlayers.map(p => p.playerId));
    const availablePlayers = (allPlayers || []).filter(p => !sessionPlayerIds.has(p.id));

    const totalChipsInPlay = sessionPlayers.reduce((acc, p) => acc + p.chipBalance, 0);

    return (
      <div className="p-4 md:p-8 font-mono max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{activeSession.name}</h1>
              <Badge variant="default" className="bg-orange-500 text-white border-transparent uppercase tracking-wider font-bold">Aktiv</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Laufender Spielabend</p>
          </div>
          <div className="flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="font-bold uppercase tracking-wider">Spielabend beenden</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Spielabend beenden?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Möchten Sie den Spielabend "{activeSession.name}" wirklich beenden? 
                    <br/><br/>
                    Guthaben und Statistiken bleiben erhalten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-background text-foreground border-border hover:bg-muted">Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleEndSession(activeSession.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Beenden</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-primary uppercase tracking-wider">Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Teilnehmer</span>
                <span className="font-bold text-lg">{sessionPlayers.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Jetons im Spiel</span>
                <span className="font-bold text-lg">{formatCurrency(totalChipsInPlay)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Bankbestand</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(bank?.balance ?? 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-primary uppercase tracking-wider">Spieler hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
              {availablePlayers.length === 0 ? (
                <div className="text-muted-foreground text-center py-4">Keine weiteren Spieler verfügbar.</div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availablePlayers.map(p => (
                    <Button 
                      key={p.id} 
                      variant="outline" 
                      className="border-border hover:bg-muted whitespace-nowrap"
                      onClick={() => handleAddPlayer(activeSession.id, p.id, p.name)}
                      disabled={addPlayer.isPending}
                    >
                      + {p.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-primary uppercase tracking-wider">Teilnehmer</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionPlayers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Noch keine Spieler beigetreten.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground uppercase tracking-wider font-bold">Name</TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Guthaben</TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Eingekauft</TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Beigetreten</TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionPlayers.map((player) => {
                      const joinTime = new Date(player.joinedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <TableRow key={player.sessionPlayerId} className="border-border hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-lg">{player.name}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatCurrency(player.chipBalance)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(player.totalBought)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{joinTime}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <BuyChipsDialog 
                              player={player} 
                              onBuy={(amount, cb) => handleBuyChips(player.playerId, amount, cb)} 
                              isPending={buyChips.isPending}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="uppercase text-xs font-bold tracking-wider">Entfernen</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Spieler entfernen?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Soll {player.name} aus dem Spielabend entfernt werden? 
                                    Das Fixum von 5,00 € wird zurückerstattet.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-background text-foreground border-border hover:bg-muted">Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemovePlayer(activeSession.id, player.playerId, player.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Bestätigen</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // State A: No active session
  return (
    <div className="p-4 md:p-8 font-mono max-w-6xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Spielabend</h1>
        <p className="text-sm text-muted-foreground mt-1">Spielabendverwaltung</p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-primary tracking-wider uppercase text-center py-4">Kein aktiver Spielabend</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md mx-auto pb-8">
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sessionName" className="text-sm text-muted-foreground uppercase tracking-wider">Titel des Spielabends</label>
              <Input 
                id="sessionName" 
                value={newSessionName} 
                onChange={(e) => setNewSessionName(e.target.value)} 
                placeholder="z.B. Freitag 13.05.2026"
                className="border-border bg-background focus-visible:ring-primary text-center text-lg"
              />
            </div>
            <Button type="submit" disabled={createSession.isPending || !newSessionName.trim()} className="font-bold uppercase tracking-wider w-full h-12 text-lg">
              Spielabend starten
            </Button>
          </form>
        </CardContent>
      </Card>

      <Collapsible className="w-full">
        <CollapsibleTrigger className="w-full">
          <div className="bg-card border border-border p-4 rounded-md flex justify-between items-center hover:bg-muted transition-colors">
            <span className="text-lg font-bold uppercase tracking-wider">Vergangene Spielabende</span>
            <span className="text-muted-foreground text-sm uppercase tracking-wider">Anzeigen</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              {!pastSessions || pastSessions.filter(s => s.status === 'ended').length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Keine vergangenen Spielabende gefunden.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground uppercase tracking-wider font-bold">Name</TableHead>
                        <TableHead className="text-muted-foreground uppercase tracking-wider font-bold">Datum</TableHead>
                        <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Spieler</TableHead>
                        <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastSessions.filter(s => s.status === 'ended').map((session) => (
                        <TableRow key={session.id} className="border-border hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-lg">{session.name}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(session.createdAt).toLocaleDateString('de-DE')}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{session.playerCount}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="border-border text-muted-foreground uppercase">Beendet</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

    </div>
  );
}

function BuyChipsDialog({ player, onBuy, isPending }: { player: any, onBuy: (amount: number, cb: () => void) => void, isPending: boolean }) {
  const [amount, setAmount] = useState<string>("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    
    onBuy(parsed, () => {
      setOpen(false);
      setAmount("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="uppercase text-xs font-bold tracking-wider">Jetons kaufen</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wider">Jetons kaufen für {player.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label htmlFor={`amount-${player.playerId}`} className="text-sm text-muted-foreground uppercase tracking-wider">Betrag (€)</label>
            <Input 
              id={`amount-${player.playerId}`} 
              type="text" 
              inputMode="decimal"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="10,00"
              className="border-border bg-background focus-visible:ring-primary text-lg"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20, 50, 100].map(preset => (
              <Button 
                key={preset} 
                type="button" 
                variant="outline" 
                className="border-border hover:bg-muted text-foreground"
                onClick={() => setAmount(preset.toString())}
              >
                +{preset} €
              </Button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-muted">Abbrechen</Button>
            <Button type="submit" disabled={isPending || !amount} className="font-bold uppercase tracking-wider">Kaufen</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
