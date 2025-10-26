import React from 'react';
import type { PairedProtocolEntry } from '../types';

interface DataTableProps {
  data: PairedProtocolEntry[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-center text-black/60">Keine Daten zum Anzeigen.</p>;
  }

  return (
    <div className="overflow-x-auto border border-black/10 rounded-lg">
      <table className="min-w-full">
        <thead className="border-b border-black/10">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-12">
              #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Fundstelle
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Fragesteller
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Frage
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Zeuge
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Antwort
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {data.map((entry) => {
            if (entry.note) {
              return (
                <tr key={`note-${entry.id}`} className="bg-black/5">
                  <td colSpan={6} className="px-6 py-3 text-center text-sm text-black/70 italic">
                    {entry.note}
                  </td>
                </tr>
              );
            }
            
            return (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black/50 align-top">{entry.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black/70 align-top font-mono">{entry.sourceReference}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black align-top">{entry.questioner}</td>
                <td className="px-6 py-4 text-sm text-black/90 leading-relaxed align-top">{entry.question}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black align-top">{entry.witness}</td>
                <td className="px-6 py-4 text-sm text-black/90 leading-relaxed align-top">{entry.answer}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};