# Stimulus Test

Simple HTML test page for the sonner-stimulus package.

## Running the test

From the `rails` directory, you can serve this test with any static file server:

```bash
# Using Python
python3 -m http.server 8080

# Then open http://localhost:8080/test/stimulus/
```

Or use any other static file server like `npx serve`.

## What's being tested

- **ToasterController**: Initializes the toast container
- **ToastController**: Displays toasts from data attributes (like Rails flash messages)
- **ToastDismissController**: Dismisses toasts
- **toast API**: Direct programmatic toast calls

The test page demonstrates:
1. Different toast types (success, error, warning, info, loading, default)
2. Toasts with descriptions
3. Dismiss functionality
4. Simulated Rails flash messages (how Turbo Streams would append toast triggers)
