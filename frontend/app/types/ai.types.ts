export type AiGenerationType = 'title' | 'description';

export interface GenerateAiPayload {
  type: AiGenerationType;
  prompt: string;
  context?: string;
}

export interface GenerateAiResponse {
  suggestions: string[];
}
