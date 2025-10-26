import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PageTitle } from './components/PageTitle';
import { InputPanel } from './components/InputPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { parseProtocol } from './services/geminiService';
import { analyzeTimeline } from './services/analysisService';
import type { ProtocolEntry, PairedProtocolEntry, AnalysisEntry } from './types';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}
declare const XLSX: any;
declare const Tesseract: any;

const processProtocolEntries = (entries: ProtocolEntry[]): PairedProtocolEntry[] => {
  const processed: PairedProtocolEntry[] = [];
  for (let i = 0; i < entries.length; ) {
      const current = entries[i];
      const next = i + 1 < entries.length ? entries[i+1] : null;

      if (current.type.toLowerCase() === 'frage' && next && next.type.toLowerCase() === 'antwort') {
          processed.push({
              id: current.id, sourceReference: current.sourceReference, questioner: current.speaker,
              question: current.content, witness: next.speaker, answer: next.content, note: null,
          });
          i += 2;
      } else {
          const displayNote = current.speaker.toLowerCase() === 'protokoll'
              ? current.content
              : `(${current.role}) ${current.speaker}: ${current.content}`;
          processed.push({
              id: current.id, sourceReference: current.sourceReference, questioner: null, question: null,
              witness: null, answer: null, note: displayNote,
          });
          i += 1;
      }
  }
  return processed;
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [pairedData, setPairedData] = useState<PairedProtocolEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [copyButtonText, setCopyButtonText] = useState<string>('Copy Text');
  const [isInputMinimized, setIsInputMinimized] = useState<boolean>(false);
  const [isOutputMinimized, setIsOutputMinimized] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const ocrPageRef = useRef(0);
  const isStoppingAnalysisRef = useRef<boolean>(false);
  const analysisOccurredError = useRef(false);

  useEffect(() => {
    try {
      const savedInputText = localStorage.getItem('inputText');
      const savedPairedData = localStorage.getItem('pairedData');
      const savedFileName = localStorage.getItem('fileName');
      const savedInputMinimized = localStorage.getItem('isInputMinimized');
      const savedOutputMinimized = localStorage.getItem('isOutputMinimized');

      if (savedInputText) setInputText(savedInputText);
      if (savedFileName) setFileName(savedFileName);
      if (savedPairedData) setPairedData(JSON.parse(savedPairedData));
      if (savedInputMinimized) setIsInputMinimized(JSON.parse(savedInputMinimized));
      if (savedOutputMinimized) setIsOutputMinimized(JSON.parse(savedOutputMinimized));
    } catch (err) {
      console.error("Failed to load state from localStorage:", err);
      localStorage.removeItem('pairedData');
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('inputText', inputText);
      localStorage.setItem('pairedData', JSON.stringify(pairedData));
      localStorage.setItem('fileName', fileName);
      localStorage.setItem('isInputMinimized', JSON.stringify(isInputMinimized));
      localStorage.setItem('isOutputMinimized', JSON.stringify(isOutputMinimized));
    } catch (err) {
      console.error("Failed to save state to localStorage:", err);
    }
  }, [inputText, pairedData, fileName, isInputMinimized, isOutputMinimized]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (err) {
      console.error("Failed to save theme to localStorage:", err);
    }
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const handleParse = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setPairedData([]);
    setAnalysisError(null);
    setStatusMessage('');

    // The maximum number of pages to include in a single API call.
    const CHUNK_SIZE_IN_PAGES = 20;

    try {
        // Split the input text into pages using a positive lookahead.
        // This keeps the delimiter ("==Start of OCR...") with its page content.
        const pageStartDelimiter = /(?===Start of OCR for page \d+==)/;
        const pages = inputText.split(pageStartDelimiter).filter(p => p.trim());

        // Group pages into larger chunks for processing.
        const chunks: string[] = [];
        for (let i = 0; i < pages.length; i += CHUNK_SIZE_IN_PAGES) {
            chunks.push(pages.slice(i, i + CHUNK_SIZE_IN_PAGES).join(''));
        }

        // Handle case where there are no page markers, but there is text.
        if (chunks.length === 0 && inputText.trim().length > 0) {
            chunks.push(inputText);
        }
        
        const totalChunks = chunks.length;
        let allEntries: ProtocolEntry[] = [];

        // Process each chunk sequentially.
        for (let i = 0; i < totalChunks; i++) {
            const chunk = chunks[i];
            
            // For a better loading message, try to find the starting page number in the chunk.
            const startPageMatch = chunk.match(/page (\d+)/);
            const startPageInfo = startPageMatch ? ` (starting around page ${startPageMatch[1]})` : '';
            setLoadingMessage(`Parsing chunk ${i + 1} of ${totalChunks}${startPageInfo}...`);
            
            const chunkResult = await parseProtocol(chunk);
            allEntries.push(...chunkResult);
        }

        if (totalChunks > 0) {
          setLoadingMessage('Finalizing and combining results...');
        }

        // After all chunks are processed, re-number the IDs sequentially from 1.
        // This is necessary because each `parseProtocol` call starts its own ID sequence.
        const renumberedEntries = allEntries.map((entry, index) => ({
            ...entry,
            id: index + 1,
        }));

        const processedData = processProtocolEntries(renumberedEntries);

        if (processedData.length === 0 && renumberedEntries.length > 0) {
            setError("The AI could not identify any structured entries after processing all chunks.");
        } else if (processedData.length === 0 && inputText.trim()) {
             setError("No data could be extracted. The document might be empty or in an unsupported format.");
        }
        
        setPairedData(processedData);

    } catch (err: any) {
        console.error('Parsing failed during chunk processing:', err);
        setError(`Failed to parse the document: ${err.message || 'An unknown error occurred.'} Please check the console for details.`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [inputText, isLoading]);
  
  const handleClear = () => {
    setInputText('');
    setPairedData([]);
    setError(null);
    setAnalysisError(null);
    setFileName('');
    setLoadingMessage('');
    setStatusMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    try {
        localStorage.removeItem('inputText');
        localStorage.removeItem('pairedData');
        localStorage.removeItem('fileName');
    } catch (err) {
        console.error("Failed to clear localStorage:", err);
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleClear();

    if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setIsLoading(true);
    setLoadingMessage('Reading PDF file...');
    setFileName(file.name);

    try {
        const { pdfjsLib } = window;
        if (!pdfjsLib) throw new Error('PDF.js library is not loaded.');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;

        if (typeof Tesseract === 'undefined') throw new Error('Tesseract.js OCR library is not loaded.');

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);
        let pdf;

        setLoadingMessage('Loading PDF document structure...');
        try {
            pdf = await pdfjsLib.getDocument(typedArray).promise;
        } catch (err: any) {
            if (err.name !== 'PasswordException') throw err;
            const password = window.prompt('PDF is password-protected. Please enter password:');
            if (password === null) throw new Error('PDF processing cancelled.');
            pdf = await pdfjsLib.getDocument({ data: typedArray, password }).promise;
        }

        const numPages = pdf.numPages;
        let fullText = '';
        const worker = await Tesseract.createWorker('deu', 1, {
            logger: (m: any) => {
              if (typeof m !== 'object' || !m.status) return;
              let message = '';
              const progress = m.progress ? ` (${Math.round(m.progress * 100)}%)` : '';
              
              switch (m.status) {
                case 'initializing':
                case 'initializing_api':
                case 'initializing_tesseract':
                  message = `Initializing OCR engine...`;
                  break;
                case 'loading_language_traineddata':
                  message = `Loading language model${progress}...`;
                  break;
                case 'recognizing text':
                  message = `Performing OCR on page ${ocrPageRef.current}/${numPages}${progress}...`;
                  break;
                default:
                  return;
              }
              setLoadingMessage(message);
            },
        });

        for (let i = 1; i <= numPages; i++) {
            ocrPageRef.current = i;
            setLoadingMessage(`Rendering page ${i}/${numPages} for OCR...`);

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not get canvas context');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const { data: { text } } = await worker.recognize(canvas);
            fullText += `==Start of OCR for page ${i}==\n${text}\n==End of OCR for page ${i}==\n\n`;
            canvas.width = 0;
            canvas.height = 0;
        }

        await worker.terminate();
        setInputText(fullText);

    } catch (err: any) {
        console.error('PDF processing failed:', err);
        setError(`Failed to process PDF: ${err.message || 'An unknown error occurred.'}`);
        handleClear();
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
        ocrPageRef.current = 0;
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (event.target) event.target.value = '';

    if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        return;
    }

    handleClear();
    setIsLoading(true);
    setLoadingMessage(`Validating CSV file: ${file.name}...`);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = (e.target?.result as string)?.replace(/^\uFEFF/, '');
            if (!text) throw new Error("File is empty or could not be read.");

            const parseCsvRow = (rowString: string): string[] => {
                const columns: string[] = [];
                let currentColumn = '';
                let inQuotes = false;
                for (let i = 0; i < rowString.length; i++) {
                    const char = rowString[i];
                    if (char === '"') {
                        if (inQuotes && i + 1 < rowString.length && rowString[i + 1] === '"') {
                            currentColumn += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        columns.push(currentColumn);
                        currentColumn = '';
                    } else {
                        currentColumn += char;
                    }
                }
                columns.push(currentColumn);
                return columns.map(col => {
                    if (col.startsWith('"') && col.endsWith('"')) {
                        return col.slice(1, -1).replace(/""/g, '"');
                    }
                    return col;
                });
            };

            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                throw new Error("CSV file must contain a header row and at least one data row.");
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const requiredHeaders = ['#', 'Fundstelle', 'Fragesteller', 'Frage', 'Zeuge', 'Antwort', 'Anmerkung'];
            const validationErrors: string[] = [];

            // 1. Header Validation
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                validationErrors.push(`Missing required header(s): ${missingHeaders.join(', ')}.`);
            }
            const duplicateHeaders = headers.filter((h, i) => headers.indexOf(h) !== i);
            if (duplicateHeaders.length > 0) {
                validationErrors.push(`Duplicate header(s) found: ${[...new Set(duplicateHeaders)].join(', ')}.`);
            }

            // 2. Row Validation
            const seenIds = new Set<number>();
            for (let i = 1; i < lines.length; i++) {
                const lineNumber = i + 1;
                const values = parseCsvRow(lines[i]);

                if (values.length !== headers.length) {
                    validationErrors.push(`On line ${lineNumber}: Incorrect number of columns. Expected ${headers.length}, but found ${values.length}.`);
                    continue; // Skip further checks for this malformed row
                }

                const idStr = values[headers.indexOf('#')];
                const id = parseInt(idStr, 10);

                if (isNaN(id) || id <= 0) {
                    validationErrors.push(`On line ${lineNumber}: Invalid or missing ID. Must be a positive number.`);
                } else if (seenIds.has(id)) {
                    validationErrors.push(`On line ${lineNumber}: Duplicate ID '${id}' found.`);
                } else {
                    seenIds.add(id);
                }
            }
            
            if (validationErrors.length > 0) {
                throw new Error(`CSV Validation Failed:\n- ${validationErrors.join('\n- ')}`);
            }

            // 3. Parsing (if validation passes)
            setLoadingMessage('Parsing valid CSV file...');
            const parsedEntries: PairedProtocolEntry[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseCsvRow(lines[i]);
                const entry: PairedProtocolEntry = {
                    id: parseInt(values[headers.indexOf('#')], 10),
                    sourceReference: values[headers.indexOf('Fundstelle')] || '',
                    questioner: values[headers.indexOf('Fragesteller')] || null,
                    question: values[headers.indexOf('Frage')] || null,
                    witness: values[headers.indexOf('Zeuge')] || null,
                    answer: values[headers.indexOf('Antwort')] || null,
                    note: values[headers.indexOf('Anmerkung')] || null,
                };
                parsedEntries.push(entry);
            }

            setPairedData(parsedEntries);
            setError(null);

        } catch (err: any) {
            console.error("CSV processing failed:", err);
            setError(`Failed to process CSV: ${err.message || 'An unknown error occurred.'}`);
            handleClear();
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    reader.onerror = () => {
        setError('Error reading the file.');
        setIsLoading(false);
        setLoadingMessage('');
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleAnalyze = useCallback(async () => {
    if (pairedData.length === 0 || isAnalyzing || isLoading) return;
    
    analysisOccurredError.current = false;
    isStoppingAnalysisRef.current = false;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setLoadingMessage('');
    setStatusMessage('');
    
    // Clear previous analysis results
    setPairedData(currentData => currentData.map(({ kernaussage, zugeordneteKategorien, begruendung, ...rest }) => rest));

    const dataToAnalyze = pairedData.filter(entry => entry.note === null);

    if (dataToAnalyze.length === 0) {
        setIsAnalyzing(false);
        setStatusMessage('No question/answer pairs to analyze.');
        setTimeout(() => setStatusMessage(''), 4000);
        return;
    }

    const ANALYSIS_CHUNK_SIZE = 8;
    const chunks: PairedProtocolEntry[][] = [];
    for (let i = 0; i < dataToAnalyze.length; i += ANALYSIS_CHUNK_SIZE) {
      chunks.push(dataToAnalyze.slice(i, i + ANALYSIS_CHUNK_SIZE));
    }
    const totalChunks = chunks.length;
    let currentChunkIndex = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
        currentChunkIndex = i;
        if (isStoppingAnalysisRef.current) {
          break;
        }

        const chunk = chunks[i];
        setLoadingMessage(`Analyzing chunk ${i + 1} of ${totalChunks}...`);

        const chunkResult = await analyzeTimeline(chunk);

        setPairedData(currentPairedData => {
            const analysisMap = new Map(chunkResult.map(item => [item.id, item]));
            return currentPairedData.map(entry => {
                const analysisData = analysisMap.get(entry.id);
                if (analysisData) {
                    return { ...entry, ...analysisData };
                }
                return entry;
            });
        });
      }

    } catch (err: any) {
      analysisOccurredError.current = true;
      const chunkNumber = currentChunkIndex + 1;
      const errorMessage = `An error occurred while analyzing chunk ${chunkNumber} of ${totalChunks}. The results shown are partial. \n\nDetails: ${err.message || 'An unknown error occurred.'}`;
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setLoadingMessage('');
      
      let finalMessage = '';
      if (isStoppingAnalysisRef.current) {
        finalMessage = 'Analysis stopped by user.';
      } else if (!analysisOccurredError.current) {
        finalMessage = 'Analysis complete.';
      }
      setStatusMessage(finalMessage);
      
      isStoppingAnalysisRef.current = false;
      setTimeout(() => setStatusMessage(''), 4000);
    }
  }, [pairedData, isAnalyzing, isLoading]);
  
  const handleStopAnalysis = () => {
    isStoppingAnalysisRef.current = true;
  };

  const handleCopyText = () => {
    if (!inputText || !navigator.clipboard) return;
    navigator.clipboard.writeText(inputText).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Text'), 2000);
    }).catch(err => {
      setError("Could not copy text to clipboard.");
    });
  };
  
  const handleExportCSV = useCallback(() => {
    if (pairedData.length === 0) {
      alert("There is no data to export.");
      return;
    }

    const formatCsvCell = (cellData: string | null | undefined): string => {
      if (cellData === null || cellData === undefined) return '';
      const cellString = String(cellData);
      if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
        const escapedString = cellString.replace(/"/g, '""');
        return `"${escapedString}"`;
      }
      return cellString;
    };

    const hasAnalysisData = pairedData.some(entry => entry.kernaussage || entry.zugeordneteKategorien || entry.begruendung);

    const headers = ['#', 'Fundstelle', 'Fragesteller', 'Frage', 'Zeuge', 'Antwort', 'Anmerkung'];
    if (hasAnalysisData) {
      headers.push('Kernaussage', 'Zugeordnete Kategorie(n)', 'Begründung');
    }

    const csvRows = [headers.join(',')];
    let qaPairCounter = 0;
    
    pairedData.forEach(entry => {
      let rowData: (string | null | undefined)[] = [];

      if (entry.note) {
          rowData = [
              '', // No number for notes
              entry.sourceReference,
              '', '', '', '', // Empty Q/A fields
              entry.note,
          ];
          if (hasAnalysisData) {
              rowData.push('', '', '');
          }
      } else {
          qaPairCounter++;
          rowData = [
              String(qaPairCounter),
              entry.sourceReference,
              entry.questioner,
              entry.question,
              entry.witness,
              entry.answer,
              '', // Empty note field
          ];
          if (hasAnalysisData) {
              rowData.push(entry.kernaussage || '', entry.zugeordneteKategorien || '', entry.begruendung || '');
          }
      }
      csvRows.push(rowData.map(formatCsvCell).join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const exportFileName = fileName ? `${fileName.replace(/\.[^/.]+$/, "")}_export.csv` : 'protocol_export.csv';
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pairedData, fileName]);

  return (
    <div className="min-h-screen text-[var(--color-on-background)] bg-[var(--color-background)]">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="container mx-auto px-4 lg:px-8 py-8 pt-28">
        <PageTitle />
        <div className="flex flex-col gap-16 items-start">
          <section id="input" className="w-full scroll-mt-24">
            <InputPanel
              inputText={inputText}
              setInputText={setInputText}
              fileName={fileName}
              setFileName={setFileName}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              error={error}
              fileInputRef={fileInputRef}
              copyButtonText={copyButtonText}
              onFileChange={handleFileChange}
              onParse={handleParse}
              onCopyText={handleCopyText}
              onClear={handleClear}
              isMinimized={isInputMinimized}
              onToggleMinimize={() => setIsInputMinimized(prev => !prev)}
            />
          </section>
          <section id="output" className="w-full scroll-mt-24">
            <TimelinePanel
              pairedData={pairedData}
              isLoading={isLoading}
              isAnalyzing={isAnalyzing}
              loadingMessage={loadingMessage}
              statusMessage={statusMessage}
              analysisError={analysisError}
              onUploadCSV={handleCsvUpload}
              csvFileInputRef={csvFileInputRef}
              onAnalyze={handleAnalyze}
              onStopAnalysis={handleStopAnalysis}
              onExportCSV={handleExportCSV}
              isMinimized={isOutputMinimized}
              onToggleMinimize={() => setIsOutputMinimized(prev => !prev)}
            />
          </section>
        </div>
      </main>
      <footer className="text-center py-6 text-[var(--color-on-surface-variant)] text-sm">
        <p>Powered by Google Gemini & React</p>
      </footer>
    </div>
  );
};

export default App;