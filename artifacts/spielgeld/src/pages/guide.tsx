import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Section = {
  id: string;
  title: string;
  emoji: string;
};

const SECTIONS: Section[] = [
  { id: "ueberblick", title: "Überblick", emoji: "🃏" },
  { id: "erste-schritte", title: "Erste Schritte", emoji: "🚀" },
  { id: "spieler", title: "Spieler verwalten", emoji: "👤" },
  { id: "spielabend", title: "Spielabend starten", emoji: "🎲" },
  { id: "jetons-kaufen", title: "Jetons kaufen", emoji: "💰" },
  { id: "verteilung", title: "Jeton-Verteilung", emoji: "📊" },
  { id: "inventar", title: "Chip-Inventar", emoji: "🗃️" },
  { id: "beenden", title: "Spielabend beenden", emoji: "🏁" },
  { id: "admin", title: "Administration", emoji: "⚙️" },
  { id: "neon", title: "Neon-Datenbank", emoji: "☁️" },
  { id: "faq", title: "Häufige Fragen", emoji: "❓" },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-black/50 border border-border rounded-md p-3 text-sm font-mono overflow-x-auto text-green-400 my-3">
      {children}
    </pre>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-black text-xs font-bold mr-2 shrink-0">
      {n}
    </span>
  );
}

