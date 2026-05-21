import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "..", "Anleitung-VflBlackJack.pdf");

const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
doc.pipe(fs.createWriteStream(outputPath));

const PRIMARY = "#1a1a2e";
const ACCENT = "#e63946";
const MUTED = "#555555";
const LIGHT = "#f5f5f5";
const WHITE = "#ffffff";

function pageWidth() {
  return doc.page.width - 100;
}

function heading1(text) {
  doc.fontSize(22).fillColor(PRIMARY).font("Helvetica-Bold").text(text);
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(ACCENT).lineWidth(2).stroke();
  doc.moveDown(0.5);
}

function heading2(text) {
  doc.fontSize(14).fillColor(ACCENT).font("Helvetica-Bold").text(text);
  doc.moveDown(0.3);
}

function heading3(text) {
  doc.fontSize(11).fillColor(PRIMARY).font("Helvetica-Bold").text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.fontSize(10).fillColor(MUTED).font("Helvetica").text(text, { lineGap: 3 });
  doc.moveDown(0.4);
}

function bullet(items) {
  items.forEach((item) => {
    const x = doc.x;
    doc.fontSize(10).fillColor(ACCENT).font("Helvetica-Bold").text("•", x, doc.y, { continued: true, width: 15 });
    doc.fillColor(MUTED).font("Helvetica").text("  " + item, { lineGap: 2 });
  });
  doc.moveDown(0.4);
}

function infoBox(title, text) {
  const boxX = 50;
  const boxY = doc.y;
  const boxW = pageWidth();
  const contentX = boxX + 12;
  const contentW = boxW - 24;

  doc.save();
  doc.rect(boxX, boxY, boxW, 14).fill(PRIMARY);
  doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold")
    .text(title, contentX, boxY + 3, { width: contentW });
  doc.restore();

  const textY = boxY + 18;
  doc.save();
  doc.rect(boxX, textY, boxW, 0.1).fill(LIGHT);
  doc.restore();

  doc.moveDown(1.6);
  const startY = doc.y;
  doc.fontSize(9.5).fillColor(MUTED).font("Helvetica").text(text, contentX, startY, { width: contentW, lineGap: 3 });
  const endY = doc.y + 8;

  doc.save();
  doc.rect(boxX, textY, boxW, endY - textY).fill(LIGHT).stroke();
  doc.restore();

  doc.fontSize(9.5).fillColor(MUTED).font("Helvetica").text(text, contentX, startY, { width: contentW, lineGap: 3 });
  doc.moveDown(0.8);
}

function step(number, title, description) {
  const x = 50;
  const circleY = doc.y + 6;
  doc.circle(x + 10, circleY, 10).fill(ACCENT);
  doc.fontSize(10).fillColor(WHITE).font("Helvetica-Bold")
    .text(String(number), x + 5, circleY - 6, { width: 12, align: "center" });
  doc.fontSize(11).fillColor(PRIMARY).font("Helvetica-Bold")
    .text(title, x + 26, circleY - 7);
  doc.fontSize(9.5).fillColor(MUTED).font("Helvetica")
    .text(description, x + 26, doc.y + 2, { width: pageWidth() - 26, lineGap: 2 });
  doc.moveDown(0.7);
}

