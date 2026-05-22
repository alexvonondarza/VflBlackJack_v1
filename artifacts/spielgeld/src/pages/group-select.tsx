import { useState } from "react";
import { useGroup } from "@/contexts/GroupContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function GroupSelect() {
  const { setGroup } = useGroup();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/groups/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const group = await res.json();
      setGroup(group.id, group.name);
    } catch {
      toast({
        title: "Fehler",
        description: "Gruppe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-mono p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            VflBlackJack
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Spielgeld-Verwaltung
          </p>
        </div>

        <div className="border border-border rounded-lg p-8 bg-card space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-primary uppercase tracking-wider">
              Gruppe auswählen
            </h2>
            <p className="text-sm text-muted-foreground">
              Gib einen Gruppennamen ein. Bestehende Gruppen werden automatisch erkannt.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="groupName"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Gruppenname
              </label>
              <Input
                id="groupName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. VfL Stammtisch"
                className="border-border bg-background focus-visible:ring-primary text-lg"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full font-bold uppercase tracking-wider"
            >
              {isLoading ? "Lädt..." : "Weiter"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/superadmin" className="hover:text-primary transition-colors">
            Superadmin
          </a>
        </p>
      </div>
    </div>
  );
}
