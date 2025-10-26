import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { parseProtocol } from './services/geminiService';
import type { ProtocolEntry, PairedProtocolEntry } from './types';

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
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [copyButtonText, setCopyButtonText] = useState<string>('Copy Text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrPageRef = useRef(0);

  useEffect(() => {
    try {
      const savedInputText = localStorage.getItem('inputText');
      const savedPairedData = localStorage.getItem('pairedData');
      const savedFileName = localStorage.getItem('fileName');

      if (savedInputText) setInputText(savedInputText);
      if (savedFileName) setFileName(savedFileName);
      if (savedPairedData) setPairedData(JSON.parse(savedPairedData));
    } catch (err) {
      console.error("Failed to load state from localStorage:", err);
      localStorage.removeItem('pairedData');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('inputText', inputText);
      localStorage.setItem('pairedData', JSON.stringify(pairedData));
      localStorage.setItem('fileName', fileName);
    } catch (err) {
      console.error("Failed to save state to localStorage:", err);
    }
  }, [inputText, pairedData, fileName]);
  
  const handleParse = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setPairedData([]);

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
    setFileName('');
    setLoadingMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleCopyText = () => {
    if (!inputText || !navigator.clipboard) return;
    navigator.clipboard.writeText(inputText).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Text'), 2000);
    }).catch(err => {
      setError("Could not copy text to clipboard.");
    });
  };

  const handleExportXLSX = () => {
    const dataForExport = pairedData.map(entry => ({
      '#': entry.id,
      'Fundstelle': entry.sourceReference,
      'Fragesteller': entry.questioner || '',
      'Frage': entry.question || '',
      'Zeuge': entry.witness || '',
      'Antwort': entry.answer || '',
      'Anmerkung': entry.note || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timeline");

    worksheet['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 50 },
      { wch: 25 }, { wch: 50 }, { wch: 50 },
    ];
    
    const exportFileName = (fileName ? fileName.replace(/\.pdf$/i, '') : 'protocol') + '_export.xlsx';
    XLSX.writeFile(workbook, exportFileName);
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Fundstelle', 'Fragesteller', 'Frage', 'Zeuge', 'Antwort', 'Anmerkung'];
    
    const escapeCsvCell = (cellData: string | number | null) => {
      if (cellData === null || cellData === undefined) return '';
      const stringData = String(cellData);
      if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
        const escapedData = stringData.replace(/"/g, '""');
        return `"${escapedData}"`;
      }
      return stringData;
    };

    const csvRows = [
      headers.join(','),
      ...pairedData.map(entry => [
        entry.id, entry.sourceReference, entry.questioner,
        entry.question, entry.witness, entry.answer, entry.note
      ].map(escapeCsvCell).join(','))
    ];

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const exportFileName = (fileName ? fileName.replace(/\.pdf$/i, '') : 'protocol') + '_export.csv';
    link.setAttribute('href', url);
    link.setAttribute('download', exportFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen text-black bg-white">
      <Header />
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col gap-16 items-start">
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
          />
          <TimelinePanel
            pairedData={pairedData}
            isLoading={isLoading}
            onExportXLSX={handleExportXLSX}
            onExportCSV={handleExportCSV}
          />
        </div>
      </main>
      <footer className="text-center py-6 text-black/70 text-sm">
        <p>Powered by Google Gemini & React</p>
      </footer>
    </div>
  );
};

export default App;