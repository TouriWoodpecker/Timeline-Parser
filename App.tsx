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

function App() {
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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  
  // UI state
  const [isInputMinimized, setIsInputMinimized] = useState(true);
  const [isTimelineMinimized, setIsTimelineMinimized] = useState(true);
  const [isInsightsMinimized, setIsInsightsMinimized] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const stopOperationRef = useRef(false);
  const pairedDataRef = useRef<ParsedEntry[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);


  // --- Effects --- //
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderVisible(!entry.isIntersecting);
      },
      { rootMargin: `-${headerRef.current?.offsetHeight || 64}px 0px 0px 0px`, threshold: 0 }
    );
    if (titleRef.current) {
      observer.observe(titleRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Sync state with ref for use in async callbacks
  useEffect(() => {
    pairedDataRef.current = pairedData;
  }, [pairedData]);


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
    setStatusMessage('');
    setError(null);
    setAnalysisError(null);
    setInsightsError(null);
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
        // 1. Find protocol ID using regex, not AI.
        const protocolMatch = inputText.match(/WP_(\d+)\/\d+/);
        if (!protocolMatch) {
            throw new Error("Could not find the protocol ID (e.g., WP_79/1) in the text.");
        }
        const protocolId = `WP${protocolMatch[1]}`;
        setLoadingMessage(`Processing protocol: ${protocolId}...`);

        // 2. Split text by OCR markers.
        const pageChunks = inputText.split(/==Start of OCR for page (\d+)==/);

        let allParsedEntries: ParsedEntry[] = [];
        let currentEntryId = 1;
        const totalPages = Math.floor((pageChunks.length - 1) / 2);

        // 3. Iterate through chunks and parse them.
        // Start at index 1, because index 0 is the text BEFORE the first page marker.
        for (let i = 1; i < pageChunks.length; i += 2) {
            if (stopOperationRef.current) {
                setStatusMessage('Parsing aborted by user.');
                break;
            }
            const pageNumber = parseInt(pageChunks[i], 10);
            let textChunk = pageChunks[i + 1] || '';

            // Remove the "End of Page" marker if it exists.
            textChunk = textChunk.split(/==End of OCR for page \d+==/)[0];

            if (!textChunk.trim()) {
                continue; // Skip empty pages.
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
                // Update state incrementally to show results as they come in.
                setPairedData([...allParsedEntries]);
                currentEntryId += parsedEntries.length;

            } catch (error) {
                console.error(`Skipping page ${pageNumber} due to a critical parsing error.`);
                // Update status to inform user about the skipped page.
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
        setAnalysisError(null);
    } catch (e: any) {
        setAnalysisError(`Failed to import CSV: ${e.message}`);
    }
  };
  
  const onAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    stopOperationRef.current = false;
    setAnalysisError(null);
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
  };
  
  const onAbortOperation = () => {
      stopOperationRef.current = true;
  };

  const onFindInsights = useCallback(async () => {
    setIsFindingInsights(true);
    setInsightsError(null);
    setInsights(null);
    try {
      const result = await findKeyInsights(pairedData);
      setInsights(result);
    } catch (e: any) {
      setInsightsError(e.message);
    } finally {
      setIsFindingInsights(false);
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
  };

  const onExportXLSX = () => {
      const date = new Date().toISOString().slice(0, 10);
      exportToXlsx(pairedData, `protocol-analysis-${date}.xlsx`);
  };

  const isLoading = isExtracting || isParsing;

  return (
    <>
      <Header isVisible={isHeaderVisible} ref={headerRef} />
      <main>
        <PageTitle ref={titleRef} />
        <div className="panels-container">
          <InputPanel
            inputText={inputText}
            setInputText={setInputText}
            fileName={fileName}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
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
            loadingMessage={loadingMessage}
            statusMessage={statusMessage}
            analysisError={analysisError}
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
            error={insightsError}
            isMinimized={isInsightsMinimized}
            onToggleMinimize={() => setIsInsightsMinimized(p => !p)}
          />
        </div>
      </main>
      <Footer />
      <FabMenu />
    </>
  );
}

export default App;
