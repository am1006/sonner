/**
 * Type definitions for sonner-vanilla
 * Vanilla JS port of sonner's types
 */

export type ToastTypes = 'normal' | 'action' | 'success' | 'info' | 'warning' | 'error' | 'loading' | 'default';

export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export type SwipeDirection = 'top' | 'right' | 'bottom' | 'left';

export type Theme = 'light' | 'dark' | 'system';

export interface ToastClassnames {
  toast?: string;
  title?: string;
  description?: string;
  loader?: string;
  closeButton?: string;
  cancelButton?: string;
  actionButton?: string;
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
  loading?: string;
  default?: string;
  content?: string;
  icon?: string;
}

export interface Action {
  label: string;
  onClick: (event: MouseEvent) => void;
}

// Custom content can be HTML string, HTMLElement, or a builder function
export type CustomContent = string | HTMLElement | ((id: number | string) => HTMLElement);

export interface ToastT {
  id: number | string;
  toasterId?: string;
  title?: string;
  type?: ToastTypes;
  // Custom content replaces the default toast structure
  custom?: CustomContent;
  icon?: string | HTMLElement;
  richColors?: boolean;
  invert?: boolean;
  closeButton?: boolean;
  dismissible?: boolean;
  description?: string;
  duration?: number;
  delete?: boolean;
  action?: Action;
  cancel?: Action;
  onDismiss?: (toast: ToastT) => void;
  onAutoClose?: (toast: ToastT) => void;
  promise?: PromiseT;
  cancelButtonStyle?: Partial<CSSStyleDeclaration>;
  actionButtonStyle?: Partial<CSSStyleDeclaration>;
  style?: Partial<CSSStyleDeclaration>;
  unstyled?: boolean;
  className?: string;
  classNames?: ToastClassnames;
  descriptionClassName?: string;
  position?: Position;
  testId?: string;
}

export interface ToastToDismiss {
  id: number | string;
  dismiss: boolean;
}

export type ExternalToast = Omit<ToastT, 'id' | 'type' | 'title' | 'delete' | 'promise'> & {
  id?: number | string;
  toasterId?: string;
};

export type PromiseT<Data = unknown> = Promise<Data> | (() => Promise<Data>);

export type PromiseTResult<Data = unknown> = string | ((data: Data) => string | Promise<string>);

export interface PromiseData<ToastData = unknown> {
  loading?: string;
  success?: PromiseTResult<ToastData>;
  error?: PromiseTResult<unknown>;
  description?: PromiseTResult<unknown>;
  finally?: () => void | Promise<void>;
  id?: number | string;
}

export interface HeightT {
  height: number;
  toastId: number | string;
  position: Position;
}

export type Offset =
  | {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
    }
  | string
  | number;

export interface ToasterOptions {
  id?: string;
  invert?: boolean;
  theme?: Theme;
  position?: Position;
  hotkey?: string[];
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  closeButton?: boolean;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  offset?: Offset;
  mobileOffset?: Offset;
  dir?: 'rtl' | 'ltr' | 'auto';
  swipeDirections?: SwipeDirection[];
  containerAriaLabel?: string;
  toastOptions?: {
    className?: string;
    closeButton?: boolean;
    descriptionClassName?: string;
    style?: Partial<CSSStyleDeclaration>;
    cancelButtonStyle?: Partial<CSSStyleDeclaration>;
    actionButtonStyle?: Partial<CSSStyleDeclaration>;
    duration?: number;
    unstyled?: boolean;
    classNames?: ToastClassnames;
  };
}

export function isAction(action: Action | unknown): action is Action {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action;
}
