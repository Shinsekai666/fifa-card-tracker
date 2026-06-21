import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sticker } from "./sticker-types";
import { groupByTeam } from "./sticker-types";

function header(doc: jsPDF, title: string) {
  doc.setFontSize(18);
  doc.setTextColor(20, 30, 70);
  doc.text(title, 14, 18);
  doc.setTextColor(0);
}

function teamHeader(doc: jsPDF, y: number, group: { name: string; code: string }) {
  doc.setFillColor(20, 30, 70);
  doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.text(`${group.code} - ${group.name}`, 17, y + 5.5);
  doc.setTextColor(0);
  return y + 10;
}

export function exportMissingPdf(stickers: Sticker[]) {
  const doc = new jsPDF();
  header(doc, "Liste des manquants");

  const groups = groupByTeam(stickers).filter((g) => g.missing > 0);
  let y = 28;

  if (groups.length === 0) {
    doc.setFontSize(12);
    doc.text("🎉 Album complet, aucun manquant !", 14, y + 8);
    doc.save(`manquants-${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  for (const g of groups) {
    const missing = g.stickers.filter((s) => s.status === "missing");
    if (missing.length === 0) continue;
    if (y > 260) { doc.addPage(); y = 20; }
    y = teamHeader(doc, y, { name: g.name, code: g.code });

    autoTable(doc, {
      startY: y,
      body: missing.map((s) => [s.number + (s.is_foil ? "  ✨" : ""), s.name ?? "—"]),
      styles: { fontSize: 9, cellPadding: 1.5 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error lastAutoTable injected
    y = (doc.lastAutoTable.finalY ?? y) + 6;
  }

  doc.save(`manquants-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDoublesPdf(stickers: Sticker[]) {
  const doc = new jsPDF();
  header(doc, "Liste des doubles");

  const groups = groupByTeam(stickers).filter((g) => g.doubles > 0);
  let y = 28;

  if (groups.length === 0) {
    doc.setFontSize(12);
    doc.text("Aucun double pour le moment.", 14, y + 8);
    doc.save(`doubles-${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  for (const g of groups) {
    const doubles = g.stickers.filter((s) => s.status === "double" && s.doubles_count > 0);
    if (doubles.length === 0) continue;
    if (y > 260) { doc.addPage(); y = 20; }
    y = teamHeader(doc, y, { name: g.name, code: g.code });

    autoTable(doc, {
      startY: y,
      body: doubles.map((s) => [s.number + (s.is_foil ? "  ✨" : ""), s.name ?? "—", `×${s.doubles_count}`]),
      styles: { fontSize: 9, cellPadding: 1.5 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" }, 2: { cellWidth: 25, halign: "center" } },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error lastAutoTable injected
    y = (doc.lastAutoTable.finalY ?? y) + 6;
  }

  doc.save(`doubles-${new Date().toISOString().slice(0, 10)}.pdf`);
}
