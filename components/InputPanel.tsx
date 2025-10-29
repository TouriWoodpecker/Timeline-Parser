import React from 'react';
import { TextInput } from './TextInput';
import { LoadingIndicator } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface InputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  fileName: string;
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
  onAbortOperation: () => void;
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
  onAbortOperation,
}) => {
  const handleTextInput = (e: React.FormEvent<HTMLInputElement>) => {
    setInputText((e.target as HTMLInputElement).value);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`card ${isMinimized ? 'card--filled' : 'card--elevated'}`}>
        <div className="panel-header" onClick={onToggleMinimize} style={{ cursor: 'pointer' }}>
            <div className="panel-header-title">
                <h2 className="md-typescale-title-large" style={{ margin: 0 }}>Input</h2>
            </div>
            <md-icon-button aria-label={isMinimized ? 'Expand panel' : 'Collapse panel'}>
                <span className="material-symbols-outlined">{isMinimized ? 'expand_more' : 'expand_less'}</span>
            </md-icon-button>
        </div>

        <div className="panel-content">
          {!isMinimized && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
                  <input type="file" id="pdf-upload" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} accept="application/pdf" />
                  <md-filled-tonal-button onClick={triggerFileUpload} disabled={isLoading}>
                      <span className="material-symbols-outlined" slot="icon">upload_file</span>
                      Upload PDF
                  </md-filled-tonal-button>
                  {fileName && <span className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>File: <strong>{fileName}</strong></span>}
                  <div style={{flexGrow: 1}}></div>
                  {isLoading && (
                      <md-filled-tonal-button onClick={onAbortOperation} style={{'--md-filled-tonal-button-container-color': 'var(--md-sys-color-tertiary-container)'} as React.CSSProperties}>
                          <span className="material-symbols-outlined" slot="icon">cancel</span>
                          Abort
                      </md-filled-tonal-button>
                  )}
                  <md-elevated-button onClick={onParse} disabled={!inputText.trim() || isLoading}>
                      <span className="material-symbols-outlined" slot="icon">hub</span>
                      Parse Protocol
                  </md-elevated-button>
              </div>
              
              {error && <ErrorMessage message={error} />}
              <TextInput value={inputText} onInput={handleTextInput} isLoading={isLoading} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <md-text-button onClick={onCopyText} disabled={!inputText.trim() || isLoading}>
                    <span className="material-symbols-outlined" slot="icon">content_copy</span>
                    {copyButtonText}
                  </md-text-button>
                  <md-text-button onClick={onClear} disabled={isLoading}>
                    <span className="material-symbols-outlined" slot="icon">delete_sweep</span>
                    Clear All
                  </md-text-button>
              </div>

              {isLoading && loadingMessage && <LoadingIndicator message={loadingMessage} />}
            </>
          )}
        </div>
    </div>
  );
};