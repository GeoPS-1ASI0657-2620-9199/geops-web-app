export interface HelpResponse {
  Id: number;
  question: string;
  answer: string; // Puede contener HTML o texto enriquecido
  category?: string;
}
