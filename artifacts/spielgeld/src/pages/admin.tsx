import React, { useEffect, useState } from "react";
import { Link } from "wouter";

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
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";

type AdminPlayer = {
  id: number;
  name: string;
  chipBalance: number;
  fixumPaid: number;
  createdAt: string;
};

async function adminFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return customFetch<T>(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export default function Admin() {
  const { toast } = useToast();

  const [chips, setChips] = useState<{ value: number | string; quantity: number | string }[]>([]);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (val: number) =>
    val.toFixed(2).replace(".", ",") + " €";

  const loadPlayers = async () => {
    const data = await adminFetch("/admin/players");
    setPlayers(data);
  };

  const loadChipInventory = async () => {
    try {
      const data = await customFetch<{ value: number; quantity: number }[]>("/api/chip-inventory");
      if (Array.isArray(data) && data.length > 0) {
        setChips(data.map((c) => ({ value: c.value, quantity: c.quantity })));
      } else {
        setChips([{ value: "", quantity: "" }]);
      }
    } catch {
      setChips([{ value: "", quantity: "" }]);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadPlayers(), loadChipInventory()]).finally(() =>
      setIsLoading(false),
    );
  }, []);

  const updatePlayer = async (player: AdminPlayer) => {
    try {
      await adminFetch(`/admin/players/${player.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: player.name,
          chipBalance: player.chipBalance,
        }),
      });

      toast({ title: "Gespeichert", description: "Spieler wurde aktualisiert." });
      await loadPlayers();
    } catch {
      toast({ title: "Fehler", description: "Spieler konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const saveInitialBalances = async () => {
    try {
      await adminFetch("/admin/initial-balances", {
        method: "POST",
        body: JSON.stringify({
          balances: players.map((p) => ({
            playerId: p.id,
            chipBalance: p.chipBalance,
          })),
        }),
      });

      toast({ title: "Gespeichert", description: "Initiale Jetonstände wurden gespeichert." });
      await loadPlayers();
    } catch {
      toast({ title: "Fehler", description: "Initialstände konnten nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const saveChipInventory = async () => {
    const validChips = chips
      .map((c) => ({ value: Number(c.value), quantity: Number(c.quantity) }))
      .filter((c) => c.value > 0 && !Number.isNaN(c.value) && !Number.isNaN(c.quantity) && c.quantity >= 0);

    if (validChips.length === 0) {
      toast({ title: "Fehler", description: "Mindestens ein gültiger Chip-Wert erforderlich.", variant: "destructive" });
      return;
    }

    try {
      await adminFetch("/admin/chip-inventory", {
        method: "PUT",
        body: JSON.stringify({ chips: validChips }),
      });
      toast({ title: "Gespeichert", description: "Chipbestand wurde aktualisiert." });
    } catch {
      toast({ title: "Fehler", description: "Chipbestand konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const resetAll = async () => {
    const confirmed = window.confirm(
      "Wirklich ALLES löschen? Spieler, Bank, Spielabende und Historie werden gelöscht.",
    );
    if (!confirmed) return;

    const confirmedAgain = window.confirm(
      "Letzte Warnung: Dieser Reset kann nicht rückgängig gemacht werden.",
    );
    if (!confirmedAgain) return;

    try {
      await adminFetch("/admin/reset", { method: "DELETE" });
      toast({ title: "Reset durchgeführt", description: "Alle Tabellen wurden geleert." });
      await loadPlayers();
    } catch {
      toast({ title: "Fehler", description: "Reset konnte nicht durchgeführt werden.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-border pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
              Administration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Spieler, Startstände und Reset verwalten
            </p>
          </div>

          <Link href="/">
            <Button variant="outline">Zurück</Button>
          </Link>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Spieler bearbeiten</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Lädt...</p>
            ) : players.length === 0 ? (
              <p className="text-muted-foreground">Keine Spieler vorhanden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Aktuelle Jetons</TableHead>
                    <TableHead className="text-right">Fixum</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Input
                          value={player.name}
                          onChange={(e) => {
                            const next = [...players];
                            next[index] = { ...player, name: e.target.value };
                            setPlayers(next);
                          }}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={player.chipBalance}
                          onChange={(e) => {
                            const next = [...players];
                            next[index] = { ...player, chipBalance: Number(e.target.value) };
                            setPlayers(next);
                          }}
                          className="text-right"
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(player.fixumPaid)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button onClick={() => updatePlayer(player)}>Speichern</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {players.length > 0 && (
              <div className="flex justify-end mt-4">
                <Button onClick={saveInitialBalances}>Alle Jetonstände speichern</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verfügbare Chips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Wert (€)</span>
              <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Anzahl</span>
              <span />
            </div>

            {chips.map((chip, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="z.B. 5"
                  value={chip.value}
                  onChange={(e) => {
                    const next = [...chips];
                    next[index] = { ...chip, value: e.target.value };
                    setChips(next);
                  }}
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Anzahl"
                  value={chip.quantity}
                  onChange={(e) => {
                    const next = [...chips];
                    next[index] = { ...chip, quantity: Number(e.target.value) };
                    setChips(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                  onClick={() => setChips(chips.filter((_, i) => i !== index))}
                >
                  ✕
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setChips([...chips, { value: "", quantity: "" }])}
            >
              + Chip-Wert hinzufügen
            </Button>

            <div className="pt-2">
              <Button onClick={saveChipInventory}>Chipbestand speichern</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Kompletter Reset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Löscht Spieler, Bank, Spielabende und Historie vollständig.
            </p>
            <Button variant="destructive" onClick={resetAll}>
              Alles löschen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
