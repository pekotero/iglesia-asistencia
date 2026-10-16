import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Record {
  name: string;
  group: string;
  present: boolean;
}

export function generatePDF(date: string, title: string, records: Record[]) {
  const doc = new jsPDF();
  const [year, month, day] = date.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const formattedDate = dateObj.toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const totalPresent = records.filter((r) => r.present).length;
  const totalAbsent = records.length - totalPresent;
  const percentage = Math.round((totalPresent / records.length) * 100);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Reporte de Asistencia", 105, 25, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(title, 105, 35, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(formattedDate, 105, 43, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${records.length}`, 20, 55);
  doc.setTextColor(34, 139, 34);
  doc.text(`Presentes: ${totalPresent}`, 75, 55);
  doc.setTextColor(220, 20, 20);
  doc.text(`Ausentes: ${totalAbsent}`, 130, 55);
  doc.setTextColor(0, 0, 200);
  doc.text(`${percentage}%`, 180, 55);

  doc.setTextColor(0);
  const sorted = [...records].sort((a, b) => a.name.localeCompare(b.name));

  autoTable(doc, {
    startY: 63,
    head: [["#", "Nombre", "Grupo", "Estado"]],
    body: sorted.map((r, i) => [i + 1, r.name, r.group, r.present ? "Presente" : "Ausente"]),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: 15, halign: "center" }, 3: { cellWidth: 35, halign: "center" } },
    didParseCell: function (data: any) {
      if (data.column.index === 3 && data.section === "body") {
        const text = data.cell.raw as string;
        if (text.includes("Presente")) {
          data.cell.styles.textColor = [34, 139, 34];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [220, 20, 20];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`Asistencia_${date}.pdf`);
}