# Using sonner-stimulus in Rails (Vendor Locally)

This guide shows how to use sonner-stimulus in a Rails application by vendoring the files locally. No npm publishing required.

Note: you can now use `bin/importmap pin stimulus-sonner` to pin the module in your importmap. I've already published it.

## Step 1: Copy the built files

From the sonner-stimulus package, copy the dist files to your Rails app:

```bash
# Copy JavaScript to vendor/javascript
cp path/to/sonner-stimulus/dist/index.js your_rails_app/vendor/javascript/sonner-stimulus.js

# Copy CSS to stylesheets
cp path/to/sonner-stimulus/dist/styles.css your_rails_app/app/assets/stylesheets/sonner.css
```

## Step 2: Pin the module in importmap

Add to `config/importmap.rb`:

```ruby
pin "sonner-stimulus", to: "sonner-stimulus.js"
```

## Step 3: Import the CSS

In `app/assets/stylesheets/application.css`:

```css
/*
 *= require sonner
 *= require_self
 */
```

Or if using Sass/SCSS (`application.scss`):

```scss
@import "sonner";
```

## Step 4: Register the Stimulus controllers

In `app/javascript/controllers/index.js`:

```javascript
import { application } from "./application"

// Import and register sonner-stimulus controllers
import controllers from "sonner-stimulus"

Object.entries(controllers).forEach(([name, controller]) => {
  application.register(name, controller)
})
```

This registers three controllers:
- `toaster` - The container that renders toasts
- `toast` - Triggers a toast notification (auto-removes itself)
- `toast-dismiss` - Dismisses toasts by ID or all toasts

## Step 5: Add the Toaster to your layout

In `app/views/layouts/application.html.erb`, add the toaster container:

```erb
<body>
  <!-- Add this anywhere in your body -->
  <div data-controller="toaster"
       data-toaster-position-value="bottom-right"
       data-toaster-theme-value="light">
  </div>

  <%= yield %>
</body>
```

### Toaster options (all optional):

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-toaster-position-value` | `"bottom-right"` | Position: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `data-toaster-theme-value` | `"light"` | Theme: `light`, `dark`, `system` |
| `data-toaster-rich-colors-value` | `false` | Enable colorful toasts for different types |
| `data-toaster-close-button-value` | `false` | Show close button on toasts |
| `data-toaster-expand-value` | `false` | Expand toasts by default |
| `data-toaster-duration-value` | `4000` | Default duration in milliseconds |
| `data-toaster-visible-toasts-value` | `3` | Maximum visible toasts |
| `data-toaster-gap-value` | `14` | Gap between toasts in pixels |
| `data-toaster-offset-value` | `"24px"` | Offset from viewport edge |

## Usage

### Method 1: Trigger toasts from HTML (Turbo-friendly)

The toast controller auto-triggers and removes itself - perfect for flash messages:

```erb
<!-- In your view or partial -->
<div data-controller="toast"
     data-toast-type-value="success"
     data-toast-message-value="Item saved successfully!"
     data-toast-description-value="Your changes have been saved.">
</div>
```

#### Flash messages helper

Create a partial at `app/views/shared/_flash.html.erb`:

```erb
<% flash.each do |type, message| %>
  <% toast_type = case type.to_s
                  when 'notice' then 'success'
                  when 'alert' then 'error'
                  else type.to_s
                  end %>
  <div data-controller="toast"
       data-toast-type-value="<%= toast_type %>"
       data-toast-message-value="<%= message %>">
  </div>
<% end %>
```

Then render it in your layout:

```erb
<body>
  <div data-controller="toaster"></div>
  <%= render "shared/flash" %>
  <%= yield %>
</body>
```

#### Toast options:

| Attribute | Description |
|-----------|-------------|
| `data-toast-type-value` | `default`, `success`, `error`, `warning`, `info`, `loading` |
| `data-toast-message-value` | The main message (required) |
| `data-toast-description-value` | Additional description text |
| `data-toast-duration-value` | Duration in ms (overrides toaster default) |
| `data-toast-dismissible-value` | Whether toast can be swiped away |
| `data-toast-position-value` | Override position for this toast |
| `data-toast-id-value` | Custom ID (useful for updating/dismissing) |

### Method 2: Trigger toasts from JavaScript

Import and use the `toast` function directly:

```javascript
import { toast } from "sonner-stimulus"

// Basic usage
toast("Hello, world!")

// With type
toast.success("Item saved!")
toast.error("Something went wrong")
toast.warning("Please check your input")
toast.info("New updates available")
toast.loading("Processing...")

// With options
toast.success("Saved!", {
  description: "Your changes have been saved.",
  duration: 5000,
})

// Dismiss a toast
const id = toast.success("Hello")
toast.dismiss(id)

// Dismiss all toasts
toast.dismiss()
```

### Method 3: Dismiss button

Add a dismiss button anywhere:

```erb
<!-- Dismiss a specific toast -->
<button data-controller="toast-dismiss"
        data-toast-dismiss-id-value="my-toast-id"
        data-action="click->toast-dismiss#dismiss">
  Dismiss
</button>

<!-- Dismiss all toasts -->
<button data-controller="toast-dismiss"
        data-action="click->toast-dismiss#dismissAll">
  Dismiss All
</button>
```

## Examples

### Success toast after form submission

```erb
<%= form_with model: @item, data: { turbo_frame: "_top" } do |f| %>
  <!-- form fields -->
  <%= f.submit "Save" %>
<% end %>

<!-- In controller: redirect_to items_path, notice: "Item created!" -->
<!-- The flash partial will render the toast automatically -->
```

### Loading toast with promise (JavaScript)

```javascript
import { toast } from "sonner-stimulus"

async function saveData() {
  toast.promise(
    fetch("/api/save", { method: "POST" }),
    {
      loading: "Saving...",
      success: "Saved successfully!",
      error: "Failed to save",
    }
  )
}
```

### Custom styled toast

```erb
<div data-controller="toast"
     data-toast-type-value="success"
     data-toast-message-value="Welcome back!"
     data-toast-rich-colors-value="true"
     data-toast-close-button-value="true">
</div>
```
