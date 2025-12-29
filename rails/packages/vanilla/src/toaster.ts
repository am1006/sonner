/**
 * Toaster component - DOM manipulation and rendering
 * Vanilla JS port of sonner's index.tsx
 */

import { CloseIcon, createLoader, getAsset } from './assets';
import { ToastState } from './state';
import {
  isAction,
  type HeightT,
  type Offset,
  type SwipeDirection,
  type ToasterOptions,
  type ToastT,
  type ToastToDismiss,
} from './types';

// Constants
const VISIBLE_TOASTS_AMOUNT = 3;
const VIEWPORT_OFFSET = '24px';
const MOBILE_VIEWPORT_OFFSET = '16px';
const TOAST_LIFETIME = 4000;
const TOAST_WIDTH = 356;
const GAP = 14;
const SWIPE_THRESHOLD = 45;
const TIME_BEFORE_UNMOUNT = 200;

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function getDefaultSwipeDirections(position: string): SwipeDirection[] {
  const [y, x] = position.split('-');
  const directions: SwipeDirection[] = [];
  if (y) directions.push(y as SwipeDirection);
  if (x) directions.push(x as SwipeDirection);
  return directions;
}

function getDocumentDirection(): 'ltr' | 'rtl' | 'auto' {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'ltr';
  const dirAttribute = document.documentElement.getAttribute('dir');
  if (dirAttribute === 'auto' || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction as 'ltr' | 'rtl';
  }
  return dirAttribute as 'ltr' | 'rtl';
}

function assignOffset(
  defaultOffset: Offset | undefined,
  mobileOffset: Offset | undefined
): Record<string, string> {
  const styles: Record<string, string> = {};

  [defaultOffset, mobileOffset].forEach((offset, index) => {
    const isMobile = index === 1;
    const prefix = isMobile ? '--mobile-offset' : '--offset';
    const defaultValue = isMobile ? MOBILE_VIEWPORT_OFFSET : VIEWPORT_OFFSET;

    function assignAll(offset: string | number) {
      ['top', 'right', 'bottom', 'left'].forEach((key) => {
        styles[`${prefix}-${key}`] = typeof offset === 'number' ? `${offset}px` : offset;
      });
    }

    if (typeof offset === 'number' || typeof offset === 'string') {
      assignAll(offset);
    } else if (typeof offset === 'object' && offset !== null) {
      ['top', 'right', 'bottom', 'left'].forEach((key) => {
        const k = key as keyof typeof offset;
        if (offset[k] === undefined) {
          styles[`${prefix}-${key}`] = defaultValue;
        } else {
          styles[`${prefix}-${key}`] = typeof offset[k] === 'number' ? `${offset[k]}px` : String(offset[k]);
        }
      });
    } else {
      assignAll(defaultValue);
    }
  });

  return styles;
}


interface ToastInstance {
  toast: ToastT;
  element: HTMLLIElement;
  mounted: boolean;
  removed: boolean;
  height: number;
  offset: number;
  closeTimeout?: ReturnType<typeof setTimeout>;
  remainingTime: number;
  closeTimerStart: number;
  swiping: boolean;
  swipeDirection: 'x' | 'y' | null;
  pointerStart: { x: number; y: number } | null;
  dragStartTime: Date | null;
  isSwiped: boolean;
}

