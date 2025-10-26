import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}

const placeholderText = `Schlussendlich:

Hier könnte Ihr Text stehen.
...
`;

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, isLoading }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholderText}
      readOnly={isLoading}
      className="w-full h-80 p-4 border border-black/20 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-shadow duration-200 text-sm bg-white resize-y disabled:bg-black/5 disabled:cursor-not-allowed"
      aria-label="Protocol Text Input"
      disabled={isLoading}
    />
  );
};