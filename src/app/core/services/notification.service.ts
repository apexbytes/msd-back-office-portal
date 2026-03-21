import { Injectable, inject, OnDestroy, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '@/environments/environment';
import { AuthService } from './auth.service';

export interface AppNotification {
  id?: string;
  title: string;
  body: string;
  type: string;
  url?: string;
  ticketId?: string;
  ticketUid?: string;
  createdAt: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private socket!: Socket;
  private authService = inject(AuthService);

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.initSocket(user.id);
      } else {
        this.disconnectSocket();
      }
    });
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private initSocket(userId: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    const token = this.getCookie('accessToken');

    this.socket = io(environment.wsUrl, {
      auth: { token: token },
      query: { userId },
      transports: ['polling', 'websocket'],
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    this.socket.on('app-notification', (payload: any) => {
      this.handleNewNotification(payload);
    });
  }

  private handleNewNotification(payload: any): void {
    const newNotif: AppNotification = {
      ...payload,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      read: false,
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotif, ...current]);
    this.updateUnreadCount();
  }

  markAsRead(id: string): void {
    const current = this.notificationsSubject.value.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    this.notificationsSubject.next(current);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const current = this.notificationsSubject.value.map((n) => ({ ...n, read: true }));
    this.notificationsSubject.next(current);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter((n) => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  ngOnDestroy(): void {
    this.disconnectSocket();
  }
}
