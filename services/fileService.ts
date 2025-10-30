import * as XLSX from 'xlsx';
import type { ParsedEntry } from '../types';
import type { MutableRefObject } from 'react';
import { promisePool } from '../utils/promisePool';

// Let TypeScript know about the globally available libraries from the HTML script tags
declare const pdfjsLib: any;
declare namespace Tesseract {
  interface Worker {
    recognize(image: any): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  }
  function createWorker(lang: string): Promise<Worker>;
  
  interface Scheduler {
    addWorker(worker: Worker): Promise<string>;
    addJob(action: 'recognize', image: any): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  }
  function createScheduler(): Scheduler;
}
declare const Papa: any;


/**
 * Converts the image data on the canvas to grayscale.
 * Tesseract doesn't need color; it just gets in the way.
 */
const applyGrayscale = (context: CanvasRenderingContext2D): void => {
  const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Simple (but fast) averaging
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // red
    data[i + 1] = avg; // green
    data[i + 2] = avg; // blue
  }
  context.putImageData(imageData, 0, 0);
};

/**
 * Applies a binary threshold. Makes the image pure black and white.
 * Assumes it is already in grayscale.
 * @param threshold - A value from 0-255. Anything below becomes black (0),
 * anything above becomes white (255). Experiment with this.
 */
const applyThreshold = (context: CanvasRenderingContext2D, threshold: number = 170): void => {
  const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Since grayscale, one channel is enough
    const v = data[i]; 
    const newValue = v < threshold ? 0 : 255;
    data[i] = newValue;
    data[i + 1] = newValue;
    data[i + 2] = newValue;
  }
  context.putImageData(imageData, 0, 0);
};


/**
 * Extracts raw text from a PDF file using a hybrid approach.
 * First, it attempts to extract the text layer directly for speed. If a page
 * has no usable text layer, it falls back to OCR (Tesseract.js).
 * The output is a single string containing all the text from the document,
 * with page markers inserted to provide context for the parser.
 * @param file The PDF file to process.
 * @param setLoadingMessage A callback to update the UI with progress messages.
 * @param stopSignal A ref object; if its `current` property becomes true, the process stops.
 * @returns A promise that resolves to the full extracted text as a single string.
 */
export async function extractTextFromPdf(file: File, setLoadingMessage: (msg: string) => void, stopSignal: MutableRefObject<boolean>): Promise<string> {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;

    const reader = new FileReader();
    const readingPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read the PDF file.'));
        reader.readAsArrayBuffer(file);
    });

    const arrayBuffer = await readingPromise;
    let scheduler: Tesseract.Scheduler | null = null;

    try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        setLoadingMessage('Initializing OCR engine for fallback...');
        const numWorkers = navigator.hardwareConcurrency || 2;
        scheduler = Tesseract.createScheduler();
        const workerPromises = Array.from({ length: numWorkers }, () => 
            Tesseract.createWorker('deu').then(worker => scheduler!.addWorker(worker))
        );
        await Promise.all(workerPromises);
        setLoadingMessage(`Initialized OCR engine. Processing ${numPages} pages...`);

        const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);
        const CONCURRENCY_LIMIT = Math.max(2, numWorkers);

        const processPageTask = async (pageNum: number) => {
            if (stopSignal.current) return null;

            const page = await pdf.getPage(pageNum);
            
            // --- FAST PATH: Attempt direct text extraction ---
            const textContent = await page.getTextContent();
            const directText = textContent.items.map((item: any) => item.str).join(' ');

            // If we get a decent amount of text, use it and skip OCR.
            if (directText.trim().length > 20) { // Threshold for "meaningful" text
                return { pageNum, text: directText };
            }

            // --- SLOW PATH (FALLBACK): OCR ---
            const scale = 2.0;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error(`Could not get 2D context for page ${pageNum}`);
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvas, canvasContext: context, viewport }).promise;

            applyGrayscale(context);
            applyThreshold(context, 170);

            const { data: { text: ocrText } } = await scheduler!.addJob('recognize', canvas);
            
            return { pageNum, text: ocrText };
        };
        
        const handleProgress = ({ completed, total }: { completed: number; total: number }) => {
            if (stopSignal.current) return;
            setLoadingMessage(`Processing PDF... ${completed}/${total} pages complete.`);
        };

        const pageResults = await promisePool(
            pageNumbers,
            processPageTask,
            CONCURRENCY_LIMIT,
            handleProgress
        );
        
        if (stopSignal.current) {
            setLoadingMessage('PDF processing aborted by user.');
            return '';
        }

        const sortedResults = pageResults
            .filter((r): r is { pageNum: number, text: string } => r !== null)
            .sort((a, b) => a.pageNum - b.pageNum);
            
        return sortedResults
            .map(r => `==Start of OCR for page ${r.pageNum}==\n${r.text}\n==End of OCR for page ${r.pageNum}==\n\n`)
            .join('');

    } catch (error) {
        console.error("Error during PDF processing:", error);
        throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
        if (scheduler) {
            await scheduler.terminate();
        }
    }
}

