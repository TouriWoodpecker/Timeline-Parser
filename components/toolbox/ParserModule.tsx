import React, { useState, useCallback } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { IOField } from './IOField';
import { DataTable } from '../DataTable';
import { parseProtocolChunk } from '../../services/parsingService';
import { exportToCsv, exportToXlsx } from '../../services/fileService';
import type { ParsedEntry } from '../../types';

interface ParserModuleProps {
    rawText: string;
    setRawText: (text: string) => void;
    parsedData: ParsedEntry[];
    setParsedData: (data: ParsedEntry[]) => void;
    setLoading: (loading: boolean, message?: string) => void;
    onParsingComplete: (data: ParsedEntry[]) => void;
}

export const ParserModule: React.FC<ParserModuleProps> = ({
    rawText,
    setRawText,
    parsedData,
    setParsedData,
    setLoading,
    onParsingComplete
}) => {
    const [error, setError] = useState<string>('');
    const [protocolId, setProtocolId] = useState('WP7/9');

    const handleParse = useCallback(async () => {
        if (!rawText.trim()) {
            setError("Input text is empty. Please provide text from the OCR module or paste it here.");
            return;
        }
        setError('');
        setParsedData([]);

        try {
            setLoading(true, 'Parsing text into structured data...');
            
            const pageChunks = rawText.split(/==End of OCR for page \d+==/);
            const pageRegex = /==Start of OCR for page (\d+)==/;
            
            let allParsedEntries: ParsedEntry[] = [];
            let currentId = 1;

            for (const chunk of pageChunks) {
                if (chunk.trim()) {
                    const match = chunk.match(pageRegex);
                    const pageNum = match ? parseInt(match[1], 10) : 1;
                    
                    const cleanedChunk = chunk.replace(pageRegex, '').trim();
                    if (cleanedChunk) {
                        const parsedChunk = await parseProtocolChunk(cleanedChunk, protocolId, pageNum, currentId);
                        allParsedEntries = [...allParsedEntries, ...parsedChunk];
                        currentId = allParsedEntries.length + 1;
                    }
                }
            }
            
            setParsedData(allParsedEntries);
            onParsingComplete(allParsedEntries);

        } catch (err: any) {
            setError(`Parsing failed: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [rawText, protocolId, setLoading, setParsedData, onParsingComplete]);

    const handleClear = useCallback(() => {
        setRawText('');
        setParsedData([]);
        setError('');
    }, [setRawText, setParsedData]);

    return (
        <ModuleWrapper
            title="Parser"
            description="Structure the raw protocol text into a clear, tabular format by identifying speakers, questions, answers, and procedural notes."
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <md-outlined-text-field
                    label="Protocol ID"
                    value={protocolId}
                    onInput={(e: any) => setProtocolId(e.target.value)}
                    style={{ minWidth: '150px' }}
                />
                <md-filled-button onClick={handleParse} disabled={!rawText}>
                    <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>mediation</span>
                    Parse Text
                </md-filled-button>
            </div>
            <IOField
                label="Raw Text Input"
                value={rawText}
                onValueChange={setRawText}
                placeholder="Paste raw text here or use output from the OCR module."
                showClear
                onClear={handleClear}
            />
            {error && <div style={{ color: 'var(--md-sys-color-error)' }}>{error}</div>}
            
            {parsedData.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="md-typescale-title-medium">Parsed Protocol</h3>
                         <div style={{display: 'flex', gap: '8px'}}>
                            <md-filled-tonal-button onClick={() => exportToCsv(parsedData, 'parsed-protocol.csv')}>
                                 <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>download</span>
                                CSV
                            </md-filled-tonal-button>
                            <md-filled-tonal-button onClick={() => exportToXlsx(parsedData, 'parsed-protocol.xlsx')}>
                                 <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>download</span>
                                XLSX
                            </md-filled-tonal-button>
                         </div>
                    </div>
                    <DataTable data={parsedData} />
                </div>
            )}
        </ModuleWrapper>
    );
};
