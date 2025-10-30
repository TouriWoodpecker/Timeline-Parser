import React, { useState, useRef, useCallback } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { IOField } from './IOField';
import { extractTextFromPdf, exportTextFile } from '../../services/fileService';

interface OcrModuleProps {
    rawText: string;
    setRawText: (text: string) => void;
    setLoading: (loading: boolean, message?: string) => void;
    onOcrComplete: (text: string) => void;
}

export const OcrModule: React.FC<OcrModuleProps> = ({ rawText, setRawText, setLoading, onOcrComplete }) => {
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stopSignal = useRef(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setError('');
            setRawText('');
            stopSignal.current = false;
            
            try {
                setLoading(true, 'Extracting text from PDF...');
                const text = await extractTextFromPdf(file, (msg) => setLoading(true, msg), stopSignal);
                
                if (!stopSignal.current) {
                    setRawText(text);
                    onOcrComplete(text);
                }

            } catch (err: any) {
                setError(`Failed to process PDF: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const handleClear = useCallback(() => {
        setRawText('');
        setFileName('');
        setError('');
    }, [setRawText]);
    
    const handleExport = () => {
        if (rawText) {
            exportTextFile(rawText, 'extracted-text.txt', 'text/plain');
        }
    };

    return (
        <ModuleWrapper
            title="OCR (Optical Character Recognition)"
            description="Upload a PDF document to extract its text content using a combination of direct text extraction and OCR for images or scanned pages."
        >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <md-filled-button onClick={() => fileInputRef.current?.click()}>
                    <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>upload_file</span>
                    Upload PDF
                </md-filled-button>
                {fileName && <span className="md-typescale-body-large">Selected: {fileName}</span>}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                style={{ display: 'none' }}
            />
            {error && <div style={{ color: 'var(--md-sys-color-error)' }}>{error}</div>}
            
            <IOField
                label="Extracted Text"
                value={rawText}
                onValueChange={setRawText}
                placeholder="The text from your PDF will appear here..."
                isOutput
                showCopy
                showClear
                onClear={handleClear}
                customActions={
                    <md-icon-button onClick={handleExport} title="Export as TXT" disabled={!rawText}>
                        <span className="material-symbols-outlined">download</span>
                    </md-icon-button>
                }
            />
        </ModuleWrapper>
    );
};