export class Toaster {
  private container: HTMLElement | null = null;
  private listEl: HTMLOListElement | null = null;
  private toastInstances: Map<number | string, ToastInstance> = new Map();
  private heights: HeightT[] = [];
  private expanded = false;
  private interacting = false;
  private unsubscribe: (() => void) | null = null;
  private boundListHandlers: {
    mouseenter: () => void;
    mousemove: () => void;
    mouseleave: () => void;
    pointerdown: (e: PointerEvent) => void;
    pointerup: () => void;
  } | null = null;
  private options: ToasterOptions & {
    id: string;
    invert: boolean;
    theme: 'light' | 'dark' | 'system';
    position: string;
    hotkey: string[];
    richColors: boolean;
    expand: boolean;
    duration: number;
    gap: number;
    visibleToasts: number;
    closeButton: boolean;
    className: string;
    style: Partial<CSSStyleDeclaration>;
    offset: Offset;
    mobileOffset: Offset;
    dir: 'rtl' | 'ltr' | 'auto';
    containerAriaLabel: string;
    toastOptions: NonNullable<ToasterOptions['toastOptions']>;
  };
  private actualTheme: 'light' | 'dark' = 'light';
  private isDocumentHidden = false;

  constructor(options: ToasterOptions = {}) {
    this.options = {
      id: options.id ?? '',
      invert: options.invert ?? false,
      theme: options.theme ?? 'light',
      position: options.position ?? 'bottom-right',
      hotkey: options.hotkey ?? ['altKey', 'KeyT'],
      richColors: options.richColors ?? false,
      expand: options.expand ?? false,
      duration: options.duration ?? TOAST_LIFETIME,
      gap: options.gap ?? GAP,
      visibleToasts: options.visibleToasts ?? VISIBLE_TOASTS_AMOUNT,
      closeButton: options.closeButton ?? false,
      className: options.className ?? '',
      style: options.style ?? {},
      offset: options.offset ?? VIEWPORT_OFFSET,
      mobileOffset: options.mobileOffset ?? MOBILE_VIEWPORT_OFFSET,
      dir: options.dir ?? getDocumentDirection(),
      swipeDirections: options.swipeDirections ?? undefined,
      containerAriaLabel: options.containerAriaLabel ?? 'Notifications',
      toastOptions: options.toastOptions ?? {},
    };
  }

  mount(target: HTMLElement | string = document.body): void {
    const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetEl) {
      console.error('Toaster: target element not found');
      return;
    }