const REQUIRED_HEADERS = ['#', 'Fragesteller', 'Frage', 'Zeuge', 'Antwort'];
const HEADER_ALIASES: { [key: string]: string[] } = {
  id: ['#', 'id'],
  sourceReference: ['Fundstelle', 'sourceReference'],
  questioner: ['Fragesteller', 'questioner'],
  question: ['Frage', 'question'],
  witness: ['Zeuge', 'witness'],
  answer: ['Antwort', 'answer'],
  note: ['Anmerkung', 'note'],
  kernaussage: ['Kernaussage', 'kernaussage'],
  zugeordneteKategorien: ['Zugeordnete Kategorie(n)', 'zugeordneteKategorien'],
  begruendung: ['Begründung', 'begruendung'],
};

/**
 * Validates headers and maps raw data objects to the ParsedEntry type.
 * @param data An array of objects from the parser.
 * @returns An array of ParsedEntry and a list of warnings.
 */
function validateAndMapData(data: { [key: string]: any }[]): { data: ParsedEntry[], warnings: string[] } {
    if (data.length === 0) return { data: [], warnings: [] };
    
    const headers = Object.keys(data[0] || {});
    const trimmedHeaders = headers.map(h => h.trim().toLowerCase());
    const warnings: string[] = [];

    const missingHeaders = REQUIRED_HEADERS.filter(
      (requiredHeader) => !trimmedHeaders.includes(requiredHeader.toLowerCase())
    );

    if (missingHeaders.length > 0) {
        warnings.push(`The following required columns were not found and will be left blank: ${missingHeaders.join(', ')}.`);
    }

    let idCounter = 0;
    const mappedData = data.map(row => {
        idCounter++;
        
        const trimmedRow: {[key:string]: any} = {};
        for(const key in row) {
            trimmedRow[key.trim().toLowerCase()] = row[key];
        }

        const findValue = (aliases: string[]) => {
            for (const alias of aliases) {
                const value = trimmedRow[alias.toLowerCase()];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return String(value);
                }
            }
            return null;
        };

        const noteValue = findValue(HEADER_ALIASES.note);
        if (noteValue) {
             return {
                id: idCounter,
                sourceReference: findValue(HEADER_ALIASES.sourceReference) || '',
                questioner: null,
                question: null,
                witness: null,
                answer: null,
                note: noteValue
            };
        }

        return {
            id: parseInt(findValue(HEADER_ALIASES.id) || `${idCounter}`, 10),
            sourceReference: findValue(HEADER_ALIASES.sourceReference) || '',
            questioner: findValue(HEADER_ALIASES.questioner),
            question: findValue(HEADER_ALIASES.question),
            witness: findValue(HEADER_ALIASES.witness),
            answer: findValue(HEADER_ALIASES.answer),
            note: null,
            kernaussage: findValue(HEADER_ALIASES.kernaussage) || undefined,
            zugeordneteKategorien: findValue(HEADER_ALIASES.zugeordneteKategorien) || undefined,
            begruendung: findValue(HEADER_ALIASES.begruendung) || undefined,
        };
    });
    
    return { data: mappedData, warnings };
}


/**
 * Processes a CSV file using PapaParse for robustness.
 * @param file The CSV file.
 * @returns A promise resolving to an object with data and warnings.
 */
export async function processCsvFile(file: File): Promise<{ data: ParsedEntry[], warnings: string[] }> {
    return new Promise((resolve, reject) => {
        
        // PapaParse is now globally available
        Papa.parse(file, {
            header: true, // Use the first row as headers
            skipEmptyLines: true, // Ignore empty lines
            delimitersToGuess: [',', ';', '\t'], // Help auto-detection by providing common delimiters.
            
            complete: (results: any) => {
                // Errors during parsing?
                if (results.errors && results.errors.length > 0) {
                    console.error("PapaParse Errors:", results.errors);
                    // Take the first error to display to the user
                    return reject(new Error(`CSV parsing failed: ${results.errors[0].message}`));
                }
                
                const parsedData = results.data as { [key: string]: string }[];
                
                if (parsedData.length === 0) {
                   return reject(new Error("The CSV file is empty or could not be parsed. Check formatting."));
                }
                
                try {
                    // The validation and mapping function remains the same
                    const validationResult = validateAndMapData(parsedData);
                    resolve(validationResult);
                } catch (validationError: any) {
                    // Error while mapping the data
                    reject(validationError);
                }
            },
            error: (error: any) => {
                // Error reading the file
                reject(new Error(`Failed to read the CSV file: ${error.message}`));
            }
        });
    });
}

/**
 * Escapes a single field for CSV output.
 * @param field The value to escape.
 * @returns The CSV-safe string.
 */
function escapeCsvField(field: any): string {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        const escapedField = stringField.replace(/"/g, '""');
        return `"${escapedField}"`;
    }
    return stringField;
}

