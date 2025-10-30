import React from 'react';
import { DataTable } from './DataTable';
import type { ParsedEntry } from '../types';

interface TimelinePanelProps {
  pairedData: ParsedEntry[];
  isLoading: boolean;
  isAnalyzing: boolean;
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
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="file" id="csv-upload" ref={csvFileInputRef} onChange={onUploadCSV} style={{ display: 'none' }} accept=".csv" />
                        <md-icon-button onClick={triggerCsvUpload} disabled={isLoading || isAnalyzing} title="Import CSV">
                            <span className="material-symbols-outlined">upload</span>
                        </md-icon-button>
                        <md-icon-button onClick={onExportCSV} disabled={!hasData || isLoading || isAnalyzing} title="Export CSV">
                            <span className="material-symbols-outlined">download</span>
                        </md-icon-button>
                        <md-icon-button onClick={onExportXLSX} disabled={!hasData || isLoading || isAnalyzing} title="Export XLSX">
                            <span className="material-symbols-outlined">table_view</span>
                        </md-icon-button>
                    </div>
                    <div style={{flexGrow: 1}}></div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isAnalyzing && (
                        <md-outlined-icon-button onClick={onStopAnalysis} title="Stop Analysis">
                            <span className="material-symbols-outlined">stop_circle</span>
                        </md-outlined-icon-button>
                        )}
                        <md-filled-icon-button onClick={onAnalyze} disabled={!hasData || isAnalyzing || isLoading} title="Analyze Timeline">
                            <span className="material-symbols-outlined">science</span>
                        </md-filled-icon-button>
                        <md-filled-icon-button onClick={onFindInsights} disabled={!hasAnalysisData || isFindingInsights || isAnalyzing || isLoading} title="Find Key Insights">
                            <span className="material-symbols-outlined">insights</span>
                        </md-filled-icon-button>
                    </div>
                </div>

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