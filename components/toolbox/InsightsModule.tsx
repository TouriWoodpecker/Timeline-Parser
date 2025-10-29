import React, { useState } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { findKeyInsights } from '../../services/analysisService';
import { ParsedEntry, KeyInsights } from '../../types';
import { getRandomQuote } from '../../utils/quotes';
import { DataTable } from '../DataTable';
import { processCsvFile } from '../../services/fileService';
import { renderMarkdown } from '../../utils/markdown';
import '../../types';

interface InsightsModuleProps {
    setLoading: (loading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setStatusMessage: (message: string) => void;
    setError: (error: string | null) => void;
}

export const InsightsModule: React.FC<InsightsModuleProps> = ({
    setLoading,
    setLoadingMessage,
    setStatusMessage,
    setError,
}) => {
    const [data, setData] = useState<ParsedEntry[]>([]);
    const [insights, setInsights] = useState<KeyInsights | null>(null);
    const [placeholder] = useState(getRandomQuote());
    const [isLoading, setIsLoading] = useState(false); // Local state for button disable

    const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { data: importedData, warnings } = await processCsvFile(file);
            setData(importedData);
            let message = `Successfully imported ${importedData.length} entries for insights generation.`;
            if (warnings.length > 0) {
                message += `\n\nWarnings:\n- ${warnings.join('\n- ')}`;
            }
            setStatusMessage(message);
            setError(null);
        } catch (e: any) {
            setError(`Failed to import CSV: ${e.message}`);
        }
    };

    const handleFindInsights = async () => {
        if (data.length === 0) {
            setError("Please import a file with analyzed entries first.");
            return;
        }

        setError(null);
        setInsights(null);
        setIsLoading(true);
        setLoading(true);
        setLoadingMessage('Finding key insights...');

        try {
            const result = await findKeyInsights(data);
            setInsights(result);
            setStatusMessage('Key insights generated successfully.');
        } catch (e: any) {
            setError(`Failed to find insights: ${e.message}`);
        } finally {
            setIsLoading(false);
            setLoading(false);
            setLoadingMessage('');
        }
    };
    
    const triggerCsvUpload = () => document.getElementById('insights-csv-upload')?.click();

    return (
        <ModuleWrapper
            title="Insights"
            description="Import a CSV file containing analyzed entries to generate a high-level summary and identify the top three key insights from the data."
        >
            <input type="file" onChange={handleImportCsv} style={{ display: 'none' }} accept=".csv" id="insights-csv-upload" />
            
            {/* Input Section */}
            <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="md-typescale-title-medium">Input Data</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <md-icon-button onClick={triggerCsvUpload} disabled={isLoading} title="Import Analyzed CSV">
                            <span className="material-symbols-outlined">upload</span>
                        </md-icon-button>
                        <md-icon-button onClick={() => setData([])} disabled={data.length === 0 || isLoading} title="Clear Data">
                            <span className="material-symbols-outlined">delete_sweep</span>
                        </md-icon-button>
                    </div>
                </div>
                 {data.length > 0 ? (
                    <>
                        <p className="md-typescale-body-medium" style={{marginBottom: '16px', color: 'var(--md-sys-color-on-surface-variant)'}}>
                            {data.length} entries loaded and ready for insight generation.
                        </p>
                        <DataTable data={data} />
                    </>
                 ) : (
                     <div style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        border: '1px dashed var(--md-sys-color-outline-variant)',
                        borderRadius: '8px'
                    }}>
                        <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--md-sys-color-surface-variant)'}}>file_upload</span>
                        <h3 className="md-typescale-title-medium" style={{marginTop: '16px'}}>Awaiting Data</h3>
                        <p className="md-typescale-body-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{placeholder}</p>
                    </div>
                 )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0'}}>
                <md-filled-icon-button onClick={handleFindInsights} disabled={isLoading || data.length === 0} title="Find Insights">
                    <span className="material-symbols-outlined">insights</span>
                </md-filled-icon-button>
            </div>
            
            {insights && (
                <div style={{ 
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: 'var(--md-sys-color-surface-container-highest)'
                }}>
                    <h3 className="md-typescale-title-large">Generated Insights</h3>
                    <div style={{marginTop: '16px'}}>
                        <p className="md-typescale-body-large" dangerouslySetInnerHTML={{ __html: renderMarkdown(insights.summary) }} />
                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {insights.insights.map((item, index) => (
                            <div key={index} style={{
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            borderRadius: '8px',
                            padding: '16px'
                            }}>
                            <h4
                                className="md-typescale-title-medium"
                                style={{ margin: '0 0 8px 0' }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(`${index + 1}. **${item.title}**`) }}
                            />
                            <p
                                className="md-typescale-body-medium"
                                style={{ margin: '0 0 12px 0' }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }}
                            />
                            <p
                                className="md-typescale-label-large"
                                style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontFamily: 'monospace' }}
                            >
                                Belege: {item.references}
                            </p>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            )}
        </ModuleWrapper>
    );
};