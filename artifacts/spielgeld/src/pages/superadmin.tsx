import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";
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
import { Link } from "wouter";

interface Group {
  id: number;
  name: string;
  createdAt: string;
  playerCount: number;
  bankBalance: number;
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const formatCurrency = (val: number) =>
    val.toFixed(2).replace(".", ",") + " €";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await customFetch<Group[]>("/api/superadmin/groups", {
        headers: { "x-superadmin-password": password },
      });
      setGroups(data);
      setIsLoggedIn(true);
    } catch {
      toast({
        title: "Fehler",
        description: "Ungültiges Passwort oder Verbindungsfehler.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const data = await customFetch<Group[]>("/api/superadmin/groups", {
        headers: { "x-superadmin-password": password },
      });
      setGroups(data);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await customFetch(`/api/superadmin/groups/${id}`, {
        method: "DELETE",
        headers: { "x-superadmin-password": password },
      });
      toast({ title: "Gruppe gelöscht" });
      await handleRefresh();
    } catch {
      toast({
        title: "Fehler",
        description: "Gruppe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-mono p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary tracking-tight">
              Superadmin
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              VflBlackJack
            </p>
          </div>

          <div className="border border-border rounded-lg p-8 bg-card space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Superadmin-Passwort
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben..."
                  className="border-border bg-background focus-visible:ring-primary"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full font-bold uppercase tracking-wider"
              >
                {isLoading ? "Prüfe..." : "Anmelden"}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              ← Zurück
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Superadmin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Alle Mandanten verwalten
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="uppercase text-xs font-bold tracking-wider border-border"
            >
              Aktualisieren
            </Button>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="uppercase text-xs font-bold tracking-wider"
              >
                ← Zurück
              </Button>
            </Link>
          </div>
        </header>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-primary uppercase tracking-wider">
              Mandanten ({groups.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Keine Mandanten vorhanden.
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-lg text-foreground">
                        {group.name}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{group.playerCount} Spieler</span>
                        <span>Bank: {formatCurrency(group.bankBalance)}</span>
                        <span>
                          seit{" "}
                          {new Date(group.createdAt).toLocaleDateString(
                            "de-DE",
                          )}
                        </span>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="uppercase text-xs font-bold tracking-wider"
                        >
                          Löschen
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">
                            Mandant löschen?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Alle Daten von <strong className="text-foreground">"{group.name}"</strong> werden
                            unwiderruflich gelöscht — Spieler, Bank, Spielabende, alles.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-background text-foreground border-border hover:bg-muted">
                            Abbrechen
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(group.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Endgültig löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