    this.setupTheme();
    this.createContainer();
    targetEl.appendChild(this.container!);
    this.setupEventListeners();
    this.subscribeToState();
  }

  unmount(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Remove list event listeners
    if (this.listEl && this.boundListHandlers) {
      this.listEl.removeEventListener('mouseenter', this.boundListHandlers.mouseenter);
      this.listEl.removeEventListener('mousemove', this.boundListHandlers.mousemove);
      this.listEl.removeEventListener('mouseleave', this.boundListHandlers.mouseleave);
      this.listEl.removeEventListener('pointerdown', this.boundListHandlers.pointerdown);
      this.listEl.removeEventListener('pointerup', this.boundListHandlers.pointerup);
    }
    this.boundListHandlers = null;

    this.unsubscribe?.();
    this.container?.remove();
    this.container = null;
    this.listEl = null;
    this.toastInstances.clear();
  }

  private setupTheme(): void {
    if (this.options.theme !== 'system') {
      this.actualTheme = this.options.theme as 'light' | 'dark';
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.actualTheme = darkQuery.matches ? 'dark' : 'light';

      darkQuery.addEventListener('change', (e) => {
        this.actualTheme = e.matches ? 'dark' : 'light';
        this.listEl?.setAttribute('data-sonner-theme', this.actualTheme);
      });
    }
  }

  private createContainer(): void {
    const [y, x] = this.options.position.split('-');

    // Create section wrapper
    this.container = document.createElement('section');
    const hotkeyLabel = this.options.hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '');
    this.container.setAttribute('aria-label', `${this.options.containerAriaLabel} ${hotkeyLabel}`);
    this.container.setAttribute('tabindex', '-1');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-relevant', 'additions text');
    this.container.setAttribute('aria-atomic', 'false');

    // Create ordered list
    this.listEl = document.createElement('ol');
    this.listEl.setAttribute('data-sonner-toaster', '');
    this.listEl.setAttribute('data-sonner-theme', this.actualTheme);
    this.listEl.setAttribute('data-y-position', y);
    this.listEl.setAttribute('data-x-position', x);
    this.listEl.setAttribute('dir', this.options.dir === 'auto' ? getDocumentDirection() : this.options.dir);
    this.listEl.setAttribute('tabindex', '-1');

    if (this.options.className) {
      this.listEl.className = this.options.className;
    }

    // Apply styles - CSS custom properties must use setProperty
    this.listEl.style.setProperty('--front-toast-height', '0px');
    this.listEl.style.setProperty('--width', `${TOAST_WIDTH}px`);
    this.listEl.style.setProperty('--gap', `${this.options.gap}px`);

    // Apply offset styles (CSS custom properties)
    const offsetStyles = assignOffset(this.options.offset, this.options.mobileOffset);
    Object.entries(offsetStyles).forEach(([key, value]) => {
      this.listEl!.style.setProperty(key, value);
    });

    // Apply any additional user styles
    Object.assign(this.listEl.style, this.options.style);

    this.container.appendChild(this.listEl);
  }

  private setupEventListeners(): void {
    // Hotkey listener
    document.addEventListener('keydown', this.handleKeyDown);

    // Document visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // List interactions - store references for cleanup
    this.boundListHandlers = {
      mouseenter: () => this.setExpanded(true),
      mousemove: () => this.setExpanded(true),
      mouseleave: () => {
        if (!this.interacting) this.setExpanded(false);
      },
      pointerdown: (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.dataset.dismissible !== 'false') {
          this.interacting = true;
        }
      },
      pointerup: () => {
        this.interacting = false;
      },
    };

    this.listEl?.addEventListener('mouseenter', this.boundListHandlers.mouseenter);
    this.listEl?.addEventListener('mousemove', this.boundListHandlers.mousemove);
    this.listEl?.addEventListener('mouseleave', this.boundListHandlers.mouseleave);
    this.listEl?.addEventListener('pointerdown', this.boundListHandlers.pointerdown);
    this.listEl?.addEventListener('pointerup', this.boundListHandlers.pointerup);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const { hotkey } = this.options;
    const isHotkeyPressed =
      hotkey.length > 0 &&
      hotkey.every((key) => (event as unknown as Record<string, boolean>)[key] || event.code === key);

    if (isHotkeyPressed) {
      this.setExpanded(true);
      this.listEl?.focus();
    }

    if (event.code === 'Escape' && this.listEl?.contains(document.activeElement)) {
      this.setExpanded(false);
    }
  };

  private handleVisibilityChange = (): void => {
    this.isDocumentHidden = document.hidden;
    // Pause/resume timers for all toasts
    this.toastInstances.forEach((instance) => {
      if (this.isDocumentHidden) {
        this.pauseTimer(instance);
      } else {
        this.startTimer(instance);
      }
    });
  };

  private setExpanded(expanded: boolean): void {
    this.expanded = expanded;
    this.toastInstances.forEach((instance) => {
      instance.element.dataset.expanded = String(expanded || this.options.expand);
    });
  }

  private subscribeToState(): void {
    this.unsubscribe = ToastState.subscribe((toast) => {
      if ((toast as ToastToDismiss).dismiss) {
        this.dismissToast(toast.id);
      } else {
        const toastData = toast as ToastT;
        // Filter by toasterId - only show toasts that match this toaster's id
        // If toaster has an id, only show toasts with matching toasterId
        // If toaster has no id, only show toasts without a toasterId
        if (this.options.id) {
          if (toastData.toasterId !== this.options.id) return;
        } else {
          if (toastData.toasterId) return;
        }
        this.addOrUpdateToast(toastData);
      }
    });
  }

  private addOrUpdateToast(toast: ToastT): void {
    const existing = this.toastInstances.get(toast.id);

    if (existing) {
      // Update existing toast
      this.updateToastElement(existing, toast);
    } else {
      // Create new toast
      this.createToast(toast);
    }
  }

  private createToast(toast: ToastT): void {
    const [y, x] = (toast.position || this.options.position).split('-');
    const duration = toast.duration ?? this.options.toastOptions?.duration ?? this.options.duration;
    const dismissible = toast.dismissible !== false;
    const closeButton = toast.closeButton ?? this.options.toastOptions?.closeButton ?? this.options.closeButton;
    const toastType = toast.type;

    // Create list item
    const li = document.createElement('li');
    li.setAttribute('tabindex', '0');
    li.setAttribute('data-sonner-toast', '');
    li.setAttribute('data-styled', String(!toast.custom && !toast.unstyled && !this.options.toastOptions?.unstyled));
    li.setAttribute('data-mounted', 'false');
    li.setAttribute('data-promise', String(Boolean(toast.promise)));
    li.setAttribute('data-swiped', 'false');
    li.setAttribute('data-removed', 'false');
    li.setAttribute('data-visible', 'true');
    li.setAttribute('data-y-position', y);
    li.setAttribute('data-x-position', x);
    li.setAttribute('data-front', 'true');
    li.setAttribute('data-swiping', 'false');
    li.setAttribute('data-dismissible', String(dismissible));
    li.setAttribute('data-type', toastType || '');
    li.setAttribute('data-invert', String(toast.invert ?? this.options.invert));
    li.setAttribute('data-swipe-out', 'false');
    li.setAttribute('data-expanded', String(this.expanded || this.options.expand));
    li.setAttribute('data-rich-colors', String(toast.richColors ?? this.options.richColors));
    if (toast.testId) {
      li.setAttribute('data-testid', toast.testId);
    }

    li.className = cn(
      this.options.toastOptions?.className,
      toast.className,
      this.options.toastOptions?.classNames?.toast,
      toast.classNames?.toast,
      this.options.toastOptions?.classNames?.[toastType as keyof typeof this.options.toastOptions.classNames],
      toast.classNames?.[toastType as keyof typeof toast.classNames]
    );

    // Build toast content
    this.buildToastContent(li, toast, closeButton);

    // Create instance
    const instance: ToastInstance = {
      toast,
      element: li,
      mounted: false,
      removed: false,
      height: 0,
      offset: 0,
      remainingTime: duration,
      closeTimerStart: 0,
      swiping: false,
      swipeDirection: null,
      pointerStart: null,
      dragStartTime: null,
      isSwiped: false,
    };

    // Setup pointer events for swipe
    this.setupSwipeHandlers(instance, dismissible);

    // Add to DOM
    this.listEl?.prepend(li);
    this.toastInstances.set(toast.id, instance);

    // Measure height after adding to DOM
    requestAnimationFrame(() => {
      const height = li.getBoundingClientRect().height;
      instance.height = height;
      this.heights.unshift({ toastId: toast.id, height, position: toast.position || this.options.position });

      // Set mounted and update positions
      li.dataset.mounted = 'true';
      this.updatePositions();

      // Start close timer
      if (toastType !== 'loading' && toast.promise === undefined && duration !== Infinity) {
        this.startTimer(instance);
      }
    });
  }

  private buildToastContent(li: HTMLLIElement, toast: ToastT, closeButton: boolean): void {
    const toastType = toast.type;

    // Handle custom content - replaces the default structure
    if (toast.custom) {
      let customElement: HTMLElement;

      if (typeof toast.custom === 'string') {
        // HTML string
        const wrapper = document.createElement('div');
        wrapper.innerHTML = toast.custom;
        customElement = wrapper.firstElementChild as HTMLElement || wrapper;
      } else if (typeof toast.custom === 'function') {
        // Builder function
        customElement = toast.custom(toast.id);
      } else {
        // HTMLElement
        customElement = toast.custom;
      }

      li.appendChild(customElement);
      return;
    }

    // Close button
    if (closeButton && toastType !== 'loading') {
      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label', 'Close toast');
      closeBtn.setAttribute('data-close-button', '');
      closeBtn.className = cn(this.options.toastOptions?.classNames?.closeButton, toast.classNames?.closeButton);
      closeBtn.innerHTML = CloseIcon;
      closeBtn.addEventListener('click', () => {
        if (toast.dismissible !== false) {
          this.removeToast(toast);
          toast.onDismiss?.(toast);
        }
      });
      li.appendChild(closeBtn);
    }

    // Icon
    if (toastType || toast.icon) {
      const iconWrapper = document.createElement('div');
      iconWrapper.setAttribute('data-icon', '');
      iconWrapper.className = cn(this.options.toastOptions?.classNames?.icon, toast.classNames?.icon);

      if (toast.type === 'loading' && !toast.icon) {
        const loader = createLoader(true, cn(this.options.toastOptions?.classNames?.loader, toast.classNames?.loader));
        iconWrapper.appendChild(loader);
      } else if (toast.icon) {
        if (typeof toast.icon === 'string') {
          iconWrapper.innerHTML = toast.icon;
        } else {
          iconWrapper.appendChild(toast.icon);
        }
      } else {
        const asset = getAsset(toastType!);
        if (asset) {
          iconWrapper.innerHTML = asset;
        }
      }

      li.appendChild(iconWrapper);
    }

    // Content
    const content = document.createElement('div');
    content.setAttribute('data-content', '');
    content.className = cn(this.options.toastOptions?.classNames?.content, toast.classNames?.content);

    // Title
    const title = document.createElement('div');
    title.setAttribute('data-title', '');
    title.className = cn(this.options.toastOptions?.classNames?.title, toast.classNames?.title);
    title.textContent = toast.title || '';
    content.appendChild(title);

    // Description
    if (toast.description) {
      const desc = document.createElement('div');
      desc.setAttribute('data-description', '');
      desc.className = cn(
        this.options.toastOptions?.descriptionClassName,
        toast.descriptionClassName,
        this.options.toastOptions?.classNames?.description,
        toast.classNames?.description
      );
      desc.textContent = toast.description;
      content.appendChild(desc);
    }

    li.appendChild(content);

    // Cancel button
    if (toast.cancel && isAction(toast.cancel)) {
      const cancelBtn = document.createElement('button');
      cancelBtn.setAttribute('data-button', '');
      cancelBtn.setAttribute('data-cancel', '');
      cancelBtn.className = cn(this.options.toastOptions?.classNames?.cancelButton, toast.classNames?.cancelButton);
      cancelBtn.textContent = toast.cancel.label;
      Object.assign(cancelBtn.style, toast.cancelButtonStyle || this.options.toastOptions?.cancelButtonStyle);
      cancelBtn.addEventListener('click', (e) => {
        if (toast.dismissible !== false) {
          toast.cancel!.onClick(e);
          this.removeToast(toast);
        }
      });
      li.appendChild(cancelBtn);
    }

    // Action button
    if (toast.action && isAction(toast.action)) {
      const actionBtn = document.createElement('button');
      actionBtn.setAttribute('data-button', '');
      actionBtn.setAttribute('data-action', '');
      actionBtn.className = cn(this.options.toastOptions?.classNames?.actionButton, toast.classNames?.actionButton);
      actionBtn.textContent = toast.action.label;
      Object.assign(actionBtn.style, toast.actionButtonStyle || this.options.toastOptions?.actionButtonStyle);
      actionBtn.addEventListener('click', (e) => {
        toast.action!.onClick(e);
        if (!e.defaultPrevented) {
          this.removeToast(toast);
        }
      });
      li.appendChild(actionBtn);
    }
  }

  private setupSwipeHandlers(instance: ToastInstance, dismissible: boolean): void {
    const { element: li, toast } = instance;
    const position = toast.position || this.options.position;
    const swipeDirections = this.options.swipeDirections ?? getDefaultSwipeDirections(position);

    li.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return; // Right click
      if (toast.type === 'loading' || !dismissible) return;

      instance.dragStartTime = new Date();
      instance.pointerStart = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        instance.swiping = true;
        li.dataset.swiping = 'true';
      }
    });

    li.addEventListener('pointermove', (e) => {
      if (!instance.pointerStart || !dismissible) return;

      const isHighlighted = (window.getSelection()?.toString().length ?? 0) > 0;
      if (isHighlighted) return;

      const yDelta = e.clientY - instance.pointerStart.y;
      const xDelta = e.clientX - instance.pointerStart.x;

      // Determine swipe direction
      if (!instance.swipeDirection && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
        instance.swipeDirection = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y';
      }

      let swipeAmount = { x: 0, y: 0 };

      const getDampening = (delta: number) => {
        const factor = Math.abs(delta) / 20;
        return 1 / (1.5 + factor);
      };

      if (instance.swipeDirection === 'y') {
        if (swipeDirections.includes('top') || swipeDirections.includes('bottom')) {
          if ((swipeDirections.includes('top') && yDelta < 0) || (swipeDirections.includes('bottom') && yDelta > 0)) {
            swipeAmount.y = yDelta;
          } else {
            const dampenedDelta = yDelta * getDampening(yDelta);
            swipeAmount.y = Math.abs(dampenedDelta) < Math.abs(yDelta) ? dampenedDelta : yDelta;
          }
        }
      } else if (instance.swipeDirection === 'x') {
        if (swipeDirections.includes('left') || swipeDirections.includes('right')) {
          if ((swipeDirections.includes('left') && xDelta < 0) || (swipeDirections.includes('right') && xDelta > 0)) {
            swipeAmount.x = xDelta;
          } else {
            const dampenedDelta = xDelta * getDampening(xDelta);
            swipeAmount.x = Math.abs(dampenedDelta) < Math.abs(xDelta) ? dampenedDelta : xDelta;
          }
        }
      }

      if (Math.abs(swipeAmount.x) > 0 || Math.abs(swipeAmount.y) > 0) {
        instance.isSwiped = true;
        li.dataset.swiped = 'true';
      }

      li.style.setProperty('--swipe-amount-x', `${swipeAmount.x}px`);
      li.style.setProperty('--swipe-amount-y', `${swipeAmount.y}px`);
    });

    li.addEventListener('pointerup', () => {
      if (!dismissible) return;

      const swipeAmountX = parseFloat(li.style.getPropertyValue('--swipe-amount-x') || '0');
      const swipeAmountY = parseFloat(li.style.getPropertyValue('--swipe-amount-y') || '0');
      const timeTaken = instance.dragStartTime ? new Date().getTime() - instance.dragStartTime.getTime() : 1000;

      const swipeAmount = instance.swipeDirection === 'x' ? swipeAmountX : swipeAmountY;
      const velocity = Math.abs(swipeAmount) / timeTaken;

      if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
        toast.onDismiss?.(toast);

        if (instance.swipeDirection === 'x') {
          li.dataset.swipeDirection = swipeAmountX > 0 ? 'right' : 'left';
        } else {
          li.dataset.swipeDirection = swipeAmountY > 0 ? 'down' : 'up';
        }

        li.dataset.swipeOut = 'true';
        this.removeToast(toast);
      } else {
        li.style.setProperty('--swipe-amount-x', '0px');
        li.style.setProperty('--swipe-amount-y', '0px');
      }

      instance.isSwiped = false;
      instance.swiping = false;
      instance.swipeDirection = null;
      instance.pointerStart = null;
      li.dataset.swiped = 'false';
      li.dataset.swiping = 'false';
    });
  }

  private updateToastElement(instance: ToastInstance, toast: ToastT): void {
    const { element: li } = instance;
    instance.toast = toast;

    // Update type
    li.dataset.type = toast.type || '';

    // Update title
    const titleEl = li.querySelector('[data-title]');
    if (titleEl) {
      titleEl.textContent = toast.title || '';
    }

    // Update description
    let descEl = li.querySelector('[data-description]');
    if (toast.description) {
      if (!descEl) {
        descEl = document.createElement('div');
        descEl.setAttribute('data-description', '');
        li.querySelector('[data-content]')?.appendChild(descEl);
      }
      descEl.textContent = toast.description;
    } else if (descEl) {
      descEl.remove();
    }

    // Update icon if type changed
    const iconEl = li.querySelector('[data-icon]');
    if (iconEl && toast.type && toast.type !== 'loading') {
      const asset = getAsset(toast.type);
      if (asset) {
        iconEl.innerHTML = asset;
      }
    }

    // Restart timer for non-loading types
    if (toast.type !== 'loading') {
      instance.remainingTime = toast.duration ?? this.options.duration;
      this.startTimer(instance);
    }
  }

  private startTimer(instance: ToastInstance): void {
    const { toast } = instance;
    if (toast.promise && toast.type === 'loading') return;
    if (toast.duration === Infinity || toast.type === 'loading') return;
    if (this.expanded || this.interacting || this.isDocumentHidden) return;

    clearTimeout(instance.closeTimeout);
    instance.closeTimerStart = Date.now();

    instance.closeTimeout = setTimeout(() => {
      toast.onAutoClose?.(toast);
      this.removeToast(toast);
    }, instance.remainingTime);
  }

  private pauseTimer(instance: ToastInstance): void {
    if (instance.closeTimerStart > 0) {
      const elapsed = Date.now() - instance.closeTimerStart;
      instance.remainingTime = Math.max(0, instance.remainingTime - elapsed);
    }
    clearTimeout(instance.closeTimeout);
  }

  private dismissToast(id: number | string): void {
    const instance = this.toastInstances.get(id);
    if (instance) {
      instance.element.dataset.removed = 'true';
      this.removeToast(instance.toast);
    }
  }

  private removeToast(toast: ToastT): void {
    const instance = this.toastInstances.get(toast.id);
    if (!instance || instance.removed) return;

    instance.removed = true;
    instance.element.dataset.removed = 'true';
    clearTimeout(instance.closeTimeout);

    // Remove from heights
    this.heights = this.heights.filter((h) => h.toastId !== toast.id);

    setTimeout(() => {
      instance.element.remove();
      this.toastInstances.delete(toast.id);
      ToastState.dismiss(toast.id);
      this.updatePositions();
    }, TIME_BEFORE_UNMOUNT);

    this.updatePositions();
  }

  private updatePositions(): void {
    const toasts = Array.from(this.toastInstances.values()).filter((i) => !i.removed);
    const { visibleToasts, gap } = this.options;

    let heightBefore = 0;

    toasts.forEach((instance, index) => {
      const { element: li } = instance;
      const isFront = index === 0;
      const isVisible = index < visibleToasts;

      li.dataset.index = String(index);
      li.dataset.front = String(isFront);
      li.dataset.visible = String(isVisible);

      const offset = index * gap + heightBefore;
      instance.offset = offset;

      li.style.setProperty('--index', String(index));
      li.style.setProperty('--toasts-before', String(index));
      li.style.setProperty('--z-index', String(toasts.length - index));
      li.style.setProperty('--offset', `${offset}px`);
      li.style.setProperty('--initial-height', `${instance.height}px`);

      heightBefore += instance.height;
    });

    // Update front toast height
    if (this.listEl && toasts.length > 0) {
      this.listEl.style.setProperty('--front-toast-height', `${toasts[0].height}px`);
    }
  }
}

// Factory function for easier usage
export function createToaster(options?: ToasterOptions): Toaster {
  return new Toaster(options);
}
