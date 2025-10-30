import React from 'react';
import { TextInput } from './TextInput';

interface InputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  fileName: string;
  isLoading: boolean;
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
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <input type="file" id="pdf-upload" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} accept="application/pdf" />
                      <md-filled-tonal-icon-button onClick={triggerFileUpload} disabled={isLoading} title="Upload PDF">
                          <span className="material-symbols-outlined">upload_file</span>
                      </md-filled-tonal-icon-button>
                      {fileName && <span className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>File: <strong>{fileName}</strong></span>}
                  </div>
                  <div style={{ flexGrow: 1 }}></div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <md-icon-button onClick={onCopyText} disabled={!inputText.trim() || isLoading} title={copyButtonText}>
                        <span className="material-symbols-outlined">content_copy</span>
                      </md-icon-button>
                      <md-icon-button onClick={onClear} disabled={isLoading} title="Clear All">
                        <span className="material-symbols-outlined">delete_sweep</span>
                      </md-icon-button>
                      {isLoading && (
                          <md-outlined-icon-button onClick={onAbortOperation} title="Abort Operation">
                              <span className="material-symbols-outlined">cancel</span>
                          </md-outlined-icon-button>
                      )}
                      <md-filled-icon-button onClick={onParse} disabled={!inputText.trim() || isLoading} title="Parse Protocol">
                          <span className="material-symbols-outlined">hub</span>
                      </md-filled-icon-button>
                  </div>
              </div>
              
              <TextInput value={inputText} onInput={handleTextInput} isLoading={isLoading} />
            </>
          )}
        </div>
    </div>
  );
};