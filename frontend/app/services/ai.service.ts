import { apiClient } from './api';
import { GenerateAiPayload, GenerateAiResponse } from '../types';

export const aiService = {
  /**
   * Unified AI generation for titles or descriptions
   * Calls POST /ai/generate
   */
  generate: async (payload: GenerateAiPayload): Promise<GenerateAiResponse> => {
    const response = await apiClient.post<GenerateAiResponse>('/ai/generate', payload);
    return response.data;
  },
};
