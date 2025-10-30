import React, { useState, useCallback } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { DataTable } from '../DataTable';
import { analyzeEntries } from '../../services/analysisService';
import { exportToCsv, exportToXlsx } from '../../services/fileService';
import { ParsedEntry } from '../../types';
import { promisePool } from '../../utils/promisePool';

interface AnalyzerModuleProps {
    parsedData: ParsedEntry[];
    analyzedData: ParsedEntry[];
    setAnalyzedData: (data: ParsedEntry[]) => void;
    setLoading: (loading: boolean, message?: string) => void;
    onAnalysisComplete: (data: ParsedEntry[]) => void;
}

const CHUNK_SIZE = 15;

export const AnalyzerModule: React.FC<AnalyzerModuleProps> = ({
    parsedData,
    analyzedData,
    setAnalyzedData,
    setLoading,
    onAnalysisComplete
}) => {
    const [error, setError] = useState<string>('');
    const dataToDisplay = analyzedData.length > 0 ? analyzedData : parsedData;
    
    const handleAnalyze = useCallback(async () => {
        if (parsedData.length === 0) {
            setError("No parsed data available to analyze. Please parse a document first.");
            return;
        }
        setError('');
        setAnalyzedData([]);

        try {
            const entriesToAnalyze = parsedData.filter(entry => !entry.note && (entry.question || entry.answer));
            const noteEntries = parsedData.filter(entry => entry.note);
            
            const chunks: ParsedEntry[][] = [];
            for (let i = 0; i < entriesToAnalyze.length; i += CHUNK_SIZE) {
                chunks.push(entriesToAnalyze.slice(i, i + CHUNK_SIZE));
            }
            
            const totalChunks = chunks.length;

            const analysisTask = (chunk: ParsedEntry[], index: number) => {
                return analyzeEntries(chunk);
            };

            const handleProgress = ({ completed, total }: { completed: number; total: number }) => {
                setLoading(true, `Analyzing... ${completed}/${total} chunks complete.`);
            };
            
            setLoading(true, `Starting analysis of ${totalChunks} chunks...`);

            const analyzedChunks = await promisePool(
                chunks,
                analysisTask,
                2, // Concurrency limit
                handleProgress
            );

            const flattenedAnalyzedData = analyzedChunks.flat();
            
            const combinedData = [...flattenedAnalyzedData, ...noteEntries].sort((a, b) => a.id - b.id);

            setAnalyzedData(combinedData);
            onAnalysisComplete(combinedData);

        } catch (err: any) {
            setError(`Analysis failed: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }

    }, [parsedData, setLoading, setAnalyzedData, onAnalysisComplete]);

    return (
        <ModuleWrapper
            title="Analyzer"
            description="Enrich the protocol data by identifying the core statement of each entry and categorizing it against a predefined knowledge corpus."
        >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <md-filled-button onClick={handleAnalyze} disabled={parsedData.length === 0}>
                    <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>science</span>
                    Analyze Entries
                </md-filled-button>
            </div>
            {error && <div style={{ color: 'var(--md-sys-color-error)' }}>{error}</div>}

            {dataToDisplay.length > 0 && (
                <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="md-typescale-title-medium">Analyzed Protocol</h3>
                         <div style={{display: 'flex', gap: '8px'}}>
                            <md-filled-tonal-button onClick={() => exportToCsv(dataToDisplay, 'analyzed-protocol.csv')}>
                                 <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>download</span>
                                CSV
                            </md-filled-tonal-button>
                            <md-filled-tonal-button onClick={() => exportToXlsx(dataToDisplay, 'analyzed-protocol.xlsx')}>
                                 <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>download</span>
                                XLSX
                            </md-filled-tonal-button>
                         </div>
                    </div>
                    <DataTable data={dataToDisplay} />
                </div>
            )}
             {dataToDisplay.length === 0 && (
                <p>No data to display. Use the Parser module to load data first.</p>
            )}

        </ModuleWrapper>
    );
};
