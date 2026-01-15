import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage } from '../../models/chat.model';
import { environment } from '../../../environments/environment';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading: boolean = false;
  error: string = '';
  private messagesInterval?: Subscription;
  private readonly POLL_INTERVAL_MS = 800; // Actualizar cada 800ms para mensajes más rápidos

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Primero, enviar mensaje de "se ha unido al chat"
    this.joinChat();
    
    // Detectar cuando el usuario cierra la ventana/pestaña
    this.setupBeforeUnload();
  }

  joinChat(): void {
    this.chatService.joinChat().subscribe({
      next: (response: any) => {
        // Si es el primer usuario, puede venir un array de mensajes
        if (response.messages && Array.isArray(response.messages)) {
          // Agregar los mensajes del sistema al inicio de la lista
          this.messages = response.messages;
        }
        // Después de unirse, cargar mensajes y empezar polling
        this.loadMessages();
        this.startPolling();
      },
      error: (err) => {
        console.error('Error joining chat:', err);
        // Aun así, intentar cargar mensajes
        this.loadMessages();
        this.startPolling();
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar intervalos
    if (this.messagesInterval) {
      this.messagesInterval.unsubscribe();
    }
    
    // NO hacer logout aquí porque ngOnDestroy se ejecuta al navegar entre rutas
    // Solo hacer logout cuando realmente se cierra la ventana (beforeunload)
  }

  loadMessages(): void {
    // Guardar el estado del input antes de actualizar
    const wasInputFocused = this.messageInput?.nativeElement === document.activeElement;
    const inputValue = this.newMessage;
    const cursorPosition = this.messageInput?.nativeElement.selectionStart || inputValue.length;

    // NO actualizar loading si el usuario está escribiendo para evitar interrupciones visuales
    if (!wasInputFocused) {
      this.loading = true;
    }
    this.error = '';

    this.chatService.getMessages().subscribe({
      next: (response) => {
        // Solo actualizar si hay cambios (comparar por IDs y cantidad)
        const newMessages = response.messages;
        const currentIds = this.messages.map(m => m.id).join(',');
        const newIds = newMessages.map(m => m.id).join(',');
        const hasChanges = currentIds !== newIds || this.messages.length !== newMessages.length;
        
        if (hasChanges) {
          // Si el usuario está escribiendo, desactivar detección de cambios temporalmente
          if (wasInputFocused) {
            this.cdr.detach();
          }
          
          // Actualizar mensajes
          this.messages = newMessages;
          this.scrollToBottom();
          
          // Si estaba escribiendo, restaurar detección y estado del input
          if (wasInputFocused) {
            // Usar setTimeout para restaurar después de que Angular termine el ciclo
            setTimeout(() => {
              this.cdr.reattach();
              if (this.messageInput) {
                const input = this.messageInput.nativeElement;
                // Restaurar el valor y sincronizar con la propiedad
                if (input.value !== inputValue) {
                  input.value = inputValue;
                  this.newMessage = inputValue;
                }
                // Restaurar focus y cursor
                input.focus();
                const pos = Math.min(cursorPosition, inputValue.length);
                input.setSelectionRange(pos, pos);
              }
            }, 0);
          }
        }
        
        if (!wasInputFocused) {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.error = 'Error al cargar mensajes';
        if (!wasInputFocused) {
          this.loading = false;
        }
        
        // Restaurar el estado del input incluso si hay error
        if (wasInputFocused && this.messageInput) {
          setTimeout(() => {
            if (this.messageInput) {
              const input = this.messageInput.nativeElement;
              if (input.value !== inputValue) {
                input.value = inputValue;
                this.newMessage = inputValue;
              }
              input.focus();
              const pos = Math.min(cursorPosition, inputValue.length);
              input.setSelectionRange(pos, pos);
            }
          }, 0);
        }
      }
    });
  }

  startPolling(): void {
    // Actualizar mensajes cada X segundos, ejecutando fuera de la zona de Angular
    // para evitar detección de cambios innecesaria
    this.ngZone.runOutsideAngular(() => {
      this.messagesInterval = interval(this.POLL_INTERVAL_MS).subscribe(() => {
        // Volver a la zona de Angular solo cuando realmente necesitemos actualizar
        this.ngZone.run(() => {
          this.loadMessages();
        });
      });
    });
  }

  onInput(event: Event): void {
    this.newMessage = (event.target as HTMLInputElement).value;
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }

    const messageText = this.newMessage.trim();
    this.newMessage = '';
    this.loading = true;

    this.chatService.sendMessage(messageText).subscribe({
      next: (message) => {
        // Agregar el mensaje a la lista
        this.messages.push(message);
        this.loading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.error = 'Error al enviar mensaje';
        this.loading = false;
        this.newMessage = messageText; // Restaurar el mensaje
      }
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  setupBeforeUnload(): void {
    // Usar pagehide para detectar cierre real de pestaña/ventana
    // pagehide es más confiable que beforeunload para distinguir entre recarga y cierre
    window.addEventListener('pagehide', (event) => {
      // event.persisted es true cuando la página se está guardando en cache (back/forward)
      // Si persisted es false, significa que la página se está descargando (cierre real)
      if (!event.persisted) {
        // Es un cierre real, no una recarga o navegación
        this.handleLogoutSync();
      }
    });
  }

  handleLogout(): void {
    // Hacer logout automáticamente cuando el usuario cierra la ventana
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout automático realizado');
      },
      error: () => {
        // Incluso si falla, limpiar localStorage
        console.log('Logout automático (con error)');
      }
    });
  }

  handleLogoutSync(): void {
    // Usar fetch con keepalive para logout cuando se cierra la ventana
    // NO limpiar localStorage aquí porque puede ejecutarse en situaciones donde la ventana no se cierra realmente
    const token = this.authService.getToken();
    if (token) {
      // Intentar hacer logout con fetch keepalive
      fetch(`${environment.apiUrl}/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        keepalive: true
      }).catch(() => {
        // Ignorar errores, ya que la ventana se está cerrando
      });
    }
    // El backend se encargará de desactivar al usuario
    // NO limpiar localStorage aquí para evitar problemas de autenticación
  }

  isOwnMessage(message: ChatMessage): boolean {
    const user = this.authService.getUser();
    return user && message.user_name === user.name && !this.isSystemMessage(message);
  }

  isSystemMessage(message: ChatMessage): boolean {
    return message.message.includes('se ha unido al chat') || 
           message.message.includes('se ha salido del chat') ||
           message.message.includes('se ha creado el chatgeneral');
  }

  trackByMessageId(index: number, message: ChatMessage): any {
    return message.id;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'Ahora';
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
