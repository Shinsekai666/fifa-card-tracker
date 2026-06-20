import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sticker } from "./sticker-types";
import { groupByTeam } from "./sticker-types";

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFontSize(18);
  doc.setTextColor(20, 30, 70);
  doc.text(title, 14, 18);
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${subtitle} — généré le ${date}`, 14, 25);
}

function teamHeader(doc: jsPDF, y: number, group: { name: string; flag: string; missing?: number; doublesTotal?: number }, type: "missing" | "doubles") {
  doc.setFillColor(20, 30, 70);
  doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  const label = type === "missing" ? `${group.missing} manquant(s)` : `${group.doublesTotal} double(s)`;
  doc.text(`${group.flag}  ${group.name}`, 17, y + 5.5);
  doc.text(label, 196 - doc.getTextWidth(label) - 3, y + 5.5);
  doc.setTextColor(0);
  return y + 10;
}

export function exportMissingPdf(stickers: Sticker[]) {
  const doc = new jsPDF();
  header(doc, "Liste des manquants", "Stickers à trouver");

  const groups = groupByTeam(stickers).filter((g) => g.missing > 0);
  let y = 32;

  if (groups.length === 0) {
    doc.setFontSize(12);
    doc.text("🎉 Album complet, aucun manquant !", 14, y + 8);
    doc.save(`manquants-${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  const totalMissing = groups.reduce((a, g) => a + g.missing, 0);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Total : ${totalMissing} stickers à trouver, répartis sur ${groups.length} équipe(s)`, 14, 30);
  doc.setTextColor(0);

  for (const g of groups) {
    const missing = g.stickers.filter((s) => s.status === "missing");
    if (missing.length === 0) continue;
    if (y > 260) { doc.addPage(); y = 20; }
    y = teamHeader(doc, y, { name: g.name, flag: g.flag, missing: g.missing }, "missing");

    autoTable(doc, {
      startY: y,
      head: [["N°", "Nom"]],
      body: missing.map((s) => [s.number + (s.is_foil ? "  ✨" : ""), s.name ?? "—"]),
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [240, 240, 248], textColor: [20, 30, 70], fontStyle: "bold" },
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
  header(doc, "Liste des doubles", "Stickers à échanger");

  const groups = groupByTeam(stickers).filter((g) => g.doubles > 0);
  let y = 32;

  if (groups.length === 0) {
    doc.setFontSize(12);
    doc.text("Aucun double pour le moment.", 14, y + 8);
    doc.save(`doubles-${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  const total = groups.reduce((a, g) => a + g.doubles, 0);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Total : ${total} double(s) à échanger, répartis sur ${groups.length} équipe(s)`, 14, 30);
  doc.setTextColor(0);

  for (const g of groups) {
    const doubles = g.stickers.filter((s) => s.status === "double" && s.doubles_count > 0);
    if (doubles.length === 0) continue;
    if (y > 260) { doc.addPage(); y = 20; }
    y = teamHeader(doc, y, { name: g.name, flag: g.flag, doublesTotal: g.doubles }, "doubles");

    autoTable(doc, {
      startY: y,
      head: [["N°", "Nom", "Quantité"]],
      body: doubles.map((s) => [s.number + (s.is_foil ? "  ✨" : ""), s.name ?? "—", String(s.doubles_count)]),
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [240, 240, 248], textColor: [20, 30, 70], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" }, 2: { cellWidth: 25, halign: "center" } },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error lastAutoTable injected
    y = (doc.lastAutoTable.finalY ?? y) + 6;
  }

  doc.save(`doubles-${new Date().toISOString().slice(0, 10)}.pdf`);
}
