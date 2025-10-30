import React from 'react';
// FIX: Import types for custom element definitions.
import '../types';

interface TextInputProps {
  value: string;
  onInput: (e: React.FormEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const placeholderText = "Your parsable text will appear here.";

export const TextInput: React.FC<TextInputProps> = ({ value, onInput, isLoading }) => {
  return (
    <md-outlined-text-field
        id="protocol-text-input"
        type="textarea"
        rows={8}
        style={{
            width: '100%',
            maxHeight: '30vh',
            resize: 'vertical'
        }}
        value={value}
        onInput={onInput}
        disabled={isLoading}
        label={placeholderText}
    />
  );
};