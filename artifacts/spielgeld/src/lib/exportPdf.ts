import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GOLD = [180, 140, 40] as [number, number, number];
const DARK = [30, 36, 30] as [number, number, number];
const LIGHT_GRAY = [200, 200, 200] as [number, number, number];
const MID_GRAY = [120, 120, 120] as [number, number, number];
const GREEN = [80, 180, 80] as [number, number, number];
const RED = [200, 80, 80] as [number, number, number];

function fmt(val: number) {
  return val.toFixed(2).replace(".", ",") + " €";
}

function fmtDiff(val: number) {
  return (val > 0 ? "+" : "") + fmt(val);
}

export interface PdfPlayer {
  name: string;
  chipBalance: number;
  fixumPaid: number;
}

export interface PdfSessionPlayerSnapshot {
  playerName: string;
  balanceBefore: number;
  balanceAfter: number;
  diff: number;
}

export interface PdfSession {
  name: string;
  createdAt: string;
  endedAt?: string | null;
  bankBalanceBefore: number | null;
  bankBalanceAfter: number | null;
  bankDiff: number | null;
  players: PdfSessionPlayerSnapshot[];
}

export interface PdfData {
  bankBalance: number;
  totalChipsInPlay: number;
  totalFixumPaid: number;
  players: PdfPlayer[];
  sessions: PdfSession[];
}

export function generatePdf(data: PdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  const exportDate = new Date().toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  doc.text("VflBlackJack", margin, 14);
  doc.setFontSize(8);
  doc.setTextColor(...MID_GRAY);
  doc.text(`Export: ${exportDate}`, pageW - margin, 14, { align: "right" });
  y = 30;

  // ── Bank Overview ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text("BANKÜBERSICHT", margin, y);
  y += 4;

  const balanced = Math.abs(data.totalChipsInPlay + data.totalFixumPaid - data.bankBalance) < 0.01;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["", ""]],
    body: [
      ["Bankbestand", fmt(data.bankBalance)],
      ["Jetons im Spiel", fmt(data.totalChipsInPlay)],
      ["Aktives Fixum gesamt", fmt(data.totalFixumPaid)],
      ["Bankbestand Prüfung", balanced ? "Ausgeglichen" : "DIFFERENZ!"],
    ],
    showHead: false,
    styles: { font: "helvetica", fontSize: 9, textColor: LIGHT_GRAY, fillColor: [40, 48, 40] },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: "normal", textColor: MID_GRAY },
      1: { cellWidth: 40, fontStyle: "bold", halign: "right",
           textColor: balanced ? GREEN : RED },
    },
    didParseCell: (hook) => {
      if (hook.row.index === 0 && hook.column.index === 1) {
        hook.cell.styles.textColor = GOLD;
        hook.cell.styles.fontSize = 12;
      }
      if (hook.row.index === 3 && hook.column.index === 1) {
        hook.cell.styles.textColor = balanced ? GREEN : RED;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Active Players ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text("AKTIVE SPIELER", margin, y);
  y += 4;

  if (data.players.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MID_GRAY);
    doc.text("Keine aktiven Spieler.", margin, y + 5);
    y += 12;
  } else {
    const playerRows = data.players.map((p) => [
      p.name,
      fmt(p.fixumPaid),
      fmt(p.chipBalance),
      fmt(p.fixumPaid + p.chipBalance),
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Name", "Fixum", "Jetons", "Gesamt"]],
      body: playerRows,
      styles: { font: "helvetica", fontSize: 9, textColor: LIGHT_GRAY, fillColor: [40, 48, 40] },
      headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: "bold", fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 32 },
        2: { halign: "right", cellWidth: 32 },
        3: { halign: "right", cellWidth: 32, fontStyle: "bold", textColor: GOLD },
      },
      alternateRowStyles: { fillColor: [35, 42, 35] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Game Sessions ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text("VERGANGENE SPIELABENDE", margin, y);
  y += 4;

  if (data.sessions.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MID_GRAY);
    doc.text("Keine abgeschlossenen Spielabende.", margin, y + 5);
  } else {
    for (const session of data.sessions) {
      if (y > 250) {
        doc.addPage();
        y = 14;
      }

      const dateStr = new Date(session.createdAt).toLocaleDateString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });

      // Session header row
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[`${session.name}  —  ${dateStr}`, "", "", ""]],
        body: [],
        headStyles: {
          fillColor: [50, 60, 50],
          textColor: GOLD,
          fontStyle: "bold",
          fontSize: 9,
        },
        styles: { font: "helvetica" },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 32 },
          2: { cellWidth: 32 },
          3: { cellWidth: 32 },
        },
      });
      y = (doc as any).lastAutoTable.finalY;

      // Players within session
      const snapRows = [...session.players]
        .sort((a, b) => b.diff - a.diff)
        .map((p) => [
          p.playerName,
          fmt(p.balanceBefore),
          fmt(p.balanceAfter),
          fmtDiff(p.diff),
        ]);

      // Bank row
      const bankRow =
        session.bankDiff !== null
          ? [
              "Bank",
              session.bankBalanceBefore !== null ? fmt(session.bankBalanceBefore) : "—",
              session.bankBalanceAfter !== null ? fmt(session.bankBalanceAfter) : "—",
              session.bankDiff !== null ? fmtDiff(session.bankDiff) : "—",
            ]
          : null;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Spieler", "Vorher", "Nachher", "+/−"]],
        body: bankRow ? [...snapRows, bankRow] : snapRows,
        headStyles: {
          fillColor: DARK,
          textColor: MID_GRAY,
          fontStyle: "bold",
          fontSize: 8,
        },
        styles: { font: "helvetica", fontSize: 9, textColor: LIGHT_GRAY, fillColor: [40, 48, 40] },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "right", cellWidth: 32 },
          2: { halign: "right", cellWidth: 32 },
          3: { halign: "right", cellWidth: 32, fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [35, 42, 35] },
        didParseCell: (hook) => {
          if (hook.column.index === 3 && hook.row.section === "body") {
            const raw = hook.cell.raw as string;
            if (raw.startsWith("+")) hook.cell.styles.textColor = GREEN;
            else if (raw.startsWith("-")) hook.cell.styles.textColor = RED;
          }
          // Highlight bank row
          if (bankRow && hook.row.index === snapRows.length && hook.row.section === "body") {
            hook.cell.styles.textColor = GOLD;
            hook.cell.styles.fontStyle = "bold";
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ── Footer on every page ─────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MID_GRAY);
    doc.text(
      `VflBlackJack — Seite ${i} von ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  const filename = `VflBlackJack_Export_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
