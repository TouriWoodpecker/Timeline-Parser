import React from 'react';
import { OcrModule } from './components/toolbox/OcrModule';
import { ParserModule } from './components/toolbox/ParserModule';
import { AnalyzerModule } from './components/toolbox/AnalyzerModule';
import { InsightsModule } from './components/toolbox/InsightsModule';

interface ToolboxProps {
    activeTab: number;
    setLoading: (loading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setStatusMessage: (message: string) => void;
    setError: (error: string | null) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ 
    activeTab,
    setLoading,
    setLoadingMessage,
    setStatusMessage,
    setError 
}) => {
    // The top padding is adjusted to account for the fixed header only.
    const topPadding = '88px'; 

    const moduleProps = {
        setLoading,
        setLoadingMessage,
        setStatusMessage,
        setError,
    };

    return (
        <div style={{ paddingTop: topPadding, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div role="tabpanel" id="ocr-panel" hidden={activeTab !== 0}>
                <OcrModule {...moduleProps} />
            </div>
            <div role="tabpanel" id="parser-panel" hidden={activeTab !== 1}>
                <ParserModule {...moduleProps} />
            </div>
            <div role="tabpanel" id="analyzer-panel" hidden={activeTab !== 3}>
                <AnalyzerModule {...moduleProps} />
            </div>
            <div role="tabpanel" id="insights-panel" hidden={activeTab !== 4}>
                <InsightsModule {...moduleProps} />
            </div>
        </div>
    );
};