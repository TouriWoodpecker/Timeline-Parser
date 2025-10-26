import React from 'react';
import type { PairedProtocolEntry } from '../types';

interface DataTableProps {
  data: PairedProtocolEntry[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-center text-[var(--color-on-surface-variant)]">Keine Daten zum Anzeigen.</p>;
  }

  const hasAnalysisData = data.some(entry => entry.kernaussage || entry.zugeordneteKategorien || entry.begruendung);
  let qaPairCounter = 0;

  return (
    <div className="overflow-x-auto border border-[var(--color-outline)]/30 rounded-[var(--radius-m)] bg-[var(--color-surface)]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-[var(--color-outline)]/30 bg-[var(--color-surface-variant)]/50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)] sticky left-0 bg-inherit z-10 shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)] dark:shadow-[5px_0_5px_-5px_rgba(0,0,0,0.2)]">
              #
            </th>
            <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
              Fundstelle
            </th>
            <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
              Fragesteller
            </th>
            <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
              Frage
            </th>
            <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
              Zeuge
            </th>
            <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
              Antwort
            </th>
            {hasAnalysisData && (
              <>
                <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)] border-l border-[var(--color-outline)]/30">
                  Kernaussage
                </th>
                <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
                  Zugeordnete Kategorie(n)
                </th>
                <th scope="col" className="px-6 py-4 text-left font-semibold text-[var(--color-on-surface-variant)]">
                  Begründung
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => {
            const rowBgClass = index % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-transparent';
            const hoverBgClass = 'hover:bg-[var(--color-primary)]/5';

            if (entry.note) {
              return (
                <tr key={`note-${entry.id}`} className="bg-[var(--color-surface-variant)]/30">
                  <td colSpan={hasAnalysisData ? 10 : 7} className="px-6 py-4 text-center text-sm text-[var(--color-on-surface-variant)] italic">
                    {entry.note}
                  </td>
                </tr>
              );
            }
            
            qaPairCounter++;

            return (
              <tr key={entry.id} className={`transition-colors duration-150 group border-t border-[var(--color-outline)]/30 ${rowBgClass} ${hoverBgClass}`}>
                <td className={`p-6 whitespace-nowrap font-medium text-[var(--color-on-surface-variant)] align-top sticky left-0 z-10 shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)] dark:shadow-[5px_0_5px_-5px_rgba(0,0,0,0.2)] transition-colors duration-150 ${rowBgClass} group-hover:bg-[var(--color-primary)]/5`}>{qaPairCounter}</td>
                <td className="p-6 whitespace-nowrap text-[var(--color-on-surface-variant)] align-top font-mono">{entry.sourceReference}</td>
                <td className="p-6 whitespace-nowrap font-semibold text-[var(--color-on-surface)] align-top">{entry.questioner}</td>
                <td className="p-6 text-[var(--color-on-surface)] leading-relaxed align-top min-w-[450px]">{entry.question}</td>
                <td className="p-6 whitespace-nowrap font-semibold text-[var(--color-on-surface)] align-top">{entry.witness}</td>
                <td className="p-6 text-[var(--color-on-surface)] leading-relaxed align-top min-w-[450px]">{entry.answer}</td>
                {hasAnalysisData && (
                  <>
                    <td className="p-6 text-[var(--color-on-surface)] leading-relaxed align-top min-w-[450px] border-l border-[var(--color-outline)]/30 bg-[var(--color-primary)]/5">{entry.kernaussage}</td>
                    <td className="p-6 whitespace-nowrap font-semibold text-[var(--color-on-surface)] align-top font-mono bg-[var(--color-primary)]/5">{entry.zugeordneteKategorien}</td>
                    <td className="p-6 text-[var(--color-on-surface)] leading-relaxed align-top min-w-[450px] bg-[var(--color-primary)]/5">{entry.begruendung}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};