import React, { useState, useRef } from 'react';
import { ModuleWrapper } from './ModuleWrapper';
import { IOField } from './IOField';
import { extractTextFromPdf } from '../../services/fileService';
import { getRandomQuote } from '../../utils/quotes';

interface OcrModuleProps {
    setLoading: (loading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setStatusMessage: (message: string) => void;
    setError: (error: string | null) => void;
}

export const OcrModule: React.FC<OcrModuleProps> = ({
    setLoading,
    setLoadingMessage,
    setStatusMessage,
    setError
}) => {
    const [outputText, setOutputText] = useState('');
    const [fileName, setFileName] = useState('');
    const [placeholder] = useState(getRandomQuote());
    const [isLoading, setIsLoading] = useState(false); // Local state for button disable

    const fileInputRef = useRef<HTMLInputElement>(null);
    const stopSignal = useRef(false);

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setOutputText('');
        setError(null);
        setFileName(file.name);
        setIsLoading(true);
        setLoading(true); // Global loading
        stopSignal.current = false;

        try {
            const extractedText = await extractTextFromPdf(file, setLoadingMessage, stopSignal);
            if (stopSignal.current) {
                setStatusMessage('Operation aborted by user.');
            } else {
                setOutputText(extractedText);
                setStatusMessage(`Extracted text from ${file.name}.`);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
            setLoading(false); // Global loading
            setLoadingMessage('');
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleAbort = () => {
        stopSignal.current = true;
    }

    return (
        <ModuleWrapper
            title="OCR"
            description="Upload a PDF file to extract its raw text content using Optical Character Recognition (OCR). The output is the full text, ready to be parsed."
        >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="application/pdf" />
                <md-filled-tonal-icon-button onClick={triggerFileUpload} disabled={isLoading} title="Upload PDF">
                    <span className="material-symbols-outlined">upload_file</span>
                </md-filled-tonal-icon-button>

                {isLoading && (
                    <md-outlined-button onClick={handleAbort}>
                         <span className="material-symbols-outlined" slot="icon">cancel</span>
                        Abort
                    </md-outlined-button>
                )}
                <div style={{flexGrow: 1}}/>
                {fileName && <span className="md-typescale-body-medium">File: <strong>{fileName}</strong></span>}
            </div>

            <IOField
                label="Output"
                value={outputText}
                onValueChange={setOutputText}
                placeholder={placeholder}
                rows={15}
                showCopy
                isOutput
                showClear
                onClear={() => setOutputText('')}
            />
        </ModuleWrapper>
    );
};