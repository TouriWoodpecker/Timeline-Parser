import React, { useState, useCallback } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { findKeyInsights } from '../../services/analysisService';
import { exportTextFile } from '../../services/fileService';
import { ParsedEntry, KeyInsights } from '../../types';
import { renderMarkdown } from '../../utils/markdown';

interface InsightsModuleProps {
    analyzedData: ParsedEntry[];
    keyInsights: KeyInsights | null;
    setKeyInsights: (insights: KeyInsights | null) => void;
    setLoading: (loading: boolean, message?: string) => void;
}

export const InsightsModule: React.FC<InsightsModuleProps> = ({
    analyzedData,
    keyInsights,
    setKeyInsights,
    setLoading,
}) => {
    const [error, setError] = useState<string>('');
    const hasAnalyzedData = analyzedData.some(d => d.kernaussage);

    const handleFindInsights = useCallback(async () => {
        if (!hasAnalyzedData) {
            setError("No analyzed data available. Please run the analysis first.");
            return;
        }
        setError('');
        setKeyInsights(null);

        try {
            setLoading(true, 'Synthesizing key insights from analyzed data...');
            const insights = await findKeyInsights(analyzedData);
            setKeyInsights(insights);
        } catch (err: any) {
            setError(`Failed to find insights: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [analyzedData, hasAnalyzedData, setLoading, setKeyInsights]);
    
    const handleExport = () => {
        if (keyInsights) {
            const content = `
# Key Insights Report

## Summary
${keyInsights.summary}

---

## Top 3 Insights

${keyInsights.insights.map(insight => `
### ${insight.title}
**Description:** ${insight.description}
**References:** ${insight.references}
`).join('\n---\n')}
            `;
            exportTextFile(content.trim(), 'key-insights.md', 'text/markdown');
        }
    };

    return (
        <ModuleWrapper
            title="Insights"
            description="Synthesize the analyzed protocol to extract a high-level summary and the top three most significant or surprising insights."
        >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <md-filled-button onClick={handleFindInsights} disabled={!hasAnalyzedData}>
                    <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>insights</span>
                    Find Key Insights
                </md-filled-button>
            </div>
            {error && <div style={{ color: 'var(--md-sys-color-error)' }}>{error}</div>}

            {!hasAnalyzedData && !keyInsights && (
                <p>No analyzed data to process. Use the Analyzer module first.</p>
            )}

            {keyInsights && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="md-typescale-title-medium">Generated Report</h3>
                            <md-filled-tonal-button onClick={handleExport}>
                                <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>download</span>
                                Export as Markdown
                            </md-filled-tonal-button>
                        </div>
                        <div className="card" style={{ padding: '24px' }}>
                            <h4 className="md-typescale-title-large">Summary</h4>
                            <div className="md-typescale-body-large" dangerouslySetInnerHTML={{ __html: renderMarkdown(keyInsights.summary) }} />
                        </div>
                    </div>

                    <div>
                        <h4 className="md-typescale-title-large">Top 3 Insights</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {keyInsights.insights.map((insight, index) => (
                                <div key={index} className="card" style={{ padding: '24px' }}>
                                    <h5 className="md-typescale-title-medium" style={{ margin: '0 0 8px 0' }}>{insight.title}</h5>
                                    <p className="md-typescale-body-medium" dangerouslySetInnerHTML={{ __html: renderMarkdown(insight.description) }} style={{ margin: '0 0 16px 0' }} />
                                    <p className="md-typescale-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                                        References: {insight.references}
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
