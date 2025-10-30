import React from 'react';
import type { KeyInsights } from '../types';
import { renderMarkdown } from '../utils/markdown';

interface InsightsPanelProps {
  insights: KeyInsights | null;
  isLoading: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  isLoading,
  isMinimized,
  onToggleMinimize,
}) => {

  const hasInsights = !isLoading && insights;

  const handleCopy = () => {
    if (!insights || !navigator.clipboard) return;

    const textToCopy = [
        insights.summary,
        ...insights.insights.map(item => `${item.title}\n${item.description}\nBelege: ${item.references}`)
    ].join('\n\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
        // Optional: show a toast or message
    }).catch(err => {
        console.error("Could not copy insights to clipboard.", err);
    });
  };


  const renderContent = () => {
    if (!insights) {
      return (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px dashed var(--md-sys-color-outline-variant)',
          borderRadius: '8px'
        }}>
          <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--md-sys-color-surface-variant)'}}>auto_awesome</span>
          <h3 className="md-typescale-title-medium" style={{marginTop: '16px', color: 'var(--md-sys-color-on-surface-variant)'}}>AI-Powered Insights</h3>
          <p className="md-typescale-body-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>Click "Find Key Insights" in the timeline panel to generate a summary.</p>
        </div>
      );
    }

    return (
      <div>
        <p className="md-typescale-body-large" dangerouslySetInnerHTML={{ __html: renderMarkdown(insights.summary) }} />
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {insights.insights.map((item, index) => (
            <div key={index} style={{
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3
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
    );
  };

  return (
    <div className={`card ${isMinimized ? 'card--filled' : 'card--elevated'}`}>
        <div className="panel-header" onClick={onToggleMinimize} style={{ cursor: 'pointer' }}>
            <div className="panel-header-title">
                <h2 className="md-typescale-title-large" style={{ margin: 0 }}>Insights</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {hasInsights && (
                    <md-icon-button
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        title="Copy Insights"
                    >
                        <span className="material-symbols-outlined">content_copy</span>
                    </md-icon-button>
                )}
                <md-icon-button aria-label={isMinimized ? 'Expand panel' : 'Collapse panel'}>
                    <span className="material-symbols-outlined">{isMinimized ? 'expand_more' : 'expand_less'}</span>
                </md-icon-button>
            </div>
        </div>
        <div className="panel-content">
          {!isMinimized && (
            <>
              {renderContent()}
            </>
          )}
        </div>
    </div>
  );
};