/**
 * Exports the timeline data to a CSV file and triggers a download.
 * @param data The data to export.
 * @param fileName The name for the downloaded file.
 */
export function exportToCsv(data: ParsedEntry[], fileName: string): void {
    const hasAnalysis = data.some(d => d.kernaussage || d.zugeordneteKategorien || d.begruendung);
    
    const headers = [
      '#', 'Fundstelle', 'Fragesteller', 'Frage', 'Zeuge', 'Antwort', 'Anmerkung'
    ];
    if (hasAnalysis) {
      headers.push('Kernaussage', 'Zugeordnete Kategorie(n)', 'Begründung');
    }
    
    let qaCounter = 0;
    const rows = data.map(entry => {
        if (entry.note) {
            const noteRow = Array(headers.length).fill('');
            noteRow[6] = entry.note; // Set 'Anmerkung'
            return noteRow;
        }

        qaCounter++;
        const row = [
            qaCounter, entry.sourceReference, entry.questioner, entry.question,
            entry.witness, entry.answer, '' // Empty 'Anmerkung'
        ];
        if (hasAnalysis) {
            row.push(entry.kernaussage || '', entry.zugeordneteKategorien || '', entry.begruendung || '');
        }
        return row;
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Exports the timeline data to a formatted XLSX file and triggers a download.
 * @param data The data to export.
 * @param fileName The name for the downloaded file.
 */
export function exportToXlsx(data: ParsedEntry[], fileName: string): void {
    const hasAnalysis = data.some(d => d.kernaussage || d.zugeordneteKategorien || d.begruendung);

    const headers = [
      '#', 'Fundstelle', 'Fragesteller', 'Frage', 'Zeuge', 'Antwort', 'Anmerkung'
    ];
    if (hasAnalysis) {
      headers.push('Kernaussage', 'Zugeordnete Kategorie(n)', 'Begründung');
    }

    const worksheetData: (string | number | null)[][] = [headers];

    let qaCounter = 0;
    data.forEach(entry => {
        if (entry.note) {
            const noteRow = Array(headers.length).fill(null);
            noteRow[0] = entry.note; // Put note in the first column for merging
            worksheetData.push(noteRow);
        } else {
            qaCounter++;
            const row = [
                qaCounter, entry.sourceReference, entry.questioner, entry.question,
                entry.witness, entry.answer, null
            ];
            if (hasAnalysis) {
                row.push(entry.kernaussage || null, entry.zugeordneteKategorien || null, entry.begruendung || null);
            }
            worksheetData.push(row);
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // --- STYLING ---
    ws['!merges'] = [];
    const font = { name: 'Roboto Serif', sz: 11 };
    const headerStyle = { font: { ...font, bold: true, color: { rgb: "534342"} }, fill: { fgColor: { rgb: "F5DDDB" } }, alignment: { vertical: 'top', wrapText: true } };
    const noteStyle = { font: { ...font, italic: true }, alignment: { horizontal: 'center', vertical: 'center' } };
    const evenRowFill = { fgColor: { rgb: "F5DDDB" } };
    const oddRowFill = { fgColor: { rgb: "FFFBFA" } };

    let currentQaCounter = 0;
    worksheetData.forEach((row, r) => {
        // Skip header row for data-specific styling
        if (r === 0) return;

        const entry = data[r - 1]; // data is offset by 1 due to header
        
        if (entry.note) {
            ws['!merges']!.push({ s: { r, c: 0 }, e: { r, c: headers.length - 1 } });
            const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
            if (ws[cellAddress]) ws[cellAddress].s = noteStyle;
        } else {
            currentQaCounter++;
            const isEven = currentQaCounter % 2 === 0;
            const fill = isEven ? evenRowFill : oddRowFill;
            
            row.forEach((_cell, c) => {
                const cellAddress = XLSX.utils.encode_cell({ r, c });
                if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' }; // Ensure cell exists
                
                const isBoldColumn = (headers[c] === 'Fragesteller' || headers[c] === 'Zeuge');
                
                ws[cellAddress].s = {
                    font: { ...font, bold: isBoldColumn },
                    fill: fill,
                    alignment: { vertical: 'top', wrapText: true }
                };
            });
        }
    });

    // Style Header Row
    headers.forEach((_header, c) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellAddress]) ws[cellAddress].s = headerStyle;
    });

    // Set Column Widths
    const colWidths = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 60 }, { wch: 25 }, { wch: 60 }, { wch: 20 }
    ];
    if(hasAnalysis) {
        colWidths.push({ wch: 60 }, { wch: 30 }, { wch: 60 });
    }
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Protocol Timeline');
    XLSX.writeFile(wb, fileName);
}

/**
 * Triggers a browser download for any text-based content.
 * @param content The string content to download.
 * @param fileName The desired name of the file.
 * @param mimeType The MIME type of the content (e.g., 'application/json').
 */
export function exportTextFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
