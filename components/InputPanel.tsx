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
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputText,
  setInputText,
  fileName,
  isLoading,
  loadingMessage,
  error,
  fileInputRef,
  copyButtonText,
  onFileChange,
  onParse,
  onCopyText,
  onClear,
  isMinimized,
  onToggleMinimize,
}) => {
  const handleClearClick = () => {
    const isConfirmed = window.confirm('Are you sure you want to clear all input and parsed data? This action cannot be undone.');
    if (isConfirmed) {
      onClear();
    }
  };

  const textButtonClasses = "px-4 h-10 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-full)] transition-colors duration-200";
  const filledButtonClasses = "px-6 h-12 text-sm font-semibold text-[var(--color-on-primary)] bg-[var(--color-primary)] rounded-[var(--radius-full)] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:bg-[var(--color-outline)] disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:shadow-md";

  return (
    <div className="w-full bg-[var(--color-surface)] rounded-[var(--radius-l)] shadow-lg shadow-black/5 dark:shadow-black/20 border border-[var(--color-outline)]/20">
      <div className="flex justify-between items-center p-6 flex-wrap gap-x-8 gap-y-4">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">Input</h2>
            <button
                onClick={onToggleMinimize}
                className="p-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors"
                aria-label={isMinimized ? 'Expand Input section' : 'Collapse Input section'}
                aria-expanded={!isMinimized}
            >
                <svg className={`w-6 h-6 text-[var(--color-on-surface-variant)] transition-transform duration-300 ${isMinimized ? '' : 'rotate-180'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
        </div>
        {!isMinimized && (
          <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="file-upload" className={`${textButtonClasses} inline-flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                Upload PDF
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} ref={fileInputRef} accept=".pdf" disabled={isLoading} />
              </label>
               {fileName && <p className="text-sm text-[var(--color-on-surface-variant)] hidden sm:block">File: {fileName}</p>}
               <span className="text-[var(--color-outline)]/30 hidden sm:inline mx-2">|</span>
              <button
                  onClick={onParse}
                  disabled={!inputText.trim() || isLoading}
                  className={filledButtonClasses}
              >
                  Parse Protocol
              </button>
          </div>
        )}
      </div>
      
      <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isMinimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
        <div className="overflow-hidden">
          <div className="p-6 pt-6 border-t border-[var(--color-outline)]/20">
              <TextInput
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  isLoading={isLoading}
              />

              {error && <ErrorMessage message={error} />}

              {isLoading && loadingMessage && <LoadingSpinner message={loadingMessage} />}
              
              <div className="mt-6 flex justify-end flex-wrap gap-2">
                  <button 
                      onClick={onCopyText}
                      className={textButtonClasses}
                      disabled={!inputText || isLoading}
                      >
                      {copyButtonText}
                  </button>
                  <button 
                      onClick={handleClearClick} 
                      disabled={isLoading}
                      className={textButtonClasses}
                  >
                      Clear All
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};