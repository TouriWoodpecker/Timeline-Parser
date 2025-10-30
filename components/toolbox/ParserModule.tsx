import React, { useState, useRef } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { IOField } from './IOField';
import { parseProtocolChunk } from '../../services/parsingService';
import { getRandomQuote } from '../../utils/quotes';
import { ParsedEntry } from '../../types';
import { exportToCsv } from '../../services/fileService';
import { DataTable } from '../DataTable';

interface ParserModuleProps {
    setLoading: (loading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setStatusMessage: (message: string) => void;
    setError: (error: string | null) => void;
}


export const ParserModule: React.FC<ParserModuleProps> = ({
    setLoading,
    setLoadingMessage,
    setStatusMessage,
    setError
}) => {
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedEntry[]>([]);
    const [placeholder] = useState(getRandomQuote());
    const [copyIcon, setCopyIcon] = useState('content_copy');
    const [isLoading, setIsLoading] = useState(false); // Local state for button disable
    
    const stopOperationRef = useRef(false);

    const handleParse = async () => {
        if (!inputText.trim()) {
            setError("Please provide the text from the OCR module.");
            return;
        }

        setIsLoading(true);
        setLoading(true);
        stopOperationRef.current = false;
        setError(null);
        setParsedData([]);
        setStatusMessage('');

        try {
            const protocolMatch = inputText.match(/WP_(\d+)\/\d+/);
            if (!protocolMatch) {
                throw new Error("Could not find a protocol ID (e.g., WP_80/06) in the text. The parser requires text from the OCR module to identify the protocol.");
            }
            const protocolId = `WP${protocolMatch[1]}`;
            setLoadingMessage(`Processing protocol: ${protocolId}...`);

            const pageChunks = inputText.split(/==Start of OCR for page (\d+)==/);
            
            let allParsedEntries: ParsedEntry[] = [];
            let currentEntryId = 1;
            const totalPages = pageChunks.length > 1 ? Math.floor((pageChunks.length - 1) / 2) : 0;
            const warnings: string[] = [];

            for (let i = 1; i < pageChunks.length; i += 2) {
                if (stopOperationRef.current) {
                    break;
                }
                const pageNumber = parseInt(pageChunks[i], 10);
                let textChunk = pageChunks[i + 1] || '';
                textChunk = textChunk.split(/==End of OCR for page \d+==/)[0];

                if (!textChunk.trim()) continue;

                setLoadingMessage(`Parsing page ${pageNumber} of ${totalPages}...`);

                try {
                    const parsedEntries = await parseProtocolChunk(textChunk, protocolId, pageNumber, currentEntryId);
                    allParsedEntries.push(...parsedEntries);
                    setParsedData([...allParsedEntries]);
                    currentEntryId += parsedEntries.length;
                } catch (error) {
                    console.error(`Skipping page ${pageNumber} due to a critical parsing error.`);
                    warnings.push(`Warning: Page ${pageNumber} was skipped due to a parsing error.`);
                }
            }
           
            if (stopOperationRef.current) {
                setStatusMessage('Parsing aborted by user.');
            } else {
                const finalPageCount = totalPages > 0 ? totalPages : (allParsedEntries.length > 0 ? 1 : 0);
                let message = `Parsing complete. ${allParsedEntries.length} entries extracted from ${finalPageCount} page(s).`;
                if (warnings.length > 0) {
                    message += '\n' + warnings.join('\n');
                }
                setStatusMessage(message);
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
            setLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleAbort = () => {
        stopOperationRef.current = true;
    };

    const handleExportCsv = () => {
        if (parsedData.length > 0) {
            const protocolMatch = inputText.match(/WP_(\d+)\/\d+/);
            const protocolId = protocolMatch ? `WP${protocolMatch[1]}` : 'parsed-protocol';
            exportToCsv(parsedData, `${protocolId}-parsed-${new Date().toISOString().slice(0,10)}.csv`);
            setStatusMessage('Exported to CSV.');
        }
    };
    
    const handleCopyJson = () => {
        if (parsedData.length > 0) {
            navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
            setCopyIcon('check');
            setTimeout(() => setCopyIcon('content_copy'), 2000);
            setStatusMessage('Copied JSON to clipboard.');
        }
    };

    const hasData = parsedData.length > 0;

    return (
        <ModuleWrapper
            title="Parser"
            description="Paste raw text from the OCR module. The AI will automatically detect pages and structure the content into a data table."
        >
            <IOField
                label="Input Text"
                value={inputText}
                onValueChange={setInputText}
                placeholder={placeholder}
                rows={10}
                disabled={isLoading}
                showClear
                onClear={() => setInputText('')}
            />
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                 <md-filled-icon-button onClick={handleParse} disabled={isLoading || !inputText.trim()} title="Parse Text">
                    <span className="material-symbols-outlined">mediation</span>
                </md-filled-icon-button>
                {isLoading && (
                    <md-outlined-button onClick={handleAbort}>
                        <span className="material-symbols-outlined" slot="icon">cancel</span>
                        Abort
                    </md-outlined-button>
                )}
            </div>

            <div style={{marginTop: '24px'}}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="md-typescale-title-medium">Output</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <md-icon-button onClick={handleCopyJson} disabled={!hasData || isLoading} title="Copy as JSON">
                            <span className="material-symbols-outlined">{copyIcon}</span>
                        </md-icon-button>
                        <md-icon-button onClick={handleExportCsv} disabled={!hasData || isLoading} title="Export CSV">
                            <span className="material-symbols-outlined">download</span>
                        </md-icon-button>
                    </div>
                </div>
                 {hasData ? (
                    <DataTable data={parsedData} />
                ) : (
                     <div style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      border: '1px dashed var(--md-sys-color-outline-variant)',
                      borderRadius: '8px'
                    }}>
                      <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--md-sys-color-surface-variant)'}}>hub</span>
                      <h3 className="md-typescale-title-medium" style={{marginTop: '16px'}}>Parsed Data Will Appear Here</h3>
                      <p className="md-typescale-body-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{placeholder}</p>
                    </div>
                )}
            </div>
        </ModuleWrapper>
    );
};