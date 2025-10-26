export interface ProtocolEntry {
  id: number;
  speaker: string;
  role: string; // e.g., 'Vorsitzender', 'Zeuge', 'Abgeordneter'
  type: string; // e.g., 'Frage', 'Antwort', 'Verfahrenshinweis'
  content: string;
  sourceReference: string;
}

export interface PairedProtocolEntry {
  id: number;
  sourceReference: string;
  questioner: string | null;
  question: string | null;
  witness: string | null;
  answer: string | null;
  note: string | null;
}
