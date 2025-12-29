# Sonner Stimulus

Stimulus controllers for [Sonner](https://sonner.emilkowal.ski/) toast notifications. Built on top of [sonner-vanilla](../vanilla).

> **For complete Rails setup:** See the main [rails README](../../README.md).

## Installation

```bash
npm install sonner-stimulus
# or
yarn add sonner-stimulus
```

This package has `sonner-vanilla` as a dependency and `@hotwired/stimulus` as a peer dependency.

## Setup

### Register Controllers

```javascript
// app/javascript/controllers/index.js
import { application } from "./application";
import SonnerControllers from "sonner-stimulus";

application.register("toaster", SonnerControllers.toaster);
application.register("toast", SonnerControllers.toast);
application.register("toast-dismiss", SonnerControllers["toast-dismiss"]);
```

Or import individually:

```javascript
import { ToasterController, ToastController, ToastDismissController } from "sonner-stimulus";

application.register("toaster", ToasterController);
application.register("toast", ToastController);
application.register("toast-dismiss", ToastDismissController);
```

### Import Styles

```css
@import "sonner-stimulus/styles.css";
```

## Controllers

### ToasterController

Creates the toast container. Add once to your layout.

```html
<div data-controller="toaster"
     data-toaster-position-value="bottom-right"
     data-toaster-theme-value="light"
     data-toaster-rich-colors-value="true"
     data-toaster-close-button-value="false"
     data-toaster-expand-value="false"
     data-toaster-duration-value="4000"
     data-toaster-visible-toasts-value="3"
     data-toaster-gap-value="14"
     data-toaster-offset-value="24px">
</div>
```

#### Values

| Value | Type | Default | Description |
|-------|------|---------|-------------|
| `position` | String | `'bottom-right'` | Position: `'top-left'`, `'top-right'`, `'top-center'`, `'bottom-left'`, `'bottom-right'`, `'bottom-center'` |
| `theme` | String | `'light'` | Theme: `'light'`, `'dark'`, `'system'` |
| `richColors` | Boolean | `false` | Colorful backgrounds for toast types |
| `closeButton` | Boolean | `false` | Show close button on toasts |
| `expand` | Boolean | `false` | Expand toasts by default |
| `duration` | Number | `4000` | Default duration in milliseconds |
| `visibleToasts` | Number | `3` | Maximum visible toasts |
| `gap` | Number | `14` | Gap between toasts in pixels |
| `offset` | String | `'24px'` | Offset from viewport edge |

---

### ToastController

Displays a toast message. The element removes itself after showing the toast.

```html
<div data-controller="toast"
     data-toast-type-value="success"
     data-toast-message-value="Operation completed!"
     data-toast-description-value="Your changes have been saved.">
</div>
```

#### Values

| Value | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | String | No | `'default'` | Toast type: `'default'`, `'success'`, `'error'`, `'warning'`, `'info'`, `'loading'` |
| `message` | String | **Yes** | - | Toast message |
| `description` | String | No | - | Additional description |
| `duration` | Number | No | - | Duration in milliseconds |
| `dismissible` | Boolean | No | `true` | Can be dismissed by user |
| `richColors` | Boolean | No | - | Override toaster setting |
| `closeButton` | Boolean | No | - | Show close button |
| `position` | String | No | - | Override toaster position |
| `id` | String | No | - | Custom toast ID |

---

### ToastDismissController

Dismisses toasts programmatically.

```html
<!-- Dismiss specific toast -->
<button data-controller="toast-dismiss"
        data-action="click->toast-dismiss#dismiss"
        data-toast-dismiss-id-value="my-toast-id">
  Dismiss
</button>

<!-- Dismiss all toasts -->
<button data-controller="toast-dismiss"
        data-action="click->toast-dismiss#dismissAll">
  Clear All
</button>
```

#### Values

| Value | Type | Description |
|-------|------|-------------|
| `id` | String | Toast ID to dismiss (for `dismiss` action) |

#### Actions

| Action | Description |
|--------|-------------|
| `dismiss` | Dismiss toast with specified ID |
| `dismissAll` | Dismiss all toasts |

---

## Using toast() in JavaScript

The `toast` function is re-exported for use in your own Stimulus controllers:

```javascript
import { Controller } from "@hotwired/stimulus";
import { toast } from "sonner-stimulus";

export default class extends Controller {
  greet() {
    toast.success("Hello!", { description: "Welcome back." });
  }

  async save() {
    toast.promise(this.saveData(), {
      loading: "Saving...",
      success: "Saved!",
      error: "Failed to save",
    });
  }

  saveData() {
    return fetch("/api/save", { method: "POST" });
  }
}
```

## License

MIT
