import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfPlayer {
  name: string;
  chipBalance: number;
  fixumPaid: number;
}

export interface PdfSession {
  name: string;
  endedAt?: string | null;
  bankDiff?: number | null;
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
  return (
    value.toFixed(2).replace(".", ",") + " €"
  );
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

  // ----------------------------------------------------
  // Übersicht
  // ----------------------------------------------------

  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text("Übersicht", margin, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["", ""]],
    body: [
      [
        "Im Umlauf gesamt",
        fmt(data.totalInCirculation),
      ],
      [
        "Summe Bank",
        fmt(data.bankBalance),
      ],
      [
        "Summe aller Jetons",
        fmt(data.totalChipsInPlay),
      ],
    ],
    showHead: false,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: LIGHT_GRAY,
      fillColor: [40, 48, 40],
    },
    columnStyles: {
      0: {
        cellWidth: 70,
        fontStyle: "normal",
        textColor: MID_GRAY,
      },
      1: {
        cellWidth: 45,
        fontStyle: "bold",
        halign: "right",
        textColor: GOLD,
      },
    },
    didParseCell: (hook) => {
      if (
        hook.row.index === 0 &&
        hook.column.index === 1
      ) {
        hook.cell.styles.textColor = GOLD;
        hook.cell.styles.fontSize = 12;
      }
    },
  });

  y =
    (doc as any).lastAutoTable.finalY + 12;

  // ----------------------------------------------------
  // Spieler
  // ----------------------------------------------------

  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text("Spieler", margin, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      [
        "Spieler",
        "Jetons",
        "Fixum",
      ],
    ],
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
      1: {
        halign: "right",
      },
      2: {
        halign: "right",
      },
    },
    alternateRowStyles: {
      fillColor: [28, 28, 28],
    },
  });

  y =
    (doc as any).lastAutoTable.finalY + 12;

  // ----------------------------------------------------
  // Spielabende
  // ----------------------------------------------------

  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text("Vergangene Spielabende", margin, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      [
        "Spielabend",
        "Datum",
        "Bank Ergebnis",
      ],
    ],
    body: data.sessions.map((s) => [
      s.name,
      s.endedAt
        ? new Date(
            s.endedAt,
          ).toLocaleDateString("de-DE")
        : "-",
      s.bankDiff !== undefined &&
      s.bankDiff !== null
        ? fmt(s.bankDiff)
        : "-",
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
      2: {
        halign: "right",
      },
    },
    alternateRowStyles: {
      fillColor: [28, 28, 28],
    },
  });

  doc.save(
    `vflblackjack-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
