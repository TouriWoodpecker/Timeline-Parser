import React from 'react';
import { TextInput } from './TextInput';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface InputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  copyButtonText: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onParse: () => void;
  onCopyText: () => void;
  onClear: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputText,
  setInputText,
  fileName,
  setFileName,
  isLoading,
  loadingMessage,
  error,
  fileInputRef,
  copyButtonText,
  onFileChange,
  onParse,
  onCopyText,
  onClear,
}) => {
  const handleClearClick = () => {
    const isConfirmed = window.confirm('Are you sure you want to clear all input and parsed data? This action cannot be undone.');
    if (isConfirmed) {
      onClear();
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-7xl font-bold mb-6 text-black">Input</h2>
      
      <TextInput
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        isLoading={isLoading}
      />

      {error && <ErrorMessage message={error} />}

      {isLoading && loadingMessage && <LoadingSpinner message={loadingMessage} />}
      
      <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
            <label htmlFor="file-upload" className="cursor-pointer font-medium text-black hover:underline disabled:opacity-50">
              Upload PDF
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} ref={fileInputRef} accept=".pdf" disabled={isLoading} />
            </label>
            {fileName && <p className="text-sm text-black/60">File: {fileName}</p>}
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <button 
                onClick={onCopyText}
                className="font-medium text-black hover:underline disabled:opacity-50"
                disabled={!inputText || isLoading}
                >
                {copyButtonText}
            </button>
            <button 
                onClick={handleClearClick} 
                disabled={isLoading}
                className="font-medium text-black hover:underline disabled:opacity-50"
            >
                Clear All
            </button>
            <button
                onClick={onParse}
                disabled={!inputText.trim() || isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-black/40 disabled:cursor-not-allowed"
            >
                Parse Protocol
            </button>
        </div>
      </div>
    </div>
  );
};