function SectionHeading({
  id,
  emoji,
  title,
}: {
  id: string;
  emoji: string;
  title: string;
}) {
  return (
    <h2
      id={id}
      className="text-xl font-bold text-primary uppercase tracking-wider mt-10 mb-4 flex items-center gap-2 scroll-mt-8"
    >
      <span>{emoji}</span>
      {title}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-foreground mt-6 mb-2 uppercase tracking-wide">
      {children}
    </h3>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-primary pl-4 py-1 text-muted-foreground text-sm my-3">
      {children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/10 border border-primary/30 rounded-md px-4 py-2 text-sm my-3">
      <span className="font-bold text-primary">Tipp: </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-md px-4 py-2 text-sm my-3">
      <span className="font-bold text-red-400">Achtung: </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

export default function Guide() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-mono">
      <div className="mb-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary uppercase tracking-wider">
          VflBlackJack — Anleitung
        </h1>
        <p className="text-muted-foreground mt-2">
          Vollständige Bedienungsanleitung zur Spielgeld-Verwaltung
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar navigation */}
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Inhalt
            </p>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={`text-sm px-3 py-1.5 rounded hover:bg-muted/50 transition-colors ${
                    activeSection === s.id
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.emoji} {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* ───── ÜBERBLICK ───── */}
          <SectionHeading id="ueberblick" emoji="🃏" title="Überblick" />
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">VflBlackJack</strong> ist eine
            Spielgeld-Verwaltung für regelmäßige Blackjack-Spielabende. Die App
            hilft dabei, Chip-Bestände, Spieler-Konten, die Bank und
            Spielsitzungen zentral zu verwalten — ohne Zettelwirtschaft.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {[
              {
                icon: "👤",
                title: "Spieler",
                text: "Dauerhafte Profile mit Chip-Konto und Historien-Übersicht",
              },
              {
                icon: "🎲",
                title: "Spielabende",
                text: "Sessions starten, Teilnehmer verwalten, Abschluss buchen",
              },
              {
                icon: "📊",
                title: "Jeton-Verteilung",
                text: "Automatische Berechnung welche Chips jeder Spieler bekommt",
              },
              {
                icon: "⚙️",
                title: "Administration",
                text: "Chip-Inventar pflegen, Passwort ändern, Daten einsehen",
              },
            ].map((f) => (
              <Card key={f.title} className="border-border bg-card">
                <CardContent className="pt-4">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="font-bold text-foreground">{f.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {f.text}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ───── ERSTE SCHRITTE ───── */}
          <SectionHeading
            id="erste-schritte"
            emoji="🚀"
            title="Erste Schritte"
          />
          <p className="text-muted-foreground mb-4">
            Beim allerersten Start ist die Datenbank leer. Hier die empfohlene
            Reihenfolge:
          </p>

          <div className="space-y-3">
            {[
              {
                n: 1,
                title: "Chip-Inventar festlegen",
                text: 'Administration → mit Passwort "admin" einloggen → Chip-Inventar ausfüllen. Trage ein wie viele Chips du physisch von jeder Sorte hast.',
              },
              {
                n: 2,
                title: "Spieler anlegen",
                text: 'Auf der Übersicht unter "Neuer Spieler" einen Namen eingeben und "Hinzufügen" klicken. Jeden Stammtisch-Spieler einmalig anlegen.',
              },
              {
                n: 3,
                title: "Spielabend starten",
                text: 'Auf "Spielabend" gehen → Sessionname vergeben → "Spielabend starten".',
              },
              {
                n: 4,
                title: "Teilnehmer hinzufügen & Jetons kaufen",
                text: "Spieler für den heutigen Abend auswählen, dann für jeden Spieler Jetons kaufen.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-3 bg-card border border-border rounded-md p-4"
              >
                <StepBadge n={step.n} />
                <div>
                  <div className="font-bold text-foreground">{step.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {step.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ───── SPIELER ───── */}
          <SectionHeading id="spieler" emoji="👤" title="Spieler verwalten" />

          <SubHeading>Spieler anlegen</SubHeading>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Auf der <strong className="text-foreground">Übersicht</strong>{" "}
            rechts oben das Formular „Neuer Spieler" ausfüllen. Der Name muss
            eindeutig sein. Ein Spieler-Profil bleibt dauerhaft erhalten und
            nimmt an beliebig vielen Spielabenden teil.
          </p>

          <SubHeading>Spieler-Historie</SubHeading>
          <div className="text-muted-foreground text-sm leading-relaxed">
            Über den Button{" "}
            <Badge
              variant="outline"
              className="font-mono text-xs border-border"
            >
              Historie
            </Badge>{" "}
            in der Spielerliste öffnet sich ein Dialog mit allen vergangenen
            Sessions — inklusive Kontostand davor/danach und Differenz.
          </div>

          <SubHeading>Spieler auszahlen & löschen</SubHeading>
          <div className="text-muted-foreground text-sm leading-relaxed">
            Mit{" "}
            <Badge
              variant="outline"
              className="font-mono text-xs border-border"
            >
              Auszahlen & Löschen
            </Badge>{" "}
            wird der aktuelle Chip-Kontostand des Spielers an die Bank
            zurückgebucht und das Profil endgültig entfernt. Dies ist
            unwiderruflich.
          </div>
          <Warning>
            Ein gelöschter Spieler kann nicht wiederhergestellt werden. Die
            Historien-Einträge bleiben aber im System erhalten.
          </Warning>

          {/* ───── SPIELABEND ───── */}
          <SectionHeading
            id="spielabend"
            emoji="🎲"
            title="Spielabend starten"
          />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Navigiere zu{" "}
            <strong className="text-foreground">Spielabend</strong>. Solange
            kein Spielabend aktiv ist, siehst du das Formular zum Starten.
          </p>

          <div className="space-y-3">
            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-foreground mb-1">
                Session benennen
              </div>
              <p className="text-sm text-muted-foreground">
                Der Vorschlag-Name ist Datum + Uhrzeit (z. B.{" "}
                <code className="text-primary">22.05.2026, 20:00</code>). Du
                kannst ihn frei anpassen, z. B.{" "}
                <code className="text-primary">Spielabend Mai</code>.
              </p>
            </div>

            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-foreground mb-1">
                Teilnehmer auswählen
              </div>
              <p className="text-sm text-muted-foreground">
                Nach dem Start erscheint die Karte „Spieler hinzufügen". Dort
                bekannte Spieler per Checkbox auswählen und auf{" "}
                <strong>„Spieler ins Spiel übernehmen"</strong> klicken. Neue
                Spieler können direkt über den Button{" "}
                <strong>„+ Neuen Spieler anlegen & hinzufügen"</strong>{" "}
                angelegt werden.
              </p>
            </div>

            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-foreground mb-1">
                Nachträgliches Hinzufügen
              </div>
              <p className="text-sm text-muted-foreground">
                Kommt jemand später dazu? Kein Problem — die Karte „Spieler
                hinzufügen" bleibt während des gesamten Spielabends sichtbar.
                Einfach hinzufügen und dann Jetons kaufen.
              </p>
            </div>
          </div>

          {/* ───── JETONS KAUFEN ───── */}
          <SectionHeading
            id="jetons-kaufen"
            emoji="💰"
            title="Jetons kaufen"
          />
          <div className="text-muted-foreground text-sm leading-relaxed mb-4">
            In der Teilnehmerliste des aktiven Spielabends hat jeder Spieler
            einen Button{" "}
            <Badge
              variant="outline"
              className="font-mono text-xs border-border"
            >
              Jetons kaufen
            </Badge>
            .
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-primary mb-2">
                Beispiel: Ersteinkauf
              </div>
              <p className="text-sm text-muted-foreground">
                Spieler „Max" zahlt 10 € ein. Im Dialog{" "}
                <strong>Betrag: 10,00</strong> eingeben →{" "}
                <strong>Fixum-Checkbox</strong> aktiv lassen → Bestätigen.
                <br />
                <br />
                Max' Konto: <span className="text-primary">10,00 €</span>
                <br />
                Fixum (eingekauft): <span className="text-primary">
                  10,00 €
                </span>
              </p>
            </div>

            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-primary mb-2">
                Beispiel: Nachkauf (Rebuy)
              </div>
              <p className="text-sm text-muted-foreground">
                Max hat seine Chips verloren und kauft nochmal 5 € nach. Im
                Dialog <strong>Betrag: 5,00</strong> eingeben →{" "}
                <strong>Fixum-Checkbox</strong> nach Vereinbarung → Bestätigen.
                <br />
                <br />
                Max' Konto: <span className="text-primary">5,00 €</span>
                <br />
                Fixum: bleibt bei 10 € (nur Erstbetrag)
              </p>
            </div>
          </div>

          <Tip>
            Das Fixum ist der Betrag, den ein Spieler zu Beginn eingekauft hat.
            Es dient als Vergleichswert beim Spielabend-Abschluss (Gewinn/
            Verlust-Berechnung).
          </Tip>

          {/* ───── VERTEILUNG ───── */}
          <SectionHeading
            id="verteilung"
            emoji="📊"
            title="Jeton-Verteilung"
          />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Die Tabelle „Jeton-Verteilung" zeigt für jeden Teilnehmer (und die
            Bank) automatisch, wie ihr Betrag optimal auf die verfügbaren
            Chip-Sorten aufgeteilt werden soll.
          </p>

          <SubHeading>Algorithmus</SubHeading>
          <div className="bg-card border border-border rounded-md p-4 text-sm">
            <div className="space-y-2 text-muted-foreground">
              <div className="flex gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                  Schritt 1
                </Badge>
                <span>
                  Jeder Teilnehmer erhält{" "}
                  <strong className="text-foreground">
                    10–15 Chips à 0,10 €
                  </strong>{" "}
                  und{" "}
                  <strong className="text-foreground">
                    10–15 Chips à 0,25 €
                  </strong>{" "}
                  — sofern der Betrag das hergibt.
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                  Schritt 2
                </Badge>
                <span>
                  Der Restbetrag wird mit größeren Chips aufgefüllt:{" "}
                  <strong className="text-foreground">5 € → 1 € → 0,50 €</strong>
                  . 0,05 €-Chips werden nur als letztes Mittel genutzt.
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                  Bank
                </Badge>
                <span>
                  Die Bank-Zeile zeigt, wie das Bankgeld (Summe aller Fixums +
                  Nicht-Teilnehmer-Jetons) aufgeteilt wird.
                </span>
              </div>
            </div>
          </div>

          <SubHeading>Beispiel: 2 Spieler</SubHeading>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-normal">
                    Spieler
                  </th>
                  <th className="text-right py-2 pr-4 text-muted-foreground font-normal">
                    Betrag
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-normal">
                    Verteilung
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Anna",
                    betrag: "5,00 €",
                    chips: "10× 0,10 €, 10× 0,25 €, 1× 0,50 €, 1× 1,00 €",
                  },
                  {
                    name: "Ben",
                    betrag: "10,00 €",
                    chips:
                      "10× 0,10 €, 10× 0,25 €, 1× 0,50 €, 1× 1,00 €, 1× 5,00 €",
                  },
                  {
                    name: "Bank",
                    betrag: "15,00 €",
                    chips:
                      "10× 0,10 €, 10× 0,25 €, 1× 0,50 €, 1× 1,00 €, 2× 5,00 €",
                  },
                ].map((r) => (
                  <tr key={r.name} className="border-b border-border">
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-4 text-right text-primary">
                      {r.betrag}
                    </td>
                    <td className="py-2 text-muted-foreground">{r.chips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Note>
            Die Verteilung ist eine Empfehlung — sie zeigt wie du die Chips
            physisch austeilen solltest. Abweichungen sind jederzeit möglich.
          </Note>

          {/* ───── INVENTAR ───── */}
          <SectionHeading id="inventar" emoji="🗃️" title="Chip-Inventar" />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Das Chip-Inventar wird unter{" "}
            <strong className="text-foreground">Administration</strong>{" "}
            gepflegt. Dort trägst du ein wie viele Chips du von jeder Sorte
            physisch besitzt.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { wert: "0,05 €", farbe: "text-red-400" },
              { wert: "0,10 €", farbe: "text-blue-400" },
              { wert: "0,25 €", farbe: "text-green-400" },
              { wert: "0,50 €", farbe: "text-yellow-400" },
              { wert: "1,00 €", farbe: "text-orange-400" },
              { wert: "5,00 €", farbe: "text-primary" },
            ].map((c) => (
              <div
                key={c.wert}
                className="bg-card border border-border rounded-md p-3 text-center"
              >
                <div className={`text-lg font-bold ${c.farbe}`}>{c.wert}</div>
                <div className="text-xs text-muted-foreground mt-1">Chip</div>
              </div>
            ))}
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Auf der Spielabend-Seite siehst du unterhalb der
            Verteilungstabelle den aktuellen Restbestand nach Verteilung. Chips
            mit weniger als 10 Stück werden rot markiert.
          </p>

          <Tip>
            Standardmäßig sind 200 Stück je 0,05–0,25 € und 150 Stück je
            0,50–1,00 € und 60 Stück 5,00 € voreingestellt. Passe das auf
            dein tatsächliches Chipset an.
          </Tip>

          {/* ───── BEENDEN ───── */}
          <SectionHeading
            id="beenden"
            emoji="🏁"
            title="Spielabend beenden"
          />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Am Ende des Abends klickst du auf{" "}
            <strong className="text-foreground">„Spielabend beenden"</strong>.
            Ein Dialog öffnet sich zur Auszahlungs-Eingabe.
          </p>

          <div className="space-y-3">
            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-foreground mb-2">
                Schlussabrechnung
              </div>
              <p className="text-sm text-muted-foreground">
                Für jeden Spieler wird angezeigt wie viele Chips er noch hat
                (Kontostand). Du gibst den tatsächlichen Auszahlungsbetrag ein
                — üblicherweise genau der Kontostand. Der Unterschied zum Fixum
                ergibt Gewinn oder Verlust.
              </p>
            </div>

            <div className="bg-card border border-border rounded-md p-4">
              <div className="font-bold text-sm text-foreground mb-2">
                Beispiel: Abschluss
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  Anna hat 7,50 € übrig (Fixum: 5,00 €) →{" "}
                  <span className="text-green-500">+2,50 € Gewinn</span>
                </div>
                <div>
                  Ben hat 3,00 € übrig (Fixum: 10,00 €) →{" "}
                  <span className="text-red-400">−7,00 € Verlust</span>
                </div>
              </div>
            </div>
          </div>

          <Note>
            Nach dem Beenden wird die Session archiviert und erscheint in der
            Historien-Ansicht jedes Spielers. Die Spieler-Konten werden auf den
            neuen Stand aktualisiert.
          </Note>

          {/* ───── ADMIN ───── */}
          <SectionHeading id="admin" emoji="⚙️" title="Administration" />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Erreichbar über den Menü-Punkt{" "}
            <strong className="text-foreground">Administration</strong>. Login
            mit dem Admin-Passwort (Standard:{" "}
            <code className="text-primary">admin</code>).
          </p>

          <div className="space-y-3">
            {[
              {
                title: "Chip-Inventar",
                text: "Anzahl der Chips pro Denomination einstellen. Diese Werte werden für die automatische Verteilungsberechnung verwendet.",
              },
              {
                title: "Spieler-Übersicht",
                text: "Alle Spieler mit vollem Kontostand und Historien — nützlich für Übersicht ohne die Hauptseite.",
              },
              {
                title: "Passwort ändern",
                text: "Das Admin-Passwort kann jederzeit geändert werden. Es gibt kein Zurücksetzen ohne Datenbankzugriff — also merken!",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border rounded-md p-4"
              >
                <div className="font-bold text-sm text-foreground mb-1">
                  {item.title}
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <Warning>
            Das Standard-Passwort <code>admin</code> sollte beim ersten Login
            sofort geändert werden — besonders wenn die App öffentlich erreichbar
            ist.
          </Warning>

          {/* ───── NEON ───── */}
          <SectionHeading
            id="neon"
            emoji="☁️"
            title="Neon-Datenbank einrichten"
          />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Die integrierte Replit-Datenbank ist für die Entwicklung geeignet.
            Für den dauerhaften Betrieb (Deployment) empfehlen wir{" "}
            <strong className="text-foreground">Neon</strong> — eine
            kostenlose serverlose PostgreSQL-Datenbank.
          </p>

          <SubHeading>Schritt 1 — Neon-Account & Datenbank anlegen</SubHeading>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <StepBadge n={1} />
              <span>
                Gehe auf{" "}
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  neon.tech
                </a>{" "}
                und registriere dich (kostenlos, kein Kreditkarte nötig)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <StepBadge n={2} />
              <span>
                Neues Projekt anlegen → Region wählen (z. B.{" "}
                <em>eu-central-1</em> für Europa)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <StepBadge n={3} />
              <span>
                Im Dashboard auf{" "}
                <strong className="text-foreground">
                  „Connection string"
                </strong>{" "}
                klicken → Format{" "}
                <code className="text-primary">psql</code> wählen → URL
                kopieren
              </span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mt-3 mb-1">
            Die Connection-String sieht so aus:
          </p>
          <CodeBlock>
            {`postgresql://neondb_owner:AbcXyz123@ep-cool-name-a2b3c.eu-central-1.aws.neon.tech/neondb?sslmode=require`}
          </CodeBlock>

          <SubHeading>Schritt 2 — DATABASE_URL in Replit setzen</SubHeading>
          <p className="text-muted-foreground text-sm mb-2">
            In deinem Replit-Projekt das Schloss-Symbol (Secrets) in der linken
            Leiste öffnen. Den Secret{" "}
            <code className="text-primary">DATABASE_URL</code> bearbeiten und
            den Neon-Connection-String einfügen.
          </p>
          <Warning>
            Die alte Replit-PostgreSQL-URL wird dadurch überschrieben. Alle
            neuen Datenbankzugriffe laufen dann gegen Neon.
          </Warning>

          <SubHeading>Schritt 3 — Schema auf Neon übertragen</SubHeading>
          <p className="text-muted-foreground text-sm mb-2">
            Einmalig im Replit-Shell ausführen:
          </p>
          <CodeBlock>{`pnpm --filter @workspace/db run push`}</CodeBlock>
          <p className="text-muted-foreground text-sm">
            Das legt alle Tabellen auf Neon an. Die Ausgabe sollte mit{" "}
            <code className="text-primary">✓ Changes applied</code> oder{" "}
            <code className="text-primary">No changes detected</code> enden.
          </p>

          <SubHeading>Schritt 4 — App deployen</SubHeading>
          <p className="text-muted-foreground text-sm mb-2">
            Jetzt kannst du die App über Replit veröffentlichen (Deploy-Button
            oben rechts). Die deployed App nutzt automatisch die
            Neon-Datenbank, da <code className="text-primary">DATABASE_URL</code>{" "}
            als Secret gesetzt ist.
          </p>

          <div className="bg-card border border-border rounded-md p-4 mt-4">
            <div className="font-bold text-sm text-primary mb-2">
              Zusammenfassung
            </div>
            <div className="space-y-1 text-sm text-muted-foreground font-mono">
              <div>
                1.{" "}
                <span className="text-foreground">
                  neon.tech → Projekt anlegen → Connection string kopieren
                </span>
              </div>
              <div>
                2.{" "}
                <span className="text-foreground">
                  Replit Secrets → DATABASE_URL → Neon-URL einfügen
                </span>
              </div>
              <div>
                3.{" "}
                <span className="text-foreground">
                  Shell:{" "}
                  <code className="text-primary">
                    pnpm --filter @workspace/db run push
                  </code>
                </span>
              </div>
              <div>
                4.{" "}
                <span className="text-foreground">Deploy → fertig ✓</span>
              </div>
            </div>
          </div>

          {/* ───── FAQ ───── */}
          <SectionHeading
            id="faq"
            emoji="❓"
            title="Häufige Fragen"
          />

          <div className="space-y-4">
            {[
              {
                q: 'Die Verteilung zeigt nur "–" an.',
                a: 'Stelle sicher dass: (1) das Chip-Inventar unter Administration ausgefüllt ist, (2) der Spieler Chips gekauft hat (Betrag > 0) und (3) ein Spielabend aktiv ist. Bei Verbindungsproblemen hilft ein Seiten-Reload.',
              },
              {
                q: "Wie ändere ich das Admin-Passwort?",
                a: 'Administration → einloggen → Bereich "Passwort ändern" → altes und neues Passwort eingeben → Bestätigen.',
              },
              {
                q: "Kann ich einen Spieler aus einem laufenden Spielabend entfernen?",
                a: 'Ja — in der Teilnehmerliste gibt es den Button "Entfernen". Achtung: kein Fixum wird dabei zurückgebucht. Chip-Kontostand bleibt erhalten.',
              },
              {
                q: "Was passiert wenn drizzle-kit nicht gefunden wird?",
                a: (
                  <>
                    Nicht direkt{" "}
                    <code className="text-primary">drizzle-kit</code> aufrufen,
                    sondern immer über pnpm:
                    <CodeBlock>
                      {`pnpm --filter @workspace/db run push`}
                    </CodeBlock>
                  </>
                ),
              },
              {
                q: "Wie exportiere ich alle Daten?",
                a: 'Auf der Übersicht den Button "Alle Daten als PDF exportieren" klicken. Das PDF enthält alle Spieler, Kontostände und Historien.',
              },
              {
                q: "Mehrere Spielabende gleichzeitig?",
                a: "Nein — es kann immer nur ein Spielabend gleichzeitig aktiv sein. Der aktuelle muss erst beendet werden, bevor ein neuer gestartet werden kann.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="bg-card border border-border rounded-md group"
              >
                <summary className="px-4 py-3 cursor-pointer font-medium text-sm text-foreground hover:text-primary list-none flex justify-between items-center">
                  {item.q}
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            VflBlackJack — Spielgeld-Verwaltung
          </div>
        </main>
      </div>
    </div>
  );
}
