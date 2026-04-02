import { Injectable } from '@angular/core';

export interface ToastConfig {
  id: number;
  content: string;
  buttonClass: string;
  autohide: boolean;
  delay: number;
  position: string;
  toastImage: string; // Changed to string for the image path
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: ToastConfig[] = [];

  show(content: string, options: Partial<ToastConfig> = {}) {
    const toast: ToastConfig = {
      id: Date.now() + Math.random(),
      content: content,
      buttonClass: options.buttonClass || 'bg-primary',
      autohide: true,
      delay: options.delay || 3000, // Automatically hide after 3 seconds
      position: options.position || 'top-end',
      toastImage: options.toastImage || './assets/images/brand-logos/toggle-dark.png'
    };

    this.toasts.push(toast);

    if (toast.autohide) {
      setTimeout(() => this.remove(toast), toast.delay);
    }
  }

  remove(toast: ToastConfig) {
    this.toasts = this.toasts.filter(t => t.id !== toast.id);
  }
}
