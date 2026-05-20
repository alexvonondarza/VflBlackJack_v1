import React, { useState } from "react";
import { 
  useGetActiveSession,
  useListGameSessions,
  useCreateGameSession,
  useFinalizeGameSession,
  useAddPlayerToSession,
  useRemovePlayerFromSession,
  useListPlayers,
  useGetBank,
  useBuyChips,
  useGetGameSessionHistory,
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
  const finalizeSession = useFinalizeGameSession();
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

  const handleFinalizeSession = (id: number, balances: { playerId: number; finalBalance: number }[], cb: () => void) => {
    finalizeSession.mutate(
      { id, data: { balances } },
      {
        onSuccess: () => {
          toast({ title: "Spielabend beendet \u2014 Endstände gespeichert" });
          invalidateAll();
          cb();
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
            <FinalizeSessionDialog 
              session={activeSession} 
              onFinalize={(balances, cb) => handleFinalizeSession(activeSession.id, balances, cb)} 
              isPending={finalizeSession.isPending} 
            />
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
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Jetons</TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">Eingekauft (Fixum)</TableHead>
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
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(player.fixumPaid)}</TableCell>
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
          <div className="space-y-3">
            {!pastSessions || pastSessions.filter(s => s.status === 'ended').length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    Keine vergangenen Spielabende gefunden.
                  </div>
                </CardContent>
              </Card>
            ) : (
              [...pastSessions.filter(s => s.status === 'ended')].reverse().map((session) => (
                <SessionHistoryCard key={session.id} session={session} formatCurrency={formatCurrency} />
              ))
            )}
          </div>
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

function FinalizeSessionDialog({ session, onFinalize, isPending }: { session: any, onFinalize: (balances: { playerId: number; finalBalance: number }[], cb: () => void) => void, isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [balances, setBalances] = useState<Record<number, string>>({});

  // Initialize state when opening
  React.useEffect(() => {
    if (open && session?.players) {
      const initial: Record<number, string> = {};
      session.players.forEach((p: any) => {
        initial[p.playerId] = p.chipBalance.toString();
      });
      setBalances(initial);
    }
  }, [open, session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBalances = Object.entries(balances).map(([playerId, val]) => {
      const parsed = parseFloat(val.replace(',', '.'));
      return {
        playerId: parseInt(playerId),
        finalBalance: isNaN(parsed) || parsed < 0 ? 0 : parsed
      };
    });
    
    onFinalize(finalBalances, () => setOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="font-bold uppercase tracking-wider">Spielabend beenden</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wider text-xl">Spielabend beenden</DialogTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Bitte gib die finalen Jeton-Bestände für jeden Teilnehmer ein.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {session?.players?.map((p: any) => (
              <div key={p.playerId} className="flex items-center gap-4">
                <label className="w-1/3 text-sm font-medium">{p.name}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balances[p.playerId] ?? ""}
                  onChange={(e) => setBalances(prev => ({ ...prev, [p.playerId]: e.target.value }))}
                  className="flex-1 border-border bg-background focus-visible:ring-primary"
                  required
                />
              </div>
            ))}
            {(!session?.players || session.players.length === 0) && (
              <div className="text-center text-muted-foreground py-4">
                Keine Teilnehmer vorhanden.
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-muted">Abbrechen</Button>
            <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase tracking-wider">
              Bestätigen & Beenden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionHistoryCard({ session, formatCurrency }: { session: { id: number; name: string; createdAt: string; endedAt?: string | null; playerCount: number }; formatCurrency: (v: number) => string }) {
  const [open, setOpen] = useState(false);
  const { data: history, isLoading } = useGetGameSessionHistory(session.id, { query: { enabled: open } });

  const dateStr = new Date(session.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const endStr = session.endedAt ? new Date(session.endedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null;

  const sortedPlayers = history?.players ? [...history.players].sort((a, b) => b.diff - a.diff) : [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <Card className="border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-left min-w-0">
                  <div className="font-bold text-base truncate">{session.name}</div>
                  <div className="text-muted-foreground text-xs">{dateStr}{endStr ? ` — ${endStr} Uhr` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-muted-foreground text-sm">{session.playerCount} Spieler</span>
                <Badge variant="outline" className="border-border text-muted-foreground uppercase text-xs">Beendet</Badge>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">{open ? "Schließen" : "Details"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="border-border border-t-0 rounded-t-none bg-card/50">
          <CardContent className="pt-5 pb-5 px-5">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : !history ? (
              <div className="text-center text-muted-foreground py-4">Keine Daten verfügbar.</div>
            ) : (
              <div className="space-y-6">
                {/* Player results */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ergebnisse der Spieler</h3>
                  {sortedPlayers.length === 0 ? (
                    <div className="text-muted-foreground text-sm">Keine Spielerdaten aufgezeichnet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground uppercase tracking-wider font-bold text-xs pl-0">Spieler</TableHead>
                            <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold text-xs">Vorher</TableHead>
                            <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold text-xs">Nachher</TableHead>
                            <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold text-xs pr-0">Gewinn/Verlust</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedPlayers.map((p) => (
                            <TableRow key={p.playerId} className="border-border hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium pl-0">{p.playerName}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatCurrency(p.balanceBefore)}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(p.balanceAfter)}</TableCell>
                              <TableCell className="text-right pr-0">
                                <span className={`font-bold text-base ${p.diff > 0 ? 'text-green-400' : p.diff < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {p.diff > 0 ? '+' : ''}{formatCurrency(p.diff)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Bank result */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Bank</h3>
                  {history.bankBalanceBefore !== null && history.bankBalanceBefore !== undefined && history.bankBalanceAfter !== null && history.bankBalanceAfter !== undefined ? (
                    <div className="flex items-center justify-between bg-muted/30 rounded-md px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Bankbestand zu Beginn: <span className="text-foreground font-medium">{formatCurrency(history.bankBalanceBefore)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bankbestand am Ende: <span className="text-foreground font-medium">{formatCurrency(history.bankBalanceAfter)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bank Ergebnis</div>
                        <span className={`font-bold text-xl ${(history.bankDiff ?? 0) > 0 ? 'text-green-400' : (history.bankDiff ?? 0) < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {(history.bankDiff ?? 0) > 0 ? '+' : ''}{formatCurrency(history.bankDiff ?? 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Bankdaten nicht verfügbar (älterer Spielabend).</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
