// FIX: Added import for React to make the namespace available for type augmentation.
import React from 'react';

// This allows us to use Material Web Components in React and get type safety for their properties.
declare global {
  // FIX: Changed namespace from React to JSX to match what TypeScript's JSX factory expects.
  namespace JSX {
    interface IntrinsicElements {
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { indeterminate?: boolean; 'aria-label'?: string; }, HTMLElement>;
      'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { indeterminate?: boolean; }, HTMLElement>;
      'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'aria-label'?: string, title?: string, disabled?: boolean }, HTMLElement>;
      'md-filled-tonal-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-outlined-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-filled-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        id?: string;
        type?: string;
        rows?: number;
        value?: string;
        label?: string;
        readOnly?: boolean;
        disabled?: boolean;
      }, HTMLElement>;
      'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'aria-label'?: string, disabled?: boolean }, HTMLElement>;
      'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { variant?: string; size?: string; 'aria-label'?: string; disabled?: boolean; }, HTMLElement>;
    }
  }
}

export interface ParsedEntry {
  id: number;
  sourceReference: string;
  questioner: string | null;
  question: string | null;
  witness: string | null;
  answer: string | null;
  note: string | null;
  kernaussage?: string;
  zugeordneteKategorien?: string;
  begruendung?: string;
}

export interface KeyInsightItem {
    title: string;
    description: string;
    references: string;
}

export interface KeyInsights {
    summary: string;
    insights: KeyInsightItem[];
}

export interface CorpusItem {
    id: string;
    category: string;
    description: string;
}

// Ensure this file is treated as a module.
export {};