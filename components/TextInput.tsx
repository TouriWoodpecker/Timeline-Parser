import React from 'react';

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
        style={{ width: '100%' }}
        value={value}
        onInput={onInput}
        disabled={isLoading}
        label={placeholderText}
    />
  );
};