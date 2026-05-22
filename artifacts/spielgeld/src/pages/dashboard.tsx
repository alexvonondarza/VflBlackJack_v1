import React, { useState } from "react";
import { Link } from "wouter";
import {
  useGetBank,
  useGetStats,
  useListPlayers,
  useListGameSessions,
  useCreatePlayer,
  useDeletePlayer,
  useBuyChips,
  useGetActiveSession,
  useGetPlayerHistory,
  getGetBankQueryKey,
  getGetStatsQueryKey,
  getListPlayersQueryKey,
} from "@workspace/api-client-react";
import { generatePdf } from "@/lib/exportPdf";
import { groupFetch } from "@/lib/groupFetch";
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
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bank, isLoading: isBankLoading } = useGetBank();
  const { data: stats, isLoading: isStatsLoading } = useGetStats();
  const { data: players, isLoading: isPlayersLoading } = useListPlayers();
  const { data: activeSession } = useGetActiveSession();
  const { data: gameSessions } = useListGameSessions();

  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const buyChips = useBuyChips();

  const [newPlayerName, setNewPlayerName] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (val: number) => {
    return val.toFixed(2).replace(".", ",") + " €";
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);

      const endedSessions =
        gameSessions?.filter((s) => s.status === "ended") ?? [];

      const sessionsWithDetails = await Promise.all(
        endedSessions.map(async (s) => {
          try {
            return await groupFetch(`/api/game-sessions/${s.id}/history`);
          } catch {
            return {
              name: s.name,
              endedAt: s.endedAt,
              bankBalanceBefore: null,
              bankBalanceAfter: null,
              bankDiff: null,
              players: [],
            };
          }
        }),
      );

      generatePdf({
        bankBalance: stats?.bankBalance ?? bank?.balance ?? 0,
        totalChipsInPlay: stats?.totalChipsInPlay ?? 0,
        totalInCirculation: stats?.totalInCirculation ?? 0,
        players:
          players?.map((p) => ({
            name: p.name,
            chipBalance: p.chipBalance,
            fixumPaid: p.fixumPaid,
          })) ?? [],
        sessions: sessionsWithDetails,
      });
    } catch {
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlayerName.trim()) return;

    createPlayer.mutate(
      { data: { name: newPlayerName.trim() } },
      {
        onSuccess: () => {
          setNewPlayerName("");

          queryClient.invalidateQueries({
            queryKey: getListPlayersQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetBankQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetStatsQueryKey(),
          });
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

  const handleDeletePlayer = (id: number) => {
    deletePlayer.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListPlayersQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetBankQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetStatsQueryKey(),
          });
        },
        onError: () => {
          toast({
            title: "Fehler",
            description: "Spieler konnte nicht gelöscht werden.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleBuyChips = (
    id: number,
    amount: number,
    onSuccessCb: () => void,
  ) => {
    buyChips.mutate(
      { id, data: { amount } },
      {
        onSuccess: () => {
          onSuccessCb();

          queryClient.invalidateQueries({
            queryKey: getListPlayersQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetBankQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetStatsQueryKey(),
          });
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

  return (
    <div className="p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        {activeSession && (
          <Link href="/session" className="block">
            <Card className="border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="default"
                    className="bg-orange-500 text-white uppercase tracking-wider font-bold"
                  >
                    Aktiv
                  </Badge>
                  <span className="font-bold text-lg text-primary">
                    {activeSession.name}
                  </span>
                </div>

                <div className="text-muted-foreground uppercase text-sm tracking-wider font-bold">
                  Zum Spielabend →
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
              VflBlackJack
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Spielgeld-Verwaltung
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">
                Im Umlauf gesamt
              </p>

              {isBankLoading || isStatsLoading ? (
                <Skeleton className="h-10 w-40 ml-auto" />
              ) : (
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  {formatCurrency(stats?.totalInCirculation ?? 0)}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="border-primary/50 text-primary hover:bg-primary/10 uppercase tracking-wider text-xs"
            >
              {isExporting ? "Erstelle PDF..." : "Alle Daten als PDF exportieren"}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-primary uppercase tracking-wider">
                Statistik
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Anzahl Spieler</span>

                {isStatsLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <span className="font-bold text-lg">
                    {stats?.playerCount ?? 0}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Summe Bank</span>

                {isStatsLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <span className="font-bold text-lg">
                    {formatCurrency(stats?.bankBalance ?? 0)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">
                  Summe aller Jetons
                </span>

                {isStatsLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <span className="font-bold text-lg">
                    {formatCurrency(stats?.totalChipsInPlay ?? 0)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-primary uppercase tracking-wider">
                Neuer Spieler
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreatePlayer} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label
                    htmlFor="playerName"
                    className="text-sm text-muted-foreground uppercase tracking-wider"
                  >
                    Name
                  </label>

                  <Input
                    id="playerName"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Spielername eingeben..."
                    className="border-border bg-background focus-visible:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={createPlayer.isPending || !newPlayerName.trim()}
                  className="font-bold uppercase tracking-wider w-32"
                >
                  Hinzufügen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-primary uppercase tracking-wider">
              Spielerliste
            </CardTitle>
          </CardHeader>

          <CardContent>
            {isPlayersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : players?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Keine aktiven Spieler vorhanden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground uppercase tracking-wider font-bold">
                        Name
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">
                        Jetons
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">
                        Eingekauft (Fixum)
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground uppercase tracking-wider font-bold">
                        Aktionen
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {players?.map((player) => (
                      <TableRow
                        key={player.id}
                        className="border-border hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium text-lg">
                          {player.name}
                        </TableCell>

                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(player.chipBalance)}
                        </TableCell>

                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(player.fixumPaid)}
                        </TableCell>

                        <TableCell className="text-right space-x-2">
                          <PlayerHistoryDialog
                            playerId={player.id}
                            playerName={player.name}
                            formatCurrency={formatCurrency}
                          />

                          <BuyChipsDialog
                            player={player}
                            onBuy={(amount, cb) =>
                              handleBuyChips(player.id, amount, cb)
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
                                Auszahlen & Löschen
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">
                                  Spieler auszahlen?
                                </AlertDialogTitle>

                                <AlertDialogDescription asChild>
                                  <div className="text-muted-foreground space-y-3">
                                    <p>
                                      Soll {player.name} wirklich ausgezahlt
                                      und gelöscht werden?
                                    </p>
                                    <div className="rounded-md border border-border bg-background p-3 space-y-2 text-sm">
                                      <div className="flex justify-between items-center">
                                        <span>Jetonbetrag (Auszahlung):</span>
                                        <strong className="text-foreground">
                                          {formatCurrency(player.chipBalance)}
                                        </strong>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span>Fixum (wird aus Bank entfernt):</span>
                                        <strong className="text-foreground">
                                          −{formatCurrency(player.fixumPaid)}
                                        </strong>
                                      </div>
                                      <div className="flex justify-between items-center border-t border-border pt-2">
                                        <span>Reduktion Im Umlauf:</span>
                                        <strong className="text-destructive">
                                          −{formatCurrency(player.chipBalance + player.fixumPaid)}
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-background text-foreground border-border hover:bg-muted">
                                  Abbrechen
                                </AlertDialogCancel>

                                <AlertDialogAction
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Bestätigen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="flex justify-between items-center pt-2 pb-4 border-t border-border">
          <Link
            href="/anleitung"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            📖 Bedienungsanleitung
          </Link>
          <span className="text-xs text-muted-foreground">
            VflBlackJack — Spielgeld-Verwaltung
          </span>
        </footer>
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
  const [amount, setAmount] = useState<string>("");
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

function PlayerHistoryDialog({
  playerId,
  playerName,
  formatCurrency,
}: {
  playerId: number;
  playerName: string;
  formatCurrency: (val: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const { data: history, isLoading } = useGetPlayerHistory(playerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="uppercase text-xs font-bold tracking-wider"
        >
          Historie
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wider">
            {playerName} — Bilanz-Historie
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Spielabende abgeschlossen.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="font-bold text-muted-foreground">
                    Spielabend
                  </TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">
                    Vorher
                  </TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">
                    Nachher
                  </TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">
                    Differenz
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {history.map((snapshot) => {
                  const diffColor =
                    snapshot.difference > 0
                      ? "text-green-500"
                      : snapshot.difference < 0
                        ? "text-red-500"
                        : "text-muted-foreground";

                  const diffPrefix = snapshot.difference > 0 ? "+" : "";

                  return (
                    <TableRow key={snapshot.id} className="border-border">
                      <TableCell>{snapshot.sessionName}</TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(snapshot.balanceBefore)}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(snapshot.balanceAfter)}
                      </TableCell>

                      <TableCell className={`text-right font-bold ${diffColor}`}>
                        {diffPrefix}
                        {formatCurrency(snapshot.difference)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
