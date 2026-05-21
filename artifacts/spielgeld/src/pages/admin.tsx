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

type AdminPlayer = {
  id: number;
  name: string;
  chipBalance: number;
  fixumPaid: number;
  createdAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function adminFetch(
  path: string,
  password: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

export default function Admin() {
  const { toast } = useToast();

  const [chips, setChips] = useState([
    { value: 1, quantity: 0 },
    { value: 5, quantity: 0 },
    { value: 10, quantity: 0 },
    { value: 20, quantity: 0 },
    { value: 50, quantity: 0 },
    { value: 100, quantity: 0 },
  ]);

  const [password, setPassword] = useState(
    () => localStorage.getItem("adminPassword") || "",
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val: number) =>
    val.toFixed(2).replace(".", ",") + " €";

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault();

    try {
      setIsLoading(true);

      await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error("Passwort falsch");
        }
      });

      localStorage.setItem("adminPassword", password);
      setIsLoggedIn(true);
      await loadPlayers(password);
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Admin-Login fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlayers = async (pw = password) => {
    const data = await adminFetch("/admin/players", pw);
    setPlayers(data);
  };

  const updatePlayer = async (player: AdminPlayer) => {
    try {
      await adminFetch(`/admin/players/${player.id}`, password, {
        method: "PUT",
        body: JSON.stringify({
          name: player.name,
          chipBalance: player.chipBalance,
        }),
      });

      toast({
        title: "Gespeichert",
        description: "Spieler wurde aktualisiert.",
      });

      await loadPlayers();
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Spieler konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const saveInitialBalances = async () => {
    try {
      await adminFetch("/admin/initial-balances", password, {
        method: "POST",
        body: JSON.stringify({
          balances: players.map((p) => ({
            playerId: p.id,
            chipBalance: p.chipBalance,
          })),
        }),
      });

      toast({
        title: "Gespeichert",
        description: "Initiale Jetonstände wurden gespeichert.",
      });

      await loadPlayers();
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Initialstände konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

const saveChipInventory = async () => {
  try {
    await adminFetch("/admin/chip-inventory", password, {
      method: "PUT",
      body: JSON.stringify({ chips }),
    });

    toast({
      title: "Gespeichert",
      description: "Chipbestand wurde aktualisiert.",
    });
  } catch {
    toast({
      title: "Fehler",
      description: "Chipbestand konnte nicht gespeichert werden.",
      variant: "destructive",
    });
  }
};
  
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) return;

    try {
      await fetch(`${API_BASE_URL}/api/admin/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          password,
          newPassword,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error("Passwort konnte nicht geändert werden");
        }
      });

      setPassword(newPassword);
      localStorage.setItem("adminPassword", newPassword);
      setNewPassword("");

      toast({
        title: "Passwort geändert",
        description: "Das neue Admin-Passwort wurde gespeichert.",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Passwort konnte nicht geändert werden.",
        variant: "destructive",
      });
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
      await adminFetch("/admin/reset", password, {
        method: "DELETE",
      });

      toast({
        title: "Reset durchgeführt",
        description: "Alle Tabellen wurden geleert.",
      });

      await loadPlayers();
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Reset konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (password) {
      login();
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="p-4 md:p-8 font-mono">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={login} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Admin-Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password}
                >
                  Einloggen
                </Button>
              </form>

              <p className="text-sm text-muted-foreground mt-4">
                Standard-Passwort beim ersten Start: <strong>admin</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            {players.length === 0 ? (
              <p className="text-muted-foreground">
                Keine Spieler vorhanden.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">
                      Aktuelle Jetons
                    </TableHead>
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
                            next[index] = {
                              ...player,
                              name: e.target.value,
                            };
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
                            next[index] = {
                              ...player,
                              chipBalance: Number(e.target.value),
                            };
                            setPlayers(next);
                          }}
                          className="text-right"
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(player.fixumPaid)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button onClick={() => updatePlayer(player)}>
                          Speichern
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {players.length > 0 && (
              <div className="flex justify-end mt-4">
                <Button onClick={saveInitialBalances}>
                  Alle Jetonstände speichern
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin-Passwort ändern</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="flex gap-4">
              <Input
                type="password"
                placeholder="Neues Passwort"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button type="submit" disabled={!newPassword.trim()}>
                Passwort ändern
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Kompletter Reset
            </CardTitle>
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

        <Card>
  <CardHeader>
    <CardTitle>Verfügbare Chips</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {chips.map((chip, index) => (
      <div key={chip.value} className="flex items-center gap-4">
        <div className="w-24 font-bold">{chip.value} € Chip</div>

        <Input
          type="number"
          min="0"
          value={chip.quantity}
          onChange={(e) => {
            const next = [...chips];
            next[index] = {
              ...chip,
              quantity: Number(e.target.value),
            };
            setChips(next);
          }}
        />
      </div>
    ))}

    <Button onClick={saveChipInventory}>
      Chipbestand speichern
    </Button>
  </CardContent>
</Card>
      </div>
    </div>
  );
}
