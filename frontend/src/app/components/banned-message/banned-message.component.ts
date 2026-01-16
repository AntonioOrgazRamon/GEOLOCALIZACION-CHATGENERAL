import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-banned-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banned-message.component.html',
  styleUrl: './banned-message.component.css'
})
export class BannedMessageComponent implements OnInit {
  banReason: string = '';
  bannedAt: string = '';
  appealMessage: string = '';
  showAppealForm: boolean = false;
  appealSent: boolean = false;
  error: string = '';
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.banReason = this.route.snapshot.queryParams['reason'] || 'No reason provided';
    this.bannedAt = this.route.snapshot.queryParams['banned_at'] || '';
    
    // Verificar si ya tiene una petición pendiente
    this.checkPendingAppeal();
  }

  checkPendingAppeal(): void {
    this.adminService.getBanStatus().subscribe({
      next: (response: any) => {
        if (!response.is_banned) {
          // Si ya no está baneado, redirigir a login
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        // Ignorar errores
      }
    });
  }

  showAppeal(): void {
    this.showAppealForm = true;
  }

  sendAppeal(): void {
    if (!this.appealMessage.trim()) {
      this.error = 'Please enter a message';
      return;
    }

    this.loading = true;
    this.error = '';

    this.adminService.createBanAppeal(this.appealMessage).subscribe({
      next: () => {
        this.appealSent = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error sending appeal';
        this.loading = false;
      }
    });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
