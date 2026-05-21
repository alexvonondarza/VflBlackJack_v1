import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfPlayer {
  name: string;
  chipBalance: number;
  fixumPaid: number;
}

export interface PdfSessionPlayer {
  playerName: string;
  balanceBefore: number;
  balanceAfter: number;
  diff: number;
}

export interface PdfSession {
  name: string;
  endedAt?: string | null;
  bankBalanceBefore?: number | null;
  bankBalanceAfter?: number | null;
  bankDiff?: number | null;
  players?: PdfSessionPlayer[];
}

export interface PdfData {
  bankBalance: number;
  totalChipsInPlay: number;
  totalInCirculation: number;
  players: PdfPlayer[];
  sessions: PdfSession[];
}

const GOLD = "#c8a75d";
const LIGHT_GRAY = "#d6d6d6";
const MID_GRAY = "#8a8a8a";
const DARK_BG = "#181818";

function fmt(value: number) {
  return value.toFixed(2).replace(".", ",") + " €";
}

export function generatePdf(data: PdfData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 14;

  doc.setFillColor(DARK_BG);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("VflBlackJack", margin, 18);

  doc.setFontSize(11);
  doc.setTextColor(MID_GRAY);
  doc.text(
    `Export vom ${new Date().toLocaleDateString("de-DE")} ${new Date().toLocaleTimeString("de-DE")}`,
    margin,
    25,
  );

  let y = 36;

  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text("Übersicht", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: [
      ["Im Umlauf gesamt", fmt(data.totalInCirculation)],
      ["Summe Bank", fmt(data.bankBalance)],
      ["Summe aller Jetons", fmt(data.totalChipsInPlay)],
    ],
    showHead: false,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: LIGHT_GRAY,
      fillColor: [40, 48, 40],
    },
    columnStyles: {
      0: { cellWidth: 70, textColor: MID_GRAY },
      1: { cellWidth: 45, fontStyle: "bold", halign: "right", textColor: GOLD },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text("Aktuelle Spieler", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Spieler", "Jetons", "Fixum"]],
    body: data.players.map((p) => [
      p.name,
      fmt(p.chipBalance),
      fmt(p.fixumPaid),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: LIGHT_GRAY,
      fillColor: [35, 35, 35],
    },
    headStyles: {
      fillColor: [28, 28, 28],
      textColor: GOLD,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
    alternateRowStyles: {
      fillColor: [28, 28, 28],
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text("Spielabend-Historie", margin, y);
  y += 4;

  if (data.sessions.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(MID_GRAY);
    doc.text("Keine beendeten Spielabende vorhanden.", margin, y);
  } else {
    for (const session of data.sessions) {
      if (y > 250) {
        doc.addPage();
        doc.setFillColor(DARK_BG);
        doc.rect(0, 0, 210, 297, "F");
        y = 18;
      }

      doc.setFontSize(12);
      doc.setTextColor(GOLD);
      doc.text(session.name, margin, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        body: [
          [
            "Beendet am",
            session.endedAt
              ? new Date(session.endedAt).toLocaleString("de-DE")
              : "-",
          ],
          ["Bank vorher", fmt(session.bankBalanceBefore ?? 0)],
          ["Bank nachher", fmt(session.bankBalanceAfter ?? 0)],
          ["Bank Ergebnis", fmt(session.bankDiff ?? 0)],
        ],
        showHead: false,
        styles: {
          font: "helvetica",
          fontSize: 8,
          textColor: LIGHT_GRAY,
          fillColor: [35, 35, 35],
        },
        columnStyles: {
          0: { cellWidth: 50, textColor: MID_GRAY },
          1: { cellWidth: 60, halign: "right", textColor: LIGHT_GRAY },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Spieler", "Vorher", "Nachher", "Gewinn/Verlust"]],
        body:
          session.players?.map((p) => [
            p.playerName,
            fmt(p.balanceBefore),
            fmt(p.balanceAfter),
            fmt(p.diff),
          ]) ?? [],
        styles: {
          font: "helvetica",
          fontSize: 8,
          textColor: LIGHT_GRAY,
          fillColor: [35, 35, 35],
        },
        headStyles: {
          fillColor: [28, 28, 28],
          textColor: GOLD,
          fontStyle: "bold",
        },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
        alternateRowStyles: {
          fillColor: [28, 28, 28],
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  doc.save(`vflblackjack-${new Date().toISOString().slice(0, 10)}.pdf`);
}
