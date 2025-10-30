import React from 'react';
import { OcrModule } from './components/toolbox/OcrModule';
import { ParserModule } from './components/toolbox/ParserModule';
import { AnalyzerModule } from './components/toolbox/AnalyzerModule';
import { InsightsModule } from './components/toolbox/InsightsModule';
import { LandingPage } from './components/toolbox/LandingPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ParsedEntry, KeyInsights } from './types';

interface ToolboxProps {
    view: 'landing' | 'tools';
    activeTabIndex: number;
    onSelectModule: (index: number) => void;
    setLoading: (loading: boolean, message?: string) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ view, activeTabIndex, onSelectModule, setLoading }) => {
    // Shared state across modules, persisted in localStorage
    const [rawText, setRawText] = useLocalStorage<string>('toolbox-rawText', '');
    const [parsedData, setParsedData] = useLocalStorage<ParsedEntry[]>('toolbox-parsedData', []);
    const [analyzedData, setAnalyzedData] = useLocalStorage<ParsedEntry[]>('toolbox-analyzedData', []);
    const [keyInsights, setKeyInsights] = useLocalStorage<KeyInsights | null>('toolbox-keyInsights', null);

    if (view === 'landing') {
        return <LandingPage onSelectModule={onSelectModule} />;
    }
    
    const renderActiveModule = () => {
        switch (activeTabIndex) {
            case 0: // OCR
                return <OcrModule
                    rawText={rawText}
                    setRawText={setRawText}
                    setLoading={setLoading}
                    onOcrComplete={(text) => {
                        setRawText(text);
                        // Automatically switch to Parser module
                        onSelectModule(1); 
                    }}
                />;
            case 1: // Parser
                return <ParserModule
                    rawText={rawText}
                    setRawText={setRawText}
                    parsedData={parsedData}
                    setParsedData={setParsedData}
                    setLoading={setLoading}
                    onParsingComplete={(data) => {
                        setParsedData(data);
                        setAnalyzedData([]); // Clear old analysis
                        setKeyInsights(null); // Clear old insights
                        // Automatically switch to Analyze module
                        onSelectModule(3);
                    }}
                />;
            case 3: // Analyze
                return <AnalyzerModule
                    parsedData={parsedData}
                    analyzedData={analyzedData}
                    setAnalyzedData={setAnalyzedData}
                    setLoading={setLoading}
                    onAnalysisComplete={(data) => {
                        setAnalyzedData(data);
                        setKeyInsights(null); // Clear old insights
                        // Automatically switch to Insights module
                        onSelectModule(4);
                    }}
                />;
            case 4: // Insights
                return <InsightsModule
                    analyzedData={analyzedData}
                    keyInsights={keyInsights}
                    setKeyInsights={setKeyInsights}
                    setLoading={setLoading}
                />;
            default:
                return <LandingPage onSelectModule={onSelectModule} />;
        }
    };

    return <div>{renderActiveModule()}</div>;
};
