import React, { useState, useRef, useCallback, useEffect } from 'react';

// Import services
import { parseProtocolChunk } from './services/parsingService';
import { analyzeEntry, findKeyInsights } from './services/analysisService';
import { extractTextFromPdf, processCsvFile, exportToCsv, exportToXlsx } from './services/fileService';

// Import types
import { ParsedEntry, KeyInsights } from './types';

// Import components
import { Header } from './components/Header';
import { PageTitle } from './components/PageTitle';
import { InputPanel } from './components/InputPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { InsightsPanel } from './components/InsightsPanel';
import { Footer } from './components/Footer';
import { FabMenu } from './components/FabMenu';
import { Toolbox } from './Toolbox';
import { LandingPage } from './components/toolbox/LandingPage';

type View = 'app' | 'toolbox';
type ToolboxView = 'landing' | 'tools';

function App() {
  // --- View State --- //
  const [view, setView] = useState<View>('toolbox');
  const [toolboxView, setToolboxView] = useState<ToolboxView>('landing');
  const [activeToolboxTab, setActiveToolboxTab] = useState(2); // Home is default
  
  // Input and file state
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy Text');

  // Data state
  const [pairedData, setPairedData] = useState<ParsedEntry[]>([]);
  const [insights, setInsights] = useState<KeyInsights | null>(null);

  // Loading and error state
  const [isExtracting, setIsExtracting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFindingInsights, setIsFindingInsights] = useState(false);
  const [isToolboxLoading, setIsToolboxLoading] = useState(false); // New state for toolbox
  const [loadingMessage, setLoadingMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [isInputMinimized, setIsInputMinimized] = useState(true);
  const [isTimelineMinimized, setIsTimelineMinimized] = useState(true);
  const [isInsightsMinimized, setIsInsightsMinimized] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [headerMessage, setHeaderMessage] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const stopOperationRef = useRef(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const headerMessageTimeoutRef = useRef<number | null>(null);


  // --- Effects --- //
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderVisible(!entry.isIntersecting);
      },
      { rootMargin: `-${headerRef.current?.offsetHeight || 64}px 0px 0px 0px`, threshold: 0 }
    );
    if (titleRef.current && view === 'app') { // Only observe in app view
      observer.observe(titleRef.current);
    }
    return () => observer.disconnect();
  }, [view]); // Rerun when view changes
  
  // Effect to manage the global header message based on app state
  useEffect(() => {
    if (headerMessageTimeoutRef.current) {
        clearTimeout(headerMessageTimeoutRef.current);
        headerMessageTimeoutRef.current = null;
    }

    let message = '';
    let isSticky = false;
    let isError = false;

    if (loadingMessage) {
        message = loadingMessage;
        isSticky = true;
    } else if (error) {
        message = `Error: ${error}`;
        isError = true;
    } else if (statusMessage) {
        message = statusMessage;
    }

    setHeaderMessage(message);

    if (message && !isSticky) {
        const timeoutDuration = isError ? 6000 : 4000;
        headerMessageTimeoutRef.current = window.setTimeout(() => {
            setHeaderMessage('');
            // Clear the source messages too
            if(statusMessage) setStatusMessage('');
            if(error) setError(null);
        }, timeoutDuration);
    }

    return () => {
        if (headerMessageTimeoutRef.current) {
            clearTimeout(headerMessageTimeoutRef.current);
        }
    };
  }, [loadingMessage, statusMessage, error]);


  // --- Handlers --- //
  const resetState = () => {
    setInputText('');
    setFileName('');
    setPairedData([]);
    setInsights(null);
    setIsExtracting(false);
    setIsParsing(false);
    setIsAnalyzing(false);
    setIsFindingInsights(false);
    setLoadingMessage('');
    setStatusMessage('State cleared.');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };
  
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    setFileName(file.name);
    setIsExtracting(true);
    stopOperationRef.current = false;
    setError(null);

    try {
      const extractedText = await extractTextFromPdf(file, setLoadingMessage, stopOperationRef);
      if (stopOperationRef.current) {
        setStatusMessage('Text extraction aborted by user.');
        setInputText('');
      } else {
        setInputText(extractedText);
        setStatusMessage('Text extraction complete.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsExtracting(false);
      setLoadingMessage('');
    }
  };


  const onParse = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsParsing(true);
    stopOperationRef.current = false;
    setError(null);
    setPairedData([]);
    setInsights(null);
    setStatusMessage('');

    try {
        const protocolMatch = inputText.match(/WP_(\d+)\/\d+/);
        if (!protocolMatch) {
            throw new Error("Could not find the protocol ID (e.g., WP_79/1) in the text.");
        }
        const protocolId = `WP${protocolMatch[1]}`;
        setLoadingMessage(`Processing protocol: ${protocolId}...`);

        const pageChunks = inputText.split(/==Start of OCR for page (\d+)==/);

        let allParsedEntries: ParsedEntry[] = [];
        let currentEntryId = 1;
        const totalPages = Math.floor((pageChunks.length - 1) / 2);

        for (let i = 1; i < pageChunks.length; i += 2) {
            if (stopOperationRef.current) {
                setStatusMessage('Parsing aborted by user.');
                break;
            }
            const pageNumber = parseInt(pageChunks[i], 10);
            let textChunk = pageChunks[i + 1] || '';

            textChunk = textChunk.split(/==End of OCR for page \d+==/)[0];

            if (!textChunk.trim()) {
                continue; 
            }

            setLoadingMessage(`Parsing page ${pageNumber} of ${totalPages}...`);

            try {
                const parsedEntries = await parseProtocolChunk(
                    textChunk,
                    protocolId,
                    pageNumber,
                    currentEntryId
                );

                allParsedEntries.push(...parsedEntries);
                setPairedData([...allParsedEntries]);
                currentEntryId += parsedEntries.length;

            } catch (error) {
                console.error(`Skipping page ${pageNumber} due to a critical parsing error.`);
                setStatusMessage(prev => `${prev}\nWarning: Page ${pageNumber} could not be parsed and was skipped.`.trim());
            }
        }

        if (!stopOperationRef.current) {
            setStatusMessage(prev => `${prev}\nParsing complete. ${allParsedEntries.length} entries extracted from ${totalPages} pages.`.trim());
        }

    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsParsing(false);
        setLoadingMessage('');
    }
}, [inputText]);
  
  const onUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const { data, warnings } = await processCsvFile(file);
        setPairedData(data);
        
        let message = `Successfully imported ${data.length} entries from ${file.name}.`;
        if (warnings.length > 0) {
            message += `\n\nWarnings:\n- ${warnings.join('\n- ')}`;
        }
        setStatusMessage(message);
        setError(null);
    } catch (e: any) {
        setError(`Failed to import CSV: ${e.message}`);
    }
  };
  
  const onAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    stopOperationRef.current = false;
    setError(null);
    setStatusMessage('');
    
    const dataToAnalyze = pairedData.filter(d => d.question && d.answer && !d.kernaussage);
    if(dataToAnalyze.length === 0) {
      setStatusMessage("All entries have already been analyzed.");
      setIsAnalyzing(false);
      return;
    }
    
    let processedCount = 0;

    for (const entry of pairedData) {
        if (stopOperationRef.current) {
            setStatusMessage(`Analysis stopped by user. ${processedCount} entries were processed.`);
            break;
        }
        
        if (!entry.question || !entry.answer || entry.kernaussage) {
            continue;
        }
        
        processedCount++;
        setLoadingMessage(`Analyzing entry ${processedCount} of ${dataToAnalyze.length}...`);

        const analyzedEntry = await analyzeEntry(entry);

        setPairedData(currentData =>
            currentData.map(d => d.id === analyzedEntry.id ? analyzedEntry : d)
        );
    }
    
    if (!stopOperationRef.current) {
      setStatusMessage(`Analysis complete. ${processedCount} entries were processed.`);
    }

    setIsAnalyzing(false);
    setLoadingMessage('');
  }, [pairedData]);

  const onStopAnalysis = () => {
    stopOperationRef.current = true;
    setStatusMessage('Stopping analysis...');
  };
  
  const onAbortOperation = () => {
      stopOperationRef.current = true;
      setStatusMessage('Aborting operation...');
  };

  const onFindInsights = useCallback(async () => {
    setIsFindingInsights(true);
    setError(null);
    setInsights(null);
    setLoadingMessage('Finding key insights...');
    try {
      const result = await findKeyInsights(pairedData);
      setInsights(result);
      setStatusMessage('Key insights generated successfully.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsFindingInsights(false);
      setLoadingMessage('');
    }
  }, [pairedData]);

  const onCopyText = () => {
    navigator.clipboard.writeText(inputText);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy Text'), 2000);
  };
  
  const onExportCSV = () => {
      const date = new Date().toISOString().slice(0, 10);
      exportToCsv(pairedData, `protocol-analysis-${date}.csv`);
      setStatusMessage('Exported to CSV.');
  };

  const onExportXLSX = () => {
      const date = new Date().toISOString().slice(0, 10);
      exportToXlsx(pairedData, `protocol-analysis-${date}.xlsx`);
      setStatusMessage('Exported to XLSX.');
  };

  const handleToggleView = () => {
    if (view === 'app') {
      setView('toolbox');
      setToolboxView('landing'); // Always go to landing page first
      setActiveToolboxTab(2); // Reset to home
    } else {
      setView('app');
    }
  };
  
  const handleSelectModule = (index: number) => {
      setActiveToolboxTab(index);
      setToolboxView('tools');
  };

  const handleToolboxTabSelect = (index: number) => {
    setActiveToolboxTab(index);
    setToolboxView('tools');
  };
  
  const handleGoHome = () => {
    setToolboxView('landing');
    setActiveToolboxTab(2); // Home is index 2
  };

  const isLoadingApp = isExtracting || isParsing || isAnalyzing || isFindingInsights;
  const isHeaderLoading = isLoadingApp || isToolboxLoading;

  const renderCurrentView = () => {
    if (view === 'toolbox') {
      if (toolboxView === 'landing') {
        return <LandingPage onSelectModule={handleSelectModule} />;
      }
      return (
        <Toolbox 
            activeTab={activeToolboxTab}
            setLoading={setIsToolboxLoading}
            setLoadingMessage={setLoadingMessage}
            setStatusMessage={setStatusMessage}
            setError={setError}
        />
      );
    }

    // Default to app view
    return (
      <>
        <PageTitle ref={titleRef} />
        <div className="panels-container">
          <InputPanel
            inputText={inputText}
            setInputText={setInputText}
            fileName={fileName}
            isLoading={isExtracting || isParsing}
            fileInputRef={fileInputRef}
            copyButtonText={copyButtonText}
            onFileChange={onFileChange}
            onParse={onParse}
            onCopyText={onCopyText}
            onClear={resetState}
            isMinimized={isInputMinimized}
            onToggleMinimize={() => setIsInputMinimized(p => !p)}
            onAbortOperation={onAbortOperation}
          />
          <TimelinePanel
            pairedData={pairedData}
            isLoading={isParsing}
            isAnalyzing={isAnalyzing}
            onUploadCSV={onUploadCSV}
            csvFileInputRef={csvFileInputRef}
            onAnalyze={onAnalyze}
            onStopAnalysis={onStopAnalysis}
            onExportCSV={onExportCSV}
            onExportXLSX={onExportXLSX}
            isMinimized={isTimelineMinimized}
            onToggleMinimize={() => setIsTimelineMinimized(p => !p)}
            onFindInsights={onFindInsights}
            isFindingInsights={isFindingInsights}
          />
          <InsightsPanel
            insights={insights}
            isLoading={isFindingInsights}
            isMinimized={isInsightsMinimized}
            onToggleMinimize={() => setIsInsightsMinimized(p => !p)}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <Header 
        ref={headerRef}
        isVisible={isHeaderVisible || view === 'toolbox'} 
        message={headerMessage}
        isLoading={isHeaderLoading}
      />
      <main>
        {renderCurrentView()}
      </main>
      <Footer 
        view={view}
        toolboxView={toolboxView}
        activeTabIndex={activeToolboxTab}
        onTabSelect={handleToolboxTabSelect}
        onGoHome={handleGoHome}
      />
      <FabMenu 
        view={view}
        onToggleView={handleToggleView}
      />
    </>
  );
}

export default App;