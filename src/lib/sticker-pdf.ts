import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sticker } from "./sticker-types";

function buildPdf(title: string, subtitle: string, rows: Sticker[], includeDoubles: boolean) {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(18);
  doc.setTextColor(20, 30, 70);
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${subtitle} — ${rows.length} sticker${rows.length > 1 ? "s" : ""}`, 14, 25);
  doc.text(`Généré le ${date}`, 14, 30);

  const head = includeDoubles
    ? [["N°", "Nom", "Catégorie", "Quantité"]]
    : [["N°", "Nom", "Catégorie"]];

  const body = rows.map((s) =>
    includeDoubles
      ? [s.number, s.name ?? "—", s.category ?? "—", String(s.doubles_count)]
      : [s.number, s.name ?? "—", s.category ?? "—"],
  );

  autoTable(doc, {
    startY: 36,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [20, 30, 70], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    columnStyles: { 0: { cellWidth: 22, fontStyle: "bold" } },
  });

  return doc;
}

export function exportMissingPdf(stickers: Sticker[]) {
  const rows = stickers
    .filter((s) => s.status === "missing")
    .sort((a, b) => a.sort_order - b.sort_order || a.number.localeCompare(b.number, "fr", { numeric: true }));
  const doc = buildPdf("Liste des manquants", "Stickers à trouver", rows, false);
  doc.save(`manquants-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDoublesPdf(stickers: Sticker[]) {
  const rows = stickers
    .filter((s) => s.status === "double" && s.doubles_count > 0)
    .sort((a, b) => a.sort_order - b.sort_order || a.number.localeCompare(b.number, "fr", { numeric: true }));
  const doc = buildPdf("Liste des doubles", "Stickers en double à échanger", rows, true);
  doc.save(`doubles-${new Date().toISOString().slice(0, 10)}.pdf`);
}
