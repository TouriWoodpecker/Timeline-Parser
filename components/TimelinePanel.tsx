import React from 'react';
import { DataTable } from './DataTable';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import type { PairedProtocolEntry } from '../types';

interface TimelinePanelProps {
  pairedData: PairedProtocolEntry[];
  isLoading: boolean;
  isAnalyzing: boolean;
  loadingMessage: string;
  statusMessage: string;
  analysisError: string | null;
  onUploadCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvFileInputRef: React.RefObject<HTMLInputElement>;
  onAnalyze: () => void;
  onStopAnalysis: () => void;
  onExportCSV: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  pairedData,
  isLoading,
  isAnalyzing,
  loadingMessage,
  statusMessage,
  analysisError,
  onUploadCSV,
  csvFileInputRef,
  onAnalyze,
  onStopAnalysis,
  onExportCSV,
  isMinimized,
  onToggleMinimize,
}) => {
  const hasData = pairedData.length > 0;

  const textButtonClasses = "px-4 h-10 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-full)] transition-colors duration-200";
  const filledButtonClasses = "px-6 h-12 text-sm font-semibold text-[var(--color-on-primary)] bg-[var(--color-primary)] rounded-[var(--radius-full)] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:bg-[var(--color-outline)] disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:shadow-md";

  return (
    <div className="w-full bg-[var(--color-surface)] rounded-[var(--radius-l)] shadow-lg shadow-black/5 dark:shadow-black/20 border border-[var(--color-outline)]/20">
      <div className="flex justify-between items-center p-6 flex-wrap gap-x-8 gap-y-4">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">Output</h2>
             <button
                onClick={onToggleMinimize}
                className="p-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors"
                aria-label={isMinimized ? 'Expand Output section' : 'Collapse Output section'}
                aria-expanded={!isMinimized}
            >
                <svg className={`w-6 h-6 text-[var(--color-on-surface-variant)] transition-transform duration-300 ${isMinimized ? '' : 'rotate-180'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
        </div>
        {!isMinimized && (
            <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="csv-upload" className={`${textButtonClasses} inline-flex items-center ${isLoading || isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    Upload CSV
                    <input id="csv-upload" name="csv-upload" type="file" className="sr-only" onChange={onUploadCSV} ref={csvFileInputRef} accept=".csv" disabled={isLoading || isAnalyzing} />
                </label>
                <span className="text-[var(--color-outline)]/30 hidden sm:inline mx-2">|</span>
                {isAnalyzing ? (
                  <button
                    onClick={onStopAnalysis}
                    className={`${filledButtonClasses} bg-[var(--color-error)] dark:bg-[var(--color-error-container)] dark:text-black hover:shadow-red-500/30 focus:ring-red-500`}
                  >
                    Stop Analysis
                  </button>
                ) : (
                  <button
                    onClick={onAnalyze}
                    disabled={!hasData || isLoading}
                    className={filledButtonClasses}
                  >
                    Analyze Timeline
                  </button>
                )}
            </div>
        )}
      </div>
      
      <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isMinimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
        <div className="overflow-hidden">
          <div className="p-6 pt-6 border-t border-[var(--color-outline)]/20">
            {analysisError && <ErrorMessage message={analysisError} />}

            {isAnalyzing ? (
              <LoadingSpinner message={loadingMessage || "AI is analyzing the timeline..."} />
            ) : statusMessage ? (
              <div className="text-center p-8">
                <p className="text-[var(--color-on-surface-variant)] font-semibold animate-pulse">{statusMessage}</p>
              </div>
            ) : null}
            
            {isLoading && !hasData ? (
                <div className="text-center py-16">
                    <p className="text-[var(--color-on-surface-variant)]">Waiting for protocol to be parsed...</p>
                </div>
            ) : hasData ? (
                <>
                  <DataTable data={pairedData} />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={onExportCSV}
                      disabled={isLoading || isAnalyzing}
                      className={filledButtonClasses}
                    >
                      Download Sheet
                    </button>
                  </div>
                </>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-[var(--color-outline)]/30 rounded-[var(--radius-m)]">
                    <p className="text-[var(--color-on-surface-variant)]">Your structured timeline will appear here after parsing.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};