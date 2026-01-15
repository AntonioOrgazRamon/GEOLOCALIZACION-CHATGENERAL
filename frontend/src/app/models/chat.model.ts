export interface ChatMessage {
  id: number;
  user_name: string;
  message: string;
  created_at: string;
}

export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  count: number;
}

