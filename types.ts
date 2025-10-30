// types.ts

// FIX: Add a direct import of 'react' to make module augmentation work correctly.
// This ensures the file is treated as a module, allowing module augmentation to find and extend the 'react' module.
import 'react';

// Wir importieren nur die TYPEN, die wir brauchen.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Wir erweitern das Modul 'react'
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-circular-progress': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { indeterminate?: boolean; 'aria-label'?: string; }, HTMLElement>;
      'md-linear-progress': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { indeterminate?: boolean; }, HTMLElement>;
      'md-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { 'aria-label'?: string, title?: string, disabled?: boolean }, HTMLElement>;
      'md-filled-tonal-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-outlined-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-filled-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-outlined-text-field': DetailedHTMLProps<HTMLAttributes<HTMLElement> & {
        id?: string;
        type?: string;
        rows?: number;
        value?: string;
        label?: string;
        readOnly?: boolean;
        disabled?: boolean;
      }, HTMLElement>;
      'md-filled-tonal-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { 'aria-label'?: string, disabled?: boolean }, HTMLElement>;
      'md-filled-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      'md-outlined-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      'md-text-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { title?: string, disabled?: boolean }, HTMLElement>;
      'md-fab': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { variant?: string; size?: string; 'aria-label'?: string; disabled?: boolean; }, HTMLElement>;
    }
  }
}

// Diese Typen können hier bleiben.
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
