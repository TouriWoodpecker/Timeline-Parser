import React from 'react';
import { DataTable } from './DataTable';
import type { PairedProtocolEntry } from '../types';

interface TimelinePanelProps {
  pairedData: PairedProtocolEntry[];
  isLoading: boolean;
  onExportXLSX: () => void;
  onExportCSV: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  pairedData,
  isLoading,
  onExportXLSX,
  onExportCSV,
}) => {
  const hasData = pairedData.length > 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-6 flex-wrap gap-4">
        <h2 className="text-7xl font-bold text-black">Output</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onExportXLSX}
            disabled={!hasData || isLoading}
            className="font-medium text-black hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export as XLSX"
            aria-label="Export as XLSX"
          >
            EXCEL
          </button>
          <button
            onClick={onExportCSV}
            disabled={!hasData || isLoading}
            className="font-medium text-black hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export as CSV"
            aria-label="Export as CSV"
          >
            Sheets
          </button>
        </div>
      </div>
      
      {isLoading && !hasData ? (
        <div className="text-center py-10">
          <p className="text-black/60">Waiting for protocol to be parsed...</p>
        </div>
      ) : hasData ? (
        <DataTable data={pairedData} />
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-lg">
          <p className="text-black/60">Your structured timeline will appear here after parsing.</p>
        </div>
      )}
    </div>
  );
};