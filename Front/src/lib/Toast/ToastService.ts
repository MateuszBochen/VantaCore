import {SettingName} from '../Settings/Enum/SettingName';
import {Settings} from '../Settings/Settings';
import type {Toast, ToastVariant} from './Type/types';

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_TOAST_DURATION_MS = 4000;

class ToastService {
    private static instance: ToastService;

    private visible: Toast[] = [];

    private readonly queue: Toast[] = [];

    private readonly listeners: Set<() => void> = new Set();

    private readonly timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    static getInstance = (): ToastService => {
        if (!ToastService.instance) {
            ToastService.instance = new ToastService();
        }

        return ToastService.instance;
    }

    private constructor() {
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    getSnapshot = (): Toast[] => {
        return this.visible;
    }

    push = (variant: ToastVariant, message: string): void => {
        const toast: Toast = {
            id: `${Date.now()}-${Math.random()}`,
            variant,
            message,
        };

        if (this.visible.length < MAX_VISIBLE_TOASTS) {
            this.show(toast);
            return;
        }

        this.queue.push(toast);
    }

    dismiss = (id: string): void => {
        const timer = this.timers.get(id);

        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }

        this.visible = this.visible.filter((toast) => toast.id !== id);
        this.notify();

        const next = this.queue.shift();

        if (next) {
            this.show(next);
        }
    }

    private show = (toast: Toast): void => {
        this.visible = [...this.visible, toast];
        this.notify();

        const timer = setTimeout(() => this.dismiss(toast.id), this.getDuration());
        this.timers.set(toast.id, timer);
    }

    private getDuration = (): number => {
        const raw = Settings.getSetting(SettingName.TOAST_DURATION_MS);
        const parsed = Number(raw);

        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TOAST_DURATION_MS;
    }

    private notify = (): void => {
        this.listeners.forEach((listener) => listener());
    }
}

export default ToastService;

export const toastService = ToastService.getInstance();