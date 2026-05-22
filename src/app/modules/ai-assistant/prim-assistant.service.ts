import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';

/** Réponse de l'assistant conversationnel (backend `/ai-assistant/chat`). */
export interface AssistantChatResponse {
  intent: string;
  confidence: number;
  text_response: string;
  action_draft: Record<string, unknown> | null;
  requires_confirmation: boolean;
  blocked_reason: string | null;
}

/**
 * Service de l'assistant RH Prim'Assistant.
 *
 * Appelle le vrai endpoint backend, qui route la requête vers le LLM
 * configuré (Ollama en local / gratuit, Claude en mode payant).
 */
@Injectable({ providedIn: 'root' })
export class PrimAssistantService {
  private readonly apiClient = inject(ApiClientService);

  /** Envoie un message à l'assistant et renvoie sa réponse. */
  chat(message: string): Observable<AssistantChatResponse> {
    return this.apiClient.post<AssistantChatResponse, { message: string }>(
      API_ENDPOINTS.aiAssistant.chat,
      { message },
    );
  }
}
