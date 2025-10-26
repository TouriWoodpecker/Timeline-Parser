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
      className="w-full h-80 p-4 border border-[var(--color-outline)] rounded-[var(--radius-m)] bg-transparent focus:outline-none focus:ring-0 focus:border-2 focus:border-[var(--color-primary)] transition-all duration-200 text-base resize-y disabled:cursor-not-allowed disabled:bg-[var(--color-on-surface)]/5 disabled:border-[var(--color-on-surface)]/10 text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] leading-relaxed"
      aria-label="Protocol Text Input"
      disabled={isLoading}
    />
  );
};