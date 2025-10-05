const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'system' | 'shipping';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  systemAlerts: boolean;
}

class NotificationService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Notification API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getNotifications(page: number = 1, limit: number = 20): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const response = await this.request<{ success: boolean; data: { notifications: Notification[]; total: number } }>(
        `/api/notifications?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.request(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.request('/api/notifications/read-all', {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.request(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.request<{ success: boolean; count: number }>('/api/notifications/unread-count');
      return response.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await this.request<{ success: boolean; data: NotificationPreferences }>('/api/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        email: true,
        sms: false,
        push: true,
        orderUpdates: true,
        promotions: true,
        systemAlerts: true
      };
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await this.request<{ success: boolean; data: NotificationPreferences }>('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  async subscribeToPush(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        await this.request('/api/notifications/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({ subscription })
        });
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          await this.request('/api/notifications/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ subscription })
          });
        }
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  // Local storage fallback for offline functionality
  private getLocalNotifications(): Notification[] {
    try {
      const localNotifications = localStorage.getItem('notifications');
      return localNotifications ? JSON.parse(localNotifications) : [];
    } catch (error) {
      console.error('Failed to get local notifications:', error);
      return [];
    }
  }

  private setLocalNotifications(notifications: Notification[]): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save local notifications:', error);
    }
  }

  // Offline notification operations
  async addLocalNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const notifications = this.getLocalNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `local_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    
    notifications.unshift(newNotification);
    this.setLocalNotifications(notifications);
    return newNotification;
  }

  async markLocalAsRead(notificationId: string): Promise<void> {
    const notifications = this.getLocalNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.setLocalNotifications(notifications);
    }
  }

  async deleteLocalNotification(notificationId: string): Promise<void> {
    const notifications = this.getLocalNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.setLocalNotifications(filtered);
  }

  // Utility methods
  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
