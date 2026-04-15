/**
 * Export utilities for CSV download.
 */

/** Download a CSV file from rows of data. */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel Chinese support
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv =
    BOM +
    [headers.map(escape).join(",")]
      .concat(rows.map((row) => row.map(escape).join(",")))
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
