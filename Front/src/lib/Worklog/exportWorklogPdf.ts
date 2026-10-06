import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {formatDuration} from './dateRange';
import type {MyWorklogEntry} from './Type/types';

type TicketSummaryRow = {
  key: string;
  title: string;
  projectName: string;
  actorId: string;
  minutes: number;
};

// Rolled up per ticket (this range's entries summed, not one row per
// entry) - that's what was actually asked for ("lista tiketów i
// podsumowanie czasowe"), not a full per-session audit trail. Grouped by
// ticket+actor (not ticket alone) so that when the calendar's userIds
// filter spans more than one person, their time on the same ticket isn't
// silently merged into one row. Sorted by time descending so the heaviest
// rows lead the table.
const summarizeByTicket = (entries: MyWorklogEntry[]): TicketSummaryRow[] => {
  const byKey = new Map<string, TicketSummaryRow>();

  entries.forEach((entry) => {
    const groupKey = `${entry.ticket.id}:${entry.actorId}`;
    const existing = byKey.get(groupKey);

    if (existing) {
      existing.minutes += entry.minutes;
      return;
    }

    byKey.set(groupKey, {
      key: entry.ticket.key,
      title: entry.ticket.title,
      projectName: entry.project.name,
      actorId: entry.actorId,
      minutes: entry.minutes,
    });
  });

  return Array.from(byKey.values()).sort((a, b) => b.minutes - a.minutes);
};

const sanitizeFileNamePart = (text: string): string => text.replace(/[^\w-]+/g, '_');

const pad2 = (n: number): string => String(n).padStart(2, '0');

// yyyy-MM-dd HH:mm:ss, 24h - locale-independent (unlike
// Date.prototype.toLocaleString(), which follows the browser's own locale,
// e.g. "8/16/2026, 3:02:05 PM").
const formatGeneratedAt = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

// Client-side only (jsPDF + jspdf-autotable) - no backend endpoint involved,
// same "everything this page needs it already has" precedent as the rest of
// MyWorklogPage. Called with whatever range/userIds selection is currently
// loaded, so the export always matches what's on screen. `userName` (the
// page title) and `resolveUserName` (per-row actor names, only used when the
// export spans more than one person) are both resolved by the caller - this
// module has no hook access of its own to the user directory.
export const exportWorklogPdf = (entries: MyWorklogEntry[], rangeLabel: string, userName: string, resolveUserName: (userId: string) => string): void => {
  const rows = summarizeByTicket(entries);
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const showActorColumn = new Set(entries.map((entry) => entry.actorId)).size > 1;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(userName, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(rangeLabel, 14, 25);
  doc.text(`Generated ${formatGeneratedAt(new Date())}`, 14, 30);

  const head = showActorColumn ? ['Ticket', 'Project', 'User', 'Time logged'] : ['Ticket', 'Project', 'Time logged'];
  const footPadding = showActorColumn ? ['', '', 'Total'] : ['', 'Total'];
  const timeColumnIndex = head.length - 1;

  autoTable(doc, {
    startY: 36,
    head: [head],
    body: rows.map((row) =>
      showActorColumn
        ? [`${row.key}  ${row.title}`, row.projectName, resolveUserName(row.actorId), formatDuration(row.minutes)]
        : [`${row.key}  ${row.title}`, row.projectName, formatDuration(row.minutes)],
    ),
    foot: [[...footPadding, formatDuration(totalMinutes)]],
    styles: {fontSize: 9, cellPadding: 3},
    headStyles: {fillColor: [30, 41, 59]},
    footStyles: {fillColor: [15, 23, 42], fontStyle: 'bold'},
    columnStyles: {[timeColumnIndex]: {halign: 'right'}},
  });

  doc.save(`worklog-${sanitizeFileNamePart(rangeLabel)}.pdf`);
};
