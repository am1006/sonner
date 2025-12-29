/**
 * Stimulus controllers for Sonner Vanilla
 * Use with Rails Hotwire to display flash messages as toasts
 */

import { Controller } from '@hotwired/stimulus';
import {
  toast,
  Toaster,
  createToaster,
  type Position,
  type Theme,
  type ToasterOptions,
} from 'sonner-vanilla';

/**
 * Toaster Controller - Initializes the toast container
 *
 * Usage in your HTML:
 * ```html
 * <div data-controller="toaster"
 *      data-toaster-position-value="bottom-right"
 *      data-toaster-theme-value="light"
 *      data-toaster-rich-colors-value="true"
 *      data-toaster-close-button-value="true"
 *      data-toaster-expand-value="false"
 *      data-toaster-duration-value="4000">
 * </div>
 * ```
 */
export class ToasterController extends Controller {
  static values = {
    position: { type: String, default: 'bottom-right' },
    theme: { type: String, default: 'light' },
    richColors: { type: Boolean, default: false },
    closeButton: { type: Boolean, default: false },
    expand: { type: Boolean, default: false },
    duration: { type: Number, default: 4000 },
    visibleToasts: { type: Number, default: 3 },
    gap: { type: Number, default: 14 },
    offset: { type: String, default: '24px' },
  };

  declare positionValue: string;
  declare themeValue: string;
  declare richColorsValue: boolean;
  declare closeButtonValue: boolean;
  declare expandValue: boolean;
  declare durationValue: number;
  declare visibleToastsValue: number;
  declare gapValue: number;
  declare offsetValue: string;

  private toaster: Toaster | null = null;

  connect(): void {
    const options: ToasterOptions = {
      position: this.positionValue as Position,
      theme: this.themeValue as Theme,
      richColors: this.richColorsValue,
      closeButton: this.closeButtonValue,
      expand: this.expandValue,
      duration: this.durationValue,
      visibleToasts: this.visibleToastsValue,
      gap: this.gapValue,
      offset: this.offsetValue,
    };

    this.toaster = createToaster(options);
    this.toaster.mount(this.element as HTMLElement);
  }

  disconnect(): void {
    this.toaster?.unmount();
    this.toaster = null;
  }
}

/**
 * Toast Controller - Displays a toast message
 *
 * Usage in your HTML (for flash messages):
 * ```html
 * <div data-controller="toast"
 *      data-toast-type-value="success"
 *      data-toast-message-value="Your changes have been saved!"
 *      data-toast-description-value="Optional description"
 *      data-toast-duration-value="5000"
 *      data-toast-dismissible-value="true">
 * </div>
 * ```
 *
 * Or with Turbo Streams:
 * ```erb
 * <%= turbo_stream.append "flash" do %>
 *   <div data-controller="toast"
 *        data-toast-type-value="<%= notice ? 'success' : 'error' %>"
 *        data-toast-message-value="<%= notice || alert %>">
 *   </div>
 * <% end %>
 * ```
 */
export class ToastController extends Controller {
  static values = {
    type: { type: String, default: 'default' },
    message: String,
    description: String,
    duration: Number,
    dismissible: { type: Boolean, default: true },
    richColors: Boolean,
    closeButton: Boolean,
    position: String,
    id: String,
  };

  declare typeValue: string;
  declare messageValue: string;
  declare descriptionValue: string;
  declare durationValue: number;
  declare dismissibleValue: boolean;
  declare richColorsValue: boolean;
  declare closeButtonValue: boolean;
  declare positionValue: string;
  declare idValue: string;

  declare hasTypeValue: boolean;
  declare hasMessageValue: boolean;
  declare hasDescriptionValue: boolean;
  declare hasDurationValue: boolean;
  declare hasDismissibleValue: boolean;
  declare hasRichColorsValue: boolean;
  declare hasCloseButtonValue: boolean;
  declare hasPositionValue: boolean;
  declare hasIdValue: boolean;

  connect(): void {
    if (!this.hasMessageValue) {
      console.warn('Toast controller: message value is required');
      return;
    }

    this.showToast();

    // Remove the element after showing toast (it's just a trigger)
    this.element.remove();
  }

  private showToast(): void {
    const options: Record<string, unknown> = {};

    if (this.hasDescriptionValue) options.description = this.descriptionValue;
    if (this.hasDurationValue) options.duration = this.durationValue;
    if (this.hasDismissibleValue) options.dismissible = this.dismissibleValue;
    if (this.hasRichColorsValue) options.richColors = this.richColorsValue;
    if (this.hasCloseButtonValue) options.closeButton = this.closeButtonValue;
    if (this.hasPositionValue) options.position = this.positionValue as Position;
    if (this.hasIdValue) options.id = this.idValue;

    const type = this.typeValue;
    const message = this.messageValue;

    // Built-in types use their specific methods
    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'info':
        toast.info(message, options);
        break;
      case 'loading':
        toast.loading(message, options);
        break;
      case 'default':
      case '':
        toast.message(message, options);
        break;
      default:
        // Custom types (e.g., 'congrats', 'celebration')
        toast.withType(type, message, options);
    }
  }
}

/**
 * Dismiss Controller - Dismisses a specific toast or all toasts
 *
 * Usage:
 * ```html
 * <button data-controller="toast-dismiss"
 *         data-action="click->toast-dismiss#dismiss"
 *         data-toast-dismiss-id-value="my-toast-id">
 *   Dismiss
 * </button>
 *
 * <!-- Dismiss all toasts -->
 * <button data-controller="toast-dismiss"
 *         data-action="click->toast-dismiss#dismissAll">
 *   Dismiss All
 * </button>
 * ```
 */
export class ToastDismissController extends Controller {
  static values = {
    id: String,
  };

  declare idValue: string;
  declare hasIdValue: boolean;

  dismiss(): void {
    if (this.hasIdValue) {
      toast.dismiss(this.idValue);
    }
  }

  dismissAll(): void {
    toast.dismiss();
  }
}

// Re-export toast function for direct use in Stimulus controllers
export { toast };

// Re-export types that users might need
export type { Position, Theme, ToasterOptions };

// Default export for easy registration
export default {
  toaster: ToasterController,
  toast: ToastController,
  'toast-dismiss': ToastDismissController,
};
