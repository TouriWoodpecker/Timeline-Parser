import React from 'react';
import { DataTable } from './DataTable';
import { LoadingIndicator } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import type { ParsedEntry } from '../types';

interface TimelinePanelProps {
  pairedData: ParsedEntry[];
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
  onExportXLSX: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onFindInsights: () => void;
  isFindingInsights: boolean;
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
  onExportXLSX,
  isMinimized,
  onToggleMinimize,
  onFindInsights,
  isFindingInsights,
}) => {
  const triggerCsvUpload = () => csvFileInputRef.current?.click();
  
  const hasData = pairedData.length > 0;
  const hasAnalysisData = hasData && pairedData.some(d => d.kernaussage);

  return (
    <div className={`card ${isMinimized ? 'card--filled' : 'card--elevated'}`}>
        <div className="panel-header" onClick={onToggleMinimize} style={{ cursor: 'pointer' }}>
            <div className="panel-header-title">
                <h2 className="md-typescale-title-large" style={{ margin: 0 }}>Protocol Timeline</h2>
            </div>
            <md-icon-button aria-label={isMinimized ? 'Expand panel' : 'Collapse panel'}>
                <span className="material-symbols-outlined">{isMinimized ? 'expand_more' : 'expand_less'}</span>
            </md-icon-button>
        </div>
        <div className="panel-content">
            {!isMinimized && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                    <input type="file" id="csv-upload" ref={csvFileInputRef} onChange={onUploadCSV} style={{ display: 'none' }} accept=".csv" />
                    <md-filled-tonal-button onClick={triggerCsvUpload} disabled={isLoading || isAnalyzing}>
                        <span className="material-symbols-outlined" slot="icon">upload</span>
                        Import CSV
                    </md-filled-tonal-button>
                    <md-filled-tonal-button onClick={onExportCSV} disabled={!hasData || isLoading || isAnalyzing}>
                        <span className="material-symbols-outlined" slot="icon">download</span>
                        Export CSV
                    </md-filled-tonal-button>
                    <md-filled-tonal-button onClick={onExportXLSX} disabled={!hasData || isLoading || isAnalyzing}>
                        <span className="material-symbols-outlined" slot="icon">table_view</span>
                        Export XLSX
                    </md-filled-tonal-button>
                </div>

                <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '24px 0' }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <md-elevated-button onClick={onAnalyze} disabled={!hasData || isAnalyzing || isLoading}>
                        <span className="material-symbols-outlined" slot="icon">science</span>
                        Analyze Timeline
                    </md-elevated-button>
                    {isAnalyzing && (
                    <md-filled-tonal-button onClick={onStopAnalysis} style={{'--md-filled-tonal-button-container-color': 'var(--md-sys-color-tertiary-container)'} as React.CSSProperties}>
                        <span className="material-symbols-outlined" slot="icon">stop_circle</span>
                        Stop Analysis
                    </md-filled-tonal-button>
                    )}
                    <md-elevated-button onClick={onFindInsights} disabled={!hasAnalysisData || isFindingInsights || isAnalyzing || isLoading}>
                        <span className="material-symbols-outlined" slot="icon">insights</span>
                        Find Key Insights
                    </md-elevated-button>
                </div>

                {isAnalyzing && loadingMessage && <LoadingIndicator message={loadingMessage} />}
                {statusMessage && <p style={{ margin: '16px 0', fontStyle: 'italic', color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'pre-wrap' }}>{statusMessage}</p>}
                {analysisError && <ErrorMessage message={analysisError} />}

                {(hasData || isLoading) ? (
                    <div style={{ marginTop: '24px' }}><DataTable data={pairedData} /></div>
                ) : (
                    <div style={{
                      marginTop: '24px',
                      padding: '48px 24px',
                      textAlign: 'center',
                      border: '1px dashed var(--md-sys-color-outline-variant)',
                      borderRadius: '8px'
                    }}>
                      <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--md-sys-color-surface-variant)'}}>summarize</span>
                      <h3 className="md-typescale-title-medium" style={{marginTop: '16px', color: 'var(--md-sys-color-on-surface-variant)'}}>No Timeline Data</h3>
                      <p className="md-typescale-body-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>Your parsed protocol will appear here.</p>
                    </div>
                )}
              </>
            )}
        </div>
    </div>
  );
};
