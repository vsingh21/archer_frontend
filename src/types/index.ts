// src/types/index.ts

export type PersonSuggestion = string;

export interface Relationship {
  id?: string | number;
  thumbUrl: string;
  caption: string;
  dateCreated: string;
  relid?: string;
  landingUrl?: string;
}

export interface ConnectionData {
  names: string[];
  relationships: Relationship[];
  timesVisited: number;
}

export type Theme = 'dark' | 'light';