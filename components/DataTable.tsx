import React from 'react';
import type { ParsedEntry } from '../types';

interface DataTableProps {
  data: ParsedEntry[];
}

const tableStyle: React.CSSProperties = {
  minWidth: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem'
};
const cellStyle: React.CSSProperties = {
  padding: '16px',
  textAlign: 'left',
  verticalAlign: 'top',
  borderTop: '1px solid var(--md-sys-color-outline-variant)'
};
const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 500,
  color: 'var(--md-sys-color-on-surface-variant)',
  borderTop: 'none',
  borderBottom: '1px solid var(--md-sys-color-outline-variant)',
  backgroundColor: 'var(--md-sys-color-surface)'
};

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  // Counter for "Fragenummer"
  let qaPairCounter = 0;

  // Check if any entry has analysis data to decide whether to show analysis columns.
  const hasAnalysisData = data.some(d => d.kernaussage || d.zugeordneteKategorien || d.begruendung);

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '8px' }}>
      <table style={tableStyle}>
        <thead style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
          <tr>
            <th style={{...headerCellStyle, position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'inherit' }}>#</th>
            <th style={headerCellStyle}>Fundstelle</th>
            <th style={headerCellStyle}>Fragesteller</th>
            <th style={headerCellStyle}>Frage</th>
            <th style={headerCellStyle}>Zeuge</th>
            <th style={headerCellStyle}>Antwort</th>
            {hasAnalysisData && (
              <>
                <th style={{...headerCellStyle, minWidth: '300px'}}>Kernaussage</th>
                <th style={{...headerCellStyle, minWidth: '250px'}}>Zugeordnete Kategorie(n)</th>
                <th style={{...headerCellStyle, minWidth: '300px'}}>Begründung</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => {
            // A row is a note if it has content in the note field.
            if (entry.note) {
              return (
                <tr key={`note-${entry.id}`} style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}>
                  <td style={{...cellStyle, position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'inherit' }}></td>
                  <td style={cellStyle}>{entry.sourceReference}</td>
                  <td colSpan={hasAnalysisData ? 7 : 4} style={{...cellStyle, fontStyle: 'italic', color: 'var(--md-sys-color-on-surface-variant)'}}>
                    Anmerkung: {entry.note}
                  </td>
                </tr>
              );
            }

            // Only increment counter for actual Q&A pairs or standalone statements.
            qaPairCounter++;

            const isEven = qaPairCounter % 2 === 0;
            const rowStyle: React.CSSProperties = {
                backgroundColor: isEven ? 'var(--md-sys-color-surface-container-highest)' : 'var(--md-sys-color-surface)',
                transition: 'background-color 0.2s'
            };

            return (
              <tr key={entry.id} style={rowStyle}>
                <td style={{...cellStyle, position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'inherit', fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)'}}>{entry.question ? qaPairCounter : ''}</td>
                <td style={cellStyle}>{entry.sourceReference}</td>
                <td style={{...cellStyle, fontWeight: 500}}>{entry.questioner}</td>
                <td style={{...cellStyle, minWidth: '450px'}}>{entry.question}</td>
                <td style={{...cellStyle, fontWeight: 500}}>{entry.witness}</td>
                <td style={{...cellStyle, minWidth: '450px'}}>{entry.answer}</td>
                {hasAnalysisData && (
                  <>
                    <td style={{...cellStyle, minWidth: '300px'}}>{entry.kernaussage}</td>
                    <td style={{...cellStyle, minWidth: '250px'}}>{entry.zugeordneteKategorien}</td>
                    <td style={{...cellStyle, minWidth: '300px'}}>{entry.begruendung}</td>
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