function divider() {
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#dddddd").lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

// ─── DECKBLATT ───────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 200).fill(PRIMARY);
doc.fontSize(32).fillColor(WHITE).font("Helvetica-Bold")
  .text("VflBlackJack", 50, 60, { align: "center" });
doc.fontSize(16).fillColor(ACCENT).font("Helvetica")
  .text("Spielgeld-Verwaltung", 50, 100, { align: "center" });
doc.fontSize(10).fillColor("#aaaaaa").font("Helvetica")
  .text("Benutzerhandbuch", 50, 130, { align: "center" });

doc.moveDown(7);

body("Diese Anleitung erklärt alle Funktionen der VflBlackJack Spielgeld-Verwaltungs-App – von der Ersteinrichtung über die Spielabendverwaltung bis zum Abschluss.");

divider();

// ─── ÜBERSICHT ────────────────────────────────────────────────────────────────
heading1("1. Übersicht");

body("Die App besteht aus drei Bereichen:");

doc.fontSize(10).fillColor(MUTED).font("Helvetica");
const cols = [
  ["Dashboard", "Spieler verwalten, Jetons kaufen, PDF-Export"],
  ["Spielabend", "Session starten, Spieler hinzufügen, Jeton-Verteilung, Abschluss"],
  ["Administration", "Chipbestand, Spieler korrigieren, Passwort, Reset"],
];
cols.forEach(([name, desc]) => {
  doc.fontSize(10).fillColor(PRIMARY).font("Helvetica-Bold").text(name, 60, doc.y, { continued: true, width: 100 });
  doc.fillColor(MUTED).font("Helvetica").text("  —  " + desc, { lineGap: 2 });
});
doc.moveDown(0.8);

// ─── ERSTEINRICHTUNG ─────────────────────────────────────────────────────────
doc.addPage();
heading1("2. Ersteinrichtung");

body("Vor dem ersten Spielabend müssen Chipbestand und Passwort konfiguriert werden.");

heading2("2.1 Admin-Login");
body("Standardpasswort beim ersten Start: admin");
body("Zur Admin-Seite navigieren → Passwort eingeben → Einloggen klicken.");

infoBox("WICHTIG", "Das Standard-Passwort sollte sofort nach dem ersten Login geändert werden (Abschnitt \"Admin-Passwort ändern\").");

heading2("2.2 Chipbestand einrichten");
body("Im Admin-Bereich unter \"Verfügbare Chips\" den physischen Chip-Vorrat eintragen:");
bullet([
  "\"+ Chip-Wert hinzufügen\" klicken",
  "Wert eingeben (z.B. 0.25, 1, 5, 10, 25, 50)",
  "Anzahl der vorhandenen Chips dieser Größe eingeben",
  "Für jede Chip-Größe wiederholen",
  "\"Chipbestand speichern\" klicken",
]);

infoBox("HINWEIS", "Dezimalwerte wie 0.25 sind erlaubt. Die Jeton-Verteilungslogik beim Spielabend nutzt genau diesen Bestand, um die Chips fair und von klein nach groß auf die Spieler aufzuteilen.");

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
doc.addPage();
heading1("3. Dashboard");

body("Das Dashboard ist die Startseite. Hier sieht man auf einen Blick den Gesamtzustand der Kasse.");

heading2("3.1 Statistik-Übersicht");
bullet([
  "Im Umlauf gesamt – Summe aller Jetons (Bank + Spieler)",
  "Anzahl Spieler – aktive Spieleranzahl",
  "Summe Bank – aktueller Bankbestand",
  "Summe aller Jetons – Jetons in Spielerhand",
]);

heading2("3.2 Spieler hinzufügen");
body("Namen eingeben → \"Hinzufügen\" klicken. Pro neuem Spieler wird automatisch ein Fixum (Eintritt) von der Bank abgebucht und dem Spieler gutgeschrieben.");

heading2("3.3 Jetons kaufen");
body("In der Spielerliste → \"Jetons kaufen\" → Betrag eingeben oder Schnellbetrag wählen → \"Kaufen\". Der Betrag wird von der Bank abgezogen und dem Spieler gutgeschrieben.");

heading2("3.4 Spieler auszahlen & löschen");
body("\"Auszahlen & Löschen\" entfernt den Spieler. Sein Jeton-Guthaben wird von der Bank wieder eingebucht. Zweifache Bestätigung erforderlich.");

heading2("3.5 Bilanz-Historie");
body("\"Historie\" zeigt pro Spieler eine Tabelle aller abgeschlossenen Spielabende mit Vorher/Nachher/Differenz.");

heading2("3.6 PDF-Export");
body("\"Alle Daten als PDF exportieren\" erstellt ein Dokument mit aktuellem Stand aller Spieler und der vollständigen Spielabend-Historie.");

// ─── SPIELABEND ──────────────────────────────────────────────────────────────
doc.addPage();
heading1("4. Spielabend");

body("Hier wird ein Spielabend von Anfang bis Ende verwaltet.");

heading2("4.1 Spielabend starten");
body("Auf der Spielabend-Seite: Name eingeben (Vorbelegung mit aktuellem Datum+Uhrzeit) → \"Spielabend starten\".");

heading2("4.2 Spieler hinzufügen");
body("Sobald ein Spielabend aktiv ist, können Spieler beitreten:");
bullet([
  "Vorhandene Spieler per Checkbox auswählen → \"Spieler ins Spiel übernehmen\"",
  "Neuen Spieler direkt anlegen und sofort hinzufügen",
  "Spieler können auch während des Abends noch beitreten",
]);

heading2("4.3 Jeton-Verteilung");
body("Die Tabelle zeigt automatisch, wie viele Chips welcher Größe jeder Spieler bekommt – basierend auf seinem Jeton-Stand und dem verfügbaren Chipbestand.");
infoBox("ALGORITHMUS", "Die Verteilung beginnt mit den kleinsten Chips und verteilt proportional: Wenn nicht genug Chips einer Größe für alle reichen, bekommt jeder seinen fairen Anteil. In der \"Rest\"-Spalte steht, wie viel eines Spielers Betrag nicht durch die verfügbaren Chips abgedeckt werden konnte.");

heading2("4.4 Spieler entfernen");
body("Spieler können während des Abends wieder entfernt werden (kein Fixum-Abzug, keine Rückbuchung).");

heading2("4.5 Spielabend abschließen");

body("\"Spielabend beenden\" öffnet den Abschluss-Dialog:");
[
  ["1", "Chips einsammeln", "Alle Chips einsammeln und pro Spieler zählen"],
  ["2", "Endsaldo eingeben", "Den gezählten Chip-Betrag pro Spieler eintragen"],
  ["3", "Bestätigen", "\"Spielabend abschließen\" klicken"],
].forEach(([n, t, d]) => step(Number(n), t, d));

body("Die Differenz (Endstand − Anfangsstand) wird in der Spielerhistorie gespeichert und der Spieler-Saldo aktualisiert.");

// ─── ADMIN ───────────────────────────────────────────────────────────────────
doc.addPage();
heading1("5. Administration");

body("Zugänglich über den Link \"Administration\" im Dashboard (unten) oder direkt über /admin. Passwort erforderlich.");

heading2("5.1 Spieler bearbeiten");
body("Name und Jeton-Stand eines Spielers direkt korrigieren. Nützlich bei Erfassungsfehlern. \"Speichern\" sichert den einzelnen Spieler, \"Alle Jetonstände speichern\" speichert alle auf einmal.");

heading2("5.2 Chipbestand verwalten");
bullet([
  "Wert einer Chip-Größe ändern – direkt im Wert-Feld bearbeiten",
  "Anzahl ändern – Anzahl-Feld bearbeiten",
  "Neue Chip-Größe hinzufügen – \"+ Chip-Wert hinzufügen\"",
  "Chip-Größe entfernen – ✕-Button",
  "Alles sichern – \"Chipbestand speichern\"",
]);

infoBox("HINWEIS", "Der Chipbestand wird beim Reset NICHT gelöscht. Er bleibt dauerhaft erhalten, weil der physische Chip-Vorrat unabhängig von Spielern und Spielabenden ist.");

heading2("5.3 Passwort ändern");
body("Neues Passwort eingeben → \"Passwort ändern\". Das neue Passwort wird sofort aktiv und lokal gespeichert.");

heading2("5.4 Kompletter Reset");
body("Löscht ALLE Spieler, Spielabende, Bilanz-Historien und den Bankstand. Der Chipbestand bleibt erhalten.");
infoBox("WARNUNG", "Dieser Vorgang ist NICHT rückgängig zu machen. Es erscheinen zwei Bestätigungsdialoge. Nach dem Reset startet die App mit einem leeren Bankstand.");

// ─── HÄUFIGE FRAGEN ──────────────────────────────────────────────────────────
doc.addPage();
heading1("6. Häufige Fragen");

const faqs = [
  [
    "Was ist das Fixum?",
    "Das Fixum ist ein Eintrittsbeitrag, der beim Hinzufügen eines Spielers automatisch von der Bank abgezogen wird. Es spiegelt wider, dass der Spieler reale Euros einbezahlt hat. Die Höhe ist im Backend konfiguriert.",
  ],
  [
    "Was passiert wenn ein Spieler mehr Jetons braucht?",
    "Über \"Jetons kaufen\" im Dashboard oder auf der Spielabend-Seite können jederzeit zusätzliche Jetons gekauft werden. Der Betrag wird von der Bank abgezogen.",
  ],
  [
    "Was bedeutet die \"Rest\"-Spalte in der Jeton-Verteilung?",
    "Wenn der Jeton-Betrag eines Spielers nicht exakt durch die verfügbaren Chip-Größen abgedeckt werden kann (z.B. 7€ bei nur 5€- und 10€-Chips), zeigt \"Rest\" den nicht zuweisbaren Betrag. Der Dealer muss diesen Betrag mit Wechselgeld ausgleichen.",
  ],
  [
    "Kann ich mehrere Spielabende gleichzeitig haben?",
    "Nein. Es kann immer nur ein Spielabend aktiv sein. Ein neuer Spielabend kann erst gestartet werden, wenn der aktuelle abgeschlossen wurde.",
  ],
  [
    "Wie sichere ich die Daten?",
    "Alle Daten liegen in einer PostgreSQL-Datenbank. Für Backups sollte die Datenbank regelmäßig gesichert werden. Der PDF-Export im Dashboard bietet eine lesbare Momentaufnahme.",
  ],
  [
    "Was passiert mit dem Bankstand?",
    "Der Bankstand erhöht sich durch: Fixum-Zahlungen, Jeton-Käufe und Gewinn der Spieler (wenn ein Spieler am Ende weniger hat als am Anfang). Er sinkt durch: Auszahlungen und Verluste der Bank an Spieler.",
  ],
];

faqs.forEach(([q, a]) => {
  heading3(q);
  body(a);
  divider();
});

// ─── FOOTER LETZTE SEITE ─────────────────────────────────────────────────────
doc.moveDown(1);
doc.fontSize(9).fillColor("#aaaaaa").font("Helvetica")
  .text(`Erstellt am ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })} · VflBlackJack Spielgeld-Verwaltung`, { align: "center" });

// Seitennummern
const pageCount = doc.bufferedPageRange().count;
for (let i = 0; i < pageCount; i++) {
  doc.switchToPage(i);
  doc.fontSize(9).fillColor("#aaaaaa").font("Helvetica")
    .text(`Seite ${i + 1} von ${pageCount}`, 50, doc.page.height - 40, { align: "right", width: doc.page.width - 100 });
}

doc.end();
console.log("PDF erstellt:", outputPath);
