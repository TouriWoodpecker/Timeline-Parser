import React, { useState, useRef } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { DataTable } from '../DataTable';
import { analyzeEntries } from '../../services/analysisService';
import { ParsedEntry } from '../../types';
import { getRandomQuote } from '../../utils/quotes';
import { processCsvFile } from '../../services/fileService';

interface AnalyzerModuleProps {
    setLoading: (loading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setStatusMessage: (message: string) => void;
    setError: (error: string | null) => void;
}

export const AnalyzerModule: React.FC<AnalyzerModuleProps> = ({
    setLoading,
    setLoadingMessage,
    setStatusMessage,
    setError,
}) => {
    const [inputData, setInputData] = useState<ParsedEntry[]>([]);
    const [outputData, setOutputData] = useState<ParsedEntry[]>([]);
    const [placeholder] = useState(getRandomQuote());
    const [isLoading, setIsLoading] = useState(false);
    const [inputCopyIcon, setInputCopyIcon] = useState('content_copy');
    const [outputCopyIcon, setOutputCopyIcon] = useState('content_copy');
    
    const csvInputRef = useRef<HTMLInputElement>(null);
    const stopOperationRef = useRef(false);

    const handleAnalyze = async () => {
        if (inputData.length === 0) {
            setError("Please import entries to analyze.");
            return;
        }

        setIsLoading(true);
        setLoading(true);
        stopOperationRef.current = false;
        setError(null);
        setOutputData([]);

        const dataToAnalyze = inputData.filter(d => d.question && d.answer);
        let processedCount = 0;
        const CHUNK_SIZE = 5;

        for (let i = 0; i < dataToAnalyze.length; i += CHUNK_SIZE) {
            if (stopOperationRef.current) {
                setStatusMessage(`Analysis stopped by user. ${processedCount} entries were processed.`);
                break;
            }

            const chunk = dataToAnalyze.slice(i, i + CHUNK_SIZE);

            setLoadingMessage(`Analyzing entries ${processedCount + 1}-${Math.min(processedCount + chunk.length, dataToAnalyze.length)} of ${dataToAnalyze.length}...`);

            try {
                const analyzedChunk = await analyzeEntries(chunk);
                setOutputData(currentData => [...currentData, ...analyzedChunk]);
            } catch (e: any) {
                setError(`Analysis failed on a chunk starting with entry ID ${chunk[0].id}: ${e.message}`);
                break;
            }

            processedCount += chunk.length;
        }
        
        if (!stopOperationRef.current) {
          setStatusMessage(`Analysis complete. ${processedCount} entries were processed.`);
        }

        setIsLoading(false);
        setLoading(false);
        setLoadingMessage('');
    };
    
    const handleAbort = () => {
        stopOperationRef.current = true;
    };

    const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setInputData([]);
        setOutputData([]);

        try {
            const { data, warnings } = await processCsvFile(file);
            if (data.length > 0) {
                setInputData(data);
                let message = `Successfully imported ${data.length} entries from ${file.name}.`;
                if (warnings.length > 0) {
                    message += `\n\nWarnings:\n- ${warnings.join('\n- ')}`;
                }
                setStatusMessage(message);
                setError(null);
            } else {
                setError("The imported CSV file is empty or contains no valid data entries.");
            }
        } catch (e: any) {
            setError(`Failed to import CSV: ${e.message}`);
        }
        if (event.target) {
            event.target.value = ''; // Reset file input
        }
    };

    const triggerCsvUpload = () => csvInputRef.current?.click();
    
    const handleCopy = (data: ParsedEntry[], setIcon: React.Dispatch<React.SetStateAction<string>>) => {
        if (data.length > 0) {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setIcon('check');
            setTimeout(() => setIcon('content_copy'), 2000);
        }
    };

    return (
        <ModuleWrapper
            title="Analyze"
            description="Import a CSV file with protocol entries. The AI will analyze each entry against the classic knowledge corpus, adding a core statement, categories, and justification."
        >
            <input
                type="file"
                ref={csvInputRef}
                onChange={handleImportCsv}
                style={{ display: 'none' }}
                accept=".csv"
            />

            {/* Input Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="md-typescale-title-medium">Input Entries</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <md-icon-button onClick={triggerCsvUpload} disabled={isLoading} title="Import Entries from CSV">
                            <span className="material-symbols-outlined">upload</span>
                        </md-icon-button>
                        <md-icon-button onClick={() => handleCopy(inputData, setInputCopyIcon)} disabled={inputData.length === 0 || isLoading} title="Copy as JSON">
                            <span className="material-symbols-outlined">{inputCopyIcon}</span>
                        </md-icon-button>
                        <md-icon-button onClick={() => setInputData([])} disabled={inputData.length === 0 || isLoading} title="Clear Input">
                            <span className="material-symbols-outlined">delete_sweep</span>
                        </md-icon-button>
                    </div>
                </div>
                {inputData.length > 0 ? (
                    <DataTable data={inputData} />
                ) : (
                    <div style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        border: '1px dashed var(--md-sys-color-outline-variant)',
                        borderRadius: '8px'
                    }}>
                        <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--md-sys-color-surface-variant)'}}>file_upload</span>
                        <h3 className="md-typescale-title-medium" style={{marginTop: '16px'}}>Awaiting Input</h3>
                        <p className="md-typescale-body-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>
                            {placeholder}
                        </p>
                    </div>
                )}
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                <md-filled-icon-button onClick={handleAnalyze} disabled={isLoading || inputData.length === 0} title="Analyze Entries">
                    <span className="material-symbols-outlined">science</span>
                </md-filled-icon-button>
                {isLoading && (
                    <md-outlined-button onClick={handleAbort}>
                         <span className="material-symbols-outlined" slot="icon">cancel</span>
                        Abort
                    </md-outlined-button>
                )}
            </div>

            {/* Output Section */}
            <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="md-typescale-title-medium">Analyzed Output</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <md-icon-button onClick={() => handleCopy(outputData, setOutputCopyIcon)} disabled={outputData.length === 0 || isLoading} title="Copy as JSON">
                            <span className="material-symbols-outlined">{outputCopyIcon}</span>
                        </md-icon-button>
                        <md-icon-button onClick={() => setOutputData([])} disabled={outputData.length === 0 || isLoading} title="Clear Output">
                            <span className="material-symbols-outlined">delete_sweep</span>
                        </md-icon-button>
                    </div>
                </div>
                {outputData.length > 0 ? (
                    <DataTable data={outputData} />
                ) : (
                    <div style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        border: '1px dashed var(--md-sys-color-outline-variant)',
                        borderRadius: '8px'
                    }}>
                        <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--md-sys-color-surface-variant)'}}>lab_profile</span>
                        <h3 className="md-typescale-title-medium" style={{marginTop: '16px'}}>Analysis Will Appear Here</h3>
                        <p className="md-typescale-body-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{placeholder}</p>
                    </div>
                )}
            </div>
        </ModuleWrapper>
    );
};