# Sonner Vanilla

A vanilla JavaScript port of the [Sonner](https://sonner.emilkowal.ski/) toast library. Zero dependencies.

> **For Rails users:** See the main [rails README](../../README.md) for Hotwire/Stimulus integration.

## Installation

```bash
npm install sonner-vanilla
```

## Usage

```javascript
import { toast, createToaster } from 'sonner-vanilla';
import 'sonner-vanilla/styles.css';

// Initialize the toaster (do this once)
const toaster = createToaster({
  position: 'bottom-right',
  theme: 'light',
  richColors: true,
});
toaster.mount(document.body);

// Show toasts
toast('Hello World');
toast.success('Success!');
toast.error('Something went wrong');
toast.warning('Warning message');
toast.info('Info message');
toast.loading('Loading...');
```

## Toast Types

```javascript
// Default
toast('Default message');
toast.message('Same as default');

// Success
toast.success('Operation completed!');

// Error
toast.error('Something went wrong');

// Warning
toast.warning('Please review your input');

// Info
toast.info('New updates available');

// Loading
const id = toast.loading('Processing...');
// Later, dismiss or update it
toast.dismiss(id);
```

## Toast Options

```javascript
toast.success('Saved!', {
  description: 'Your changes have been saved.',
  duration: 5000,           // Duration in ms (Infinity for persistent)
  dismissible: true,        // Can be dismissed by user
  closeButton: true,        // Show close button
  position: 'top-center',   // Override toaster position
  richColors: true,         // Override toaster richColors
  className: 'my-toast',    // Custom class
  id: 'my-toast-id',        // Custom ID (for updating/dismissing)

  // Callbacks
  onDismiss: (t) => console.log('Dismissed', t),
  onAutoClose: (t) => console.log('Auto closed', t),
});
```

## Action Buttons

```javascript
toast('File deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreFile(),
  },
});

toast('Confirm action', {
  action: {
    label: 'Confirm',
    onClick: () => doSomething(),
  },
  cancel: {
    label: 'Cancel',
    onClick: () => console.log('Cancelled'),
  },
});
```

## Promise Toast

```javascript
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved successfully!',
  error: 'Failed to save',
});

// With dynamic messages
toast.promise(fetchUser(), {
  loading: 'Loading user...',
  success: (user) => `Welcome, ${user.name}!`,
  error: (err) => `Error: ${err.message}`,
});

// Access the promise result
const result = toast.promise(fetchData(), {
  loading: 'Loading...',
  success: 'Done!',
  error: 'Failed',
});

result.unwrap().then(data => {
  console.log('Data:', data);
});
```

## Custom Content

Render completely custom toast content:

```javascript
// HTML string
toast.custom('<div class="my-toast"><strong>Bold</strong> message</div>');

// HTMLElement
const el = document.createElement('div');
el.className = 'custom-toast';
el.innerHTML = '<span>Custom element</span>';
toast.custom(el);

// Builder function (receives toast ID)
toast.custom((id) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <p>Custom toast #${id}</p>
    <button onclick="toast.dismiss('${id}')">Close</button>
  `;
  return div;
});

// With options
toast.custom('<div>Custom</div>', {
  duration: 10000,
  position: 'top-center',
});
```

## Dismissing Toasts

```javascript
// Dismiss by ID
const id = toast.loading('Loading...');
toast.dismiss(id);

// Dismiss all
toast.dismiss();
```

## Updating Toasts

```javascript
const id = toast.loading('Uploading...', { id: 'upload' });

// Update the same toast
toast.success('Upload complete!', { id: 'upload' });
```

## Toaster Options

```javascript
const toaster = createToaster({
  position: 'bottom-right',     // Toast position
  theme: 'light',               // 'light', 'dark', 'system'
  richColors: false,            // Colorful backgrounds
  closeButton: false,           // Show close button
  expand: false,                // Expand toasts by default
  duration: 4000,               // Default duration (ms)
  visibleToasts: 3,             // Max visible toasts
  gap: 14,                      // Gap between toasts (px)
  offset: '24px',               // Offset from viewport
  dir: 'auto',                  // 'ltr', 'rtl', 'auto'
  hotkey: ['altKey', 'KeyT'],   // Keyboard shortcut to focus
  containerAriaLabel: 'Notifications',

  // Default options for all toasts
  toastOptions: {
    className: '',
    duration: 4000,
    closeButton: false,
  },
});
```

## Lifecycle

```javascript
// Mount to a specific element
const toaster = createToaster();
toaster.mount(document.getElementById('toaster-container'));

// Unmount when done
toaster.unmount();
```

## Accessing Toasts

```javascript
// Get all toasts (including dismissed)
const history = toast.getHistory();

// Get active toasts only
const active = toast.getToasts();
```

## Styling

The default styles are included in `sonner-vanilla/styles.css`. You can customize using CSS variables or override the classes.

```css
/* Custom theme example */
[data-sonner-toaster][data-theme="dark"] {
  --normal-bg: #1a1a1a;
  --normal-text: #fff;
}

/* Custom toast styles */
[data-sonner-toast][data-type="success"] {
  --success-bg: #10b981;
  --success-text: #fff;
}
```

## TypeScript

Full TypeScript support is included:

```typescript
import {
  toast,
  createToaster,
  type ToastT,
  type ToasterOptions,
  type ExternalToast,
  type Position,
  type Theme,
} from 'sonner-vanilla';
```

## License

MIT
