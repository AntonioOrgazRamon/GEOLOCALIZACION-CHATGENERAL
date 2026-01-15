import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, ChatMessageRequest, ChatMessagesResponse } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private loginTimestamp: number = Date.now(); // Timestamp de cuando el usuario entró

  constructor(private http: HttpClient) {
    // Guardar timestamp cuando se crea el servicio (al hacer login)
    this.loginTimestamp = Date.now();
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/message`, { message });
  }

  joinChat(): Observable<ChatMessage> {
    // Enviar mensaje de "se ha unido al chat"
    return this.http.post<ChatMessage>(`${this.apiUrl}/join`, {});
  }

  getMessages(): Observable<ChatMessagesResponse> {
    // El backend ahora usa el mensaje de "se ha unido" como referencia
    return this.http.get<ChatMessagesResponse>(`${this.apiUrl}/messages`);
  }

  resetLoginTimestamp(): void {
    // Reiniciar timestamp (útil si el usuario se reconecta)
    this.loginTimestamp = Date.now();
  }

  getLoginTimestamp(): number {
    return this.loginTimestamp;
  }
}

