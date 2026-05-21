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
  useCreatePlayer,
  useGetGameSessionHistory,
  getGetActiveSessionQueryKey,
  getListGameSessionsQueryKey,
  getListPlayersQueryKey,
  getGetBankQueryKey,
  getGetStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export default function Session() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: activeSession, isLoading: isActiveSessionLoading } =
    useGetActiveSession();
  const { data: pastSessions, isLoading: isPastSessionsLoading } =
    useListGameSessions();
  const { data: allPlayers, isLoading: isPlayersLoading } = useListPlayers();
  const { data: bank } = useGetBank();

  const createSession = useCreateGameSession();
  const finalizeSession = useFinalizeGameSession();
  const addPlayer = useAddPlayerToSession();
  const removePlayer = useRemovePlayerFromSession();
  const buyChips = useBuyChips();
  const createPlayer = useCreatePlayer();

  const [newSessionName, setNewSessionName] = useState("");

  const formatCurrency = (val: number) => {
    return val.toFixed(2).replace(".", ",") + " €";
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
          invalidateAll();
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Spielabend konnte nicht gestartet werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleFinalizeSession = (
    id: number,
    balances: { playerId: number; finalBalance: number }[],
    cb: () => void,
  ) => {
    finalizeSession.mutate(
      { id, data: { balances } },
      {
        onSuccess: () => {
          invalidateAll();
          cb();
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Spielabend konnte nicht beendet werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleAddPlayer = (sessionId: number, playerId: number) => {
    addPlayer.mutate(
      { id: sessionId, data: { playerId } },
      {
        onSuccess: () => {
          invalidateAll();
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Spieler konnte nicht hinzugefügt werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleCreateAndAddPlayer = (
    sessionId: number,
    name: string,
    cb: () => void,
  ) => {
    createPlayer.mutate(
      { data: { name } },
      {
        onSuccess: (newPlayer) => {
          addPlayer.mutate(
            { id: sessionId, data: { playerId: newPlayer.id } },
            {
              onSuccess: () => {
                invalidateAll();
                cb();
              },
              onError: () => {
                toast({
                  title: "Fehler",
                  description: "Spieler konnte nicht hinzugefügt werden.",
                  variant: "destructive",
                });
              },
            },
          );
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Spieler konnte nicht angelegt werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleRemovePlayer = (
    sessionId: number,
    playerId: number,
    _playerName: string,
  ) => {
    removePlayer.mutate(
      { id: sessionId, playerId },
      {
        onSuccess: () => {
          invalidateAll();
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Spieler konnte nicht entfernt werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleBuyChips = (
    playerId: number,
    amount: number,
    onSuccessCb: () => void,
  ) => {
    buyChips.mutate(
      { id: playerId, data: { amount } },
      {
        onSuccess: () => {
          onSuccessCb();
          invalidateAll();
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Jetons konnten nicht gekauft werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (isActiveSessionLoading || isPlayersLoading) {
    return (
      <div className="p-4 md:p-8 font-mono">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (activeSession) {
    const rawSessionPlayers = activeSession.players || [];
    const allPlayersById = new Map((allPlayers || []).map((p) => [p.id, p]));

    const sessionPlayers = rawSessionPlayers.map((p) => {
      const latest = allPlayersById.get(p.playerId);

      return {
        ...p,
        chipBalance: latest?.chipBalance ?? p.chipBalance,
        fixumPaid: latest?.fixumPaid ?? p.fixumPaid,
      };
    });

    const sessionPlayerIds = new Set(sessionPlayers.map((p) => p.playerId));
    const availablePlayers = (allPlayers || []).filter(
      (p) => !sessionPlayerIds.has(p.id),
    );
    const totalChipsInPlay = sessionPlayers.reduce(
      (acc, p) => acc + Number(p.chipBalance),
      0,
    );

    return (
      <div className="p-4 md:p-8 font-mono">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                {activeSession.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-orange-500 text-white">Aktiv</Badge>
                <p className="text-sm text-muted-foreground">
                  Laufender Spielabend
                </p>
              </div>
            </div>

            <FinalizeSessionDialog
              session={{ ...activeSession, players: sessionPlayers }}
              onFinalize={(balances, cb) =>
                handleFinalizeSession(activeSession.id, balances, cb)
              }
              isPending={finalizeSession.isPending}
            />
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-primary uppercase tracking-wider">
                  Statistik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">Teilnehmer</span>
                  <span className="font-bold text-lg">
                    {sessionPlayers.length}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">Jetons im Spiel</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totalChipsInPlay)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">Bankbestand</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(bank?.balance ?? 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-primary uppercase tracking-wider">
                  Spieler hinzufügen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {availablePlayers.map((p) => (
                    <Button
                      key={p.id}
                      variant="outline"
                      onClick={() => handleAddPlayer(activeSession.id, p.id)}
                      disabled={addPlayer.isPending}
                    >
                      + {p.name}
                    </Button>
                  ))}

                  {availablePlayers.length === 0 && (
                    <p className="text-muted-foreground">
                      Alle bekannten Spieler sind bereits dabei.
                    </p>
                  )}
                </div>

                <NewPlayerInSessionDialog
                  sessionId={activeSession.id}
                  onCreate={(name, cb) =>
                    handleCreateAndAddPlayer(activeSession.id, name, cb)
                  }
                  isPending={createPlayer.isPending || addPlayer.isPending}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-primary uppercase tracking-wider">
                Teilnehmer
              </CardTitle>
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
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Jetons</TableHead>
                        <TableHead className="text-right">
                          Eingekauft (Fixum)
                        </TableHead>
                        <TableHead className="text-right">Beigetreten</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionPlayers.map((player) => {
                        const joinTime = new Date(
                          player.joinedAt,
                        ).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <TableRow
                            key={player.sessionPlayerId}
                            className="border-border hover:bg-muted/50"
                          >
                            <TableCell className="font-medium text-lg">
                              {player.name}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {formatCurrency(Number(player.chipBalance))}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(Number(player.fixumPaid))}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {joinTime}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <BuyChipsDialog
                                player={player}
                                onBuy={(amount, cb) =>
                                  handleBuyChips(player.playerId, amount, cb)
                                }
                                isPending={buyChips.isPending}
                              />

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="uppercase text-xs font-bold tracking-wider"
                                  >
                                    Entfernen
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Spieler entfernen?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Soll {player.name} aus diesem Spielabend
                                      entfernt werden? Es wird kein Fixum
                                      abgezogen oder zurückgebucht.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Abbrechen
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleRemovePlayer(
                                          activeSession.id,
                                          player.playerId,
                                          player.name,
                                        )
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Bestätigen
                                    </AlertDialogAction>
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
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Spielabend
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spielabendverwaltung
          </p>
        </header>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-primary uppercase tracking-wider">
              Kein aktiver Spielabend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateSession}
              className="max-w-md mx-auto space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="sessionName"
                  className="text-sm text-muted-foreground uppercase tracking-wider"
                >
                  Titel des Spielabends
                </label>
                <Input
                  id="sessionName"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="z.B. Freitag 13.05.2026"
                  className="border-border bg-background focus-visible:ring-primary text-center text-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={createSession.isPending || !newSessionName.trim()}
                className="w-full font-bold uppercase tracking-wider"
              >
                Spielabend starten
              </Button>
            </form>
          </CardContent>
        </Card>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              Vergangene Spielabende Anzeigen
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {isPastSessionsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !pastSessions ||
              pastSessions.filter((s) => s.status === "ended").length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Keine vergangenen Spielabende gefunden.
                </CardContent>
              </Card>
            ) : (
              [...pastSessions.filter((s) => s.status === "ended")]
                .reverse()
                .map((session) => (
                  <SessionHistoryCard
                    key={session.id}
                    session={session}
                    formatCurrency={formatCurrency}
                  />
                ))
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function BuyChipsDialog({
  player,
  onBuy,
  isPending,
}: {
  player: any;
  onBuy: (amount: number, cb: () => void) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseFloat(amount.replace(",", "."));

    if (isNaN(parsed) || parsed <= 0) return;

    onBuy(parsed, () => {
      setOpen(false);
      setAmount("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="uppercase text-xs font-bold tracking-wider"
        >
          Jetons kaufen
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wider">
            Jetons kaufen für {player.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label
              htmlFor="amount"
              className="text-sm text-muted-foreground uppercase tracking-wider"
            >
              Betrag (€)
            </label>
            <Input
              id="amount"
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
            {[5, 10, 20, 50, 100].map((preset) => (
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="hover:bg-muted"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isPending || !amount}
              className="font-bold uppercase tracking-wider"
            >
              Kaufen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FinalizeSessionDialog({
  session,
  onFinalize,
  isPending,
}: {
  session: any;
  onFinalize: (
    balances: { playerId: number; finalBalance: number }[],
    cb: () => void,
  ) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open && session?.players) {
      const initial: Record<string, string> = {};

      session.players.forEach((p: any) => {
        initial[p.playerId] = String(p.chipBalance ?? 0);
      });

      setBalances(initial);
    }
  }, [open, session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalBalances = Object.entries(balances).map(([playerId, val]) => {
      const parsed = parseFloat(String(val).replace(",", "."));

      return {
        playerId: parseInt(playerId, 10),
        finalBalance: isNaN(parsed) || parsed < 0 ? 0 : parsed,
      };
    });

    onFinalize(finalBalances, () => setOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase tracking-wider">
          Spielabend beenden
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wider">
            Spielabend beenden
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <p className="text-sm text-muted-foreground">
            Bitte gib die finalen Jeton-Bestände für jeden Teilnehmer ein.
          </p>

          <div className="space-y-3">
            {session?.players?.map((p: any) => (
              <div key={p.playerId} className="flex items-center gap-4">
                <label className="w-40 font-medium">{p.name}</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={balances[p.playerId] ?? ""}
                  onChange={(e) =>
                    setBalances((prev) => ({
                      ...prev,
                      [p.playerId]: e.target.value,
                    }))
                  }
                  className="flex-1 border-border bg-background focus-visible:ring-primary"
                  required
                />
              </div>
            ))}

            {(!session?.players || session.players.length === 0) && (
              <p className="text-muted-foreground">Keine Teilnehmer vorhanden.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="hover:bg-muted"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="font-bold uppercase tracking-wider"
            >
              Bestätigen & Beenden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewPlayerInSessionDialog({
  sessionId,
  onCreate,
  isPending,
}: {
  sessionId: number;
  onCreate: (name: string, cb: () => void) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    onCreate(name.trim(), () => {
      setOpen(false);
      setName("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">+ Neuen Spieler anlegen & hinzufügen</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wider">
            Neuen Spieler anlegen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <p className="text-sm text-muted-foreground">
            Der Spieler wird angelegt und direkt dem Spielabend hinzugefügt.
            Das Fixum wird nur beim Anlegen des Spielers verbucht.
          </p>

          <div className="space-y-2">
            <label
              htmlFor="newPlayerName"
              className="text-sm text-muted-foreground uppercase tracking-wider"
            >
              Name
            </label>
            <Input
              id="newPlayerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spielername"
              className="border-border bg-background focus-visible:ring-primary text-lg"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="hover:bg-muted"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="font-bold uppercase tracking-wider"
            >
              Anlegen & Hinzufügen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionHistoryCard({
  session,
  formatCurrency,
}: {
  session: {
    id: number;
    name: string;
    createdAt: string;
    endedAt?: string | null;
    playerCount: number;
  };
  formatCurrency: (v: number) => string;
}) {
  const [open, setOpen] = useState(false);

  const { data: history, isLoading } = useGetGameSessionHistory(session.id, {
    query: {
      enabled: open,
      queryKey: [],
    },
  });

  const dateStr = new Date(session.createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const endStr = session.endedAt
    ? new Date(session.endedAt).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const sortedPlayers = history?.players
    ? [...history.players].sort((a, b) => b.diff - a.diff)
    : [];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg text-primary">{session.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {dateStr}
              {endStr ? ` — ${endStr} Uhr` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{session.playerCount} Spieler</Badge>
            <Badge>Beendet</Badge>
            <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
              {open ? "Schließen" : "Details"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !history ? (
            <p className="text-muted-foreground">Keine Daten verfügbar.</p>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-primary mb-3">
                  Ergebnisse der Spieler
                </h3>

                {sortedPlayers.length === 0 ? (
                  <p className="text-muted-foreground">
                    Keine Spielerdaten aufgezeichnet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Spieler</TableHead>
                        <TableHead className="text-right">Vorher</TableHead>
                        <TableHead className="text-right">Nachher</TableHead>
                        <TableHead className="text-right">
                          Gewinn/Verlust
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPlayers.map((p) => (
                        <TableRow key={p.playerId}>
                          <TableCell>{p.playerName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(p.balanceBefore)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(p.balanceAfter)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              p.diff > 0
                                ? "text-green-400"
                                : p.diff < 0
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {p.diff > 0 ? "+" : ""}
                            {formatCurrency(p.diff)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <h3 className="font-bold text-primary mb-3">Bank</h3>

                {history.bankBalanceBefore !== null &&
                history.bankBalanceBefore !== undefined &&
                history.bankBalanceAfter !== null &&
                history.bankBalanceAfter !== undefined ? (
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">
                        Bankbestand zu Beginn:
                      </span>
                      <span>{formatCurrency(history.bankBalanceBefore)}</span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">
                        Bankbestand am Ende:
                      </span>
                      <span>{formatCurrency(history.bankBalanceAfter)}</span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">
                        Bank Ergebnis
                      </span>
                      <span
                        className={`font-bold ${
                          (history.bankDiff ?? 0) > 0
                            ? "text-green-400"
                            : (history.bankDiff ?? 0) < 0
                              ? "text-red-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {(history.bankDiff ?? 0) > 0 ? "+" : ""}
                        {formatCurrency(history.bankDiff ?? 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Bankdaten nicht verfügbar.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
