import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
}

interface BanAppeal {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  message: string;
  status: string;
  created_at: string;
  ban_reason: string | null;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  users: User[] = [];
  banAppeals: BanAppeal[] = [];
  loading: boolean = false;
  error: string = '';
  activeTab: 'users' | 'appeals' = 'users';
  
  // Ban form
  banUserId: number | null = null;
  banReason: string = '';
  showBanModal: boolean = false;

  private refreshInterval?: Subscription;
  private readonly REFRESH_INTERVAL_MS = 1500; // 1.5 segundos para tiempo real más rápido
  refreshing: boolean = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  loadData(showLoading: boolean = false): void {
    if (showLoading) {
      this.loading = true;
    }
    this.refreshing = true;
    this.error = '';

    let usersLoaded = false;
    let appealsLoaded = false;

    const checkComplete = () => {
      if (usersLoaded && appealsLoaded) {
        this.loading = false;
        this.refreshing = false;
      }
    };

    // Cargar usuarios y peticiones en paralelo
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        this.users = response.users || [];
        usersLoaded = true;
        checkComplete();
      },
      error: (err) => {
        this.error = err.error?.error || 'Error loading users';
        usersLoaded = true;
        checkComplete();
      }
    });

    this.adminService.getBanAppeals().subscribe({
      next: (response) => {
        this.banAppeals = response.appeals || [];
        appealsLoaded = true;
        checkComplete();
      },
      error: (err) => {
        console.error('Error loading ban appeals:', err);
        appealsLoaded = true;
        checkComplete();
      }
    });
  }

  manualRefresh(): void {
    this.loadData(true);
  }

  startAutoRefresh(): void {
    this.refreshInterval = interval(this.REFRESH_INTERVAL_MS).subscribe(() => {
      // Refrescar siempre, incluso si está cargando (para tiempo real)
      this.loadData(false);
    });
  }

  openBanModal(userId: number): void {
    this.banUserId = userId;
    this.banReason = '';
    this.showBanModal = true;
  }

  closeBanModal(): void {
    this.showBanModal = false;
    this.banUserId = null;
    this.banReason = '';
  }

  banUser(): void {
    if (!this.banUserId || !this.banReason.trim()) {
      this.error = 'Please enter a ban reason';
      return;
    }

    this.loading = true;
    this.adminService.banUser(this.banUserId, this.banReason).subscribe({
      next: () => {
        this.closeBanModal();
        // Actualizar inmediatamente sin esperar
        setTimeout(() => {
          this.loadData(true);
        }, 100);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error banning user';
        this.loading = false;
      }
    });
  }

  unbanUser(userId: number): void {
    if (!confirm('Are you sure you want to unban this user?')) {
      return;
    }

    this.loading = true;
    this.adminService.unbanUser(userId).subscribe({
      next: () => {
        // Actualizar inmediatamente sin esperar
        setTimeout(() => {
          this.loadData(true);
        }, 100);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error unbanning user';
        this.loading = false;
      }
    });
  }

  approveAppeal(appealId: number): void {
    if (!confirm('Approve this ban appeal and unban the user?')) {
      return;
    }

    this.loading = true;
    this.adminService.approveBanAppeal(appealId).subscribe({
      next: () => {
        // Actualizar inmediatamente sin esperar
        setTimeout(() => {
          this.loadData(true);
        }, 100);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error approving appeal';
        this.loading = false;
      }
    });
  }

  rejectAppeal(appealId: number): void {
    if (!confirm('Reject this ban appeal?')) {
      return;
    }

    this.loading = true;
    this.adminService.rejectBanAppeal(appealId).subscribe({
      next: () => {
        // Actualizar inmediatamente sin esperar
        setTimeout(() => {
          this.loadData(true);
        }, 100);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error rejecting appeal';
        this.loading = false;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getUserStatus(user: User): string {
    if (user.is_banned) return 'Banned';
    if (!user.is_active) return 'Inactive';
    return 'Active';
  }

  getUserStatusClass(user: User): string {
    if (user.is_banned) return 'status-banned';
    if (!user.is_active) return 'status-inactive';
    return 'status-active';
  }
}
