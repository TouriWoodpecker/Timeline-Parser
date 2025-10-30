import React, { useState } from 'react';
// FIX: Import types for custom element definitions.
import '../../types';

interface IOFieldProps {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    rows?: number;
    disabled?: boolean;
    showCopy?: boolean;
    isOutput?: boolean;
    showClear?: boolean;
    onClear?: () => void;
    customActions?: React.ReactNode;
}

export const IOField: React.FC<IOFieldProps> = ({
    label,
    value,
    onValueChange,
    placeholder,
    rows = 8,
    disabled = false,
    showCopy = false,
    isOutput = false,
    showClear = false,
    onClear = () => {},
    customActions = null,
}) => {
    const [copyIcon, setCopyIcon] = useState('content_copy');

    const handleCopy = () => {
        if (value) {
            navigator.clipboard.writeText(value);
            setCopyIcon('check');
            setTimeout(() => setCopyIcon('content_copy'), 2000);
        }
    };

    const canCopy = !!value && showCopy;
    const canClear = !!value && showClear;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', minHeight: '40px' }}>
                <label className="md-typescale-body-large" htmlFor={label.replace(' ', '-').toLowerCase()}>{label}</label>
                <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                    {customActions}
                    {canCopy && (
                        <md-icon-button onClick={handleCopy} title="Copy to clipboard" disabled={disabled}>
                            <span className="material-symbols-outlined">{copyIcon}</span>
                        </md-icon-button>
                    )}
                    {canClear && (
                         <md-icon-button onClick={onClear} title="Clear text" disabled={disabled}>
                            <span className="material-symbols-outlined">close</span>
                        </md-icon-button>
                    )}
                </div>
            </div>
            <md-outlined-text-field
                id={label.replace(' ', '-').toLowerCase()}
                type="textarea"
                rows={rows}
                style={{
                    width: '100%',
                    maxHeight: '40vh',
                    resize: 'vertical'
                }}
                value={value}
                onInput={(e: any) => onValueChange(e.target.value)}
                disabled={disabled}
                readOnly={isOutput}
                label={placeholder}
            />
        </div>
    );
};