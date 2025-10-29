// FIX: Removed side-effect import of 'react' to resolve module augmentation error.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

export interface ProtocolEntry {
  id: number;
  speaker: string;
  role: string; // e.g., 'Vorsitzender', 'Zeuge', 'Abgeordneter'
  type: string; // e.g., 'Frage', 'Antwort', 'Verfahrenshinweis'
  content: string;
  sourceReference: string;
}

export interface ParsedEntry {
  id: number;
  sourceReference: string;
  questioner: string | null;
  question: string | null;
  witness: string | null;
  answer: string | null;
  note: string | null;
  // Analysis fields
  kernaussage?: string;
  zugeordneteKategorien?: string;
  begruendung?: string;
}

export interface AnalysisEntry {
  id: number;
  kernaussage: string;
  zugeordneteKategorien: string;
  begruendung: string;
}

export interface KeyInsights {
  summary: string;
  insights: InsightItem[];
}

export interface InsightItem {
  title: string;
  description: string;
  references: string;
}

// Augment the 'react' module to include our custom web component types.
// This is the correct way to add custom elements to JSX's IntrinsicElements
// in a modular TypeScript project.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // FIX: Add 'disabled' property to button component types to align with Material Web Components and fix TypeScript errors.
      'md-elevated-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      // FIX: Add 'disabled' property to button component types to align with Material Web Components and fix TypeScript errors.
      'md-filled-tonal-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      // FIX: Add 'disabled' property to button component types to align with Material Web Components and fix TypeScript errors.
      'md-text-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      // FIX: Add 'disabled' property to button component types to align with Material Web Components and fix TypeScript errors.
      'md-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      // FIX: Add 'disabled' property to button component types to align with Material Web Components and fix TypeScript errors.
      'md-fab': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { variant?: string; label?: string; size?: 'small' | 'medium' | 'large'; disabled?: boolean; }, HTMLElement>;
      'md-outlined-text-field': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { 
        label?: string;
        value?: string;
        type?: string;
        rows?: number;
        disabled?: boolean;
        onInput?: (event: any) => void;
       }, HTMLElement>;
      'md-linear-progress': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { indeterminate: boolean; }, HTMLElement>;
    }
  }
}
