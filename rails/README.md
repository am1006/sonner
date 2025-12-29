# Sonner for Rails

A vanilla JavaScript port of the [Sonner](https://sonner.emilkowal.ski/) toast library, designed for Rails applications using Hotwire (Turbo + Stimulus).

## Packages

| Package | Description |
|---------|-------------|
| [sonner-vanilla](./packages/vanilla) | Core vanilla JS toast library (no dependencies) |
| [sonner-stimulus](./packages/stimulus) | Stimulus controllers for Rails integration |

## Quick Start for Rails

### Step 1: Install the packages

**Using npm/yarn:**

```bash
npm install sonner-vanilla sonner-stimulus
# or
yarn add sonner-vanilla sonner-stimulus
```

**Using importmaps:**

```bash
bin/importmap pin sonner-vanilla sonner-stimulus
```

### Step 2: Import the CSS

Add to your `app/assets/stylesheets/application.css`:

```css
@import "sonner-vanilla/styles.css";
```

Or in your layout:

```erb
<%= stylesheet_link_tag "sonner-vanilla/styles.css" %>
```

### Step 3: Register Stimulus controllers

```javascript
// app/javascript/controllers/index.js
import { application } from "./application";
import SonnerControllers from "sonner-stimulus";

// Register all controllers at once
application.register("toaster", SonnerControllers.toaster);
application.register("toast", SonnerControllers.toast);
application.register("toast-dismiss", SonnerControllers["toast-dismiss"]);

// Or import individually
// import { ToasterController, ToastController, ToastDismissController } from "sonner-stimulus";
// application.register("toaster", ToasterController);
// application.register("toast", ToastController);
// application.register("toast-dismiss", ToastDismissController);
```

### Step 4: Add the toaster to your layout

```erb
<%# app/views/layouts/application.html.erb %>
<!DOCTYPE html>
<html>
<head>
  <!-- ... -->
</head>
<body>
  <%# Add the toaster container %>
  <div data-controller="toaster"
       data-toaster-position-value="bottom-right"
       data-toaster-theme-value="light"
       data-toaster-rich-colors-value="true"
       data-toaster-close-button-value="false">
  </div>

  <%# Flash message container %>
  <div id="flash">
    <%= render "shared/flash" %>
  </div>

  <%= yield %>
</body>
</html>
```

### Step 5: Create a flash partial

```erb
<%# app/views/shared/_flash.html.erb %>
<% flash.each do |type, message| %>
  <%
    toast_type = case type.to_s
                 when 'notice', 'success' then 'success'
                 when 'alert', 'error' then 'error'
                 when 'warning' then 'warning'
                 when 'info' then 'info'
                 else 'default'
                 end
  %>
  <div data-controller="toast"
       data-toast-type-value="<%= toast_type %>"
       data-toast-message-value="<%= message %>">
  </div>
<% end %>
```

That's it! Your Rails app now has toast notifications.

---

## Usage Examples

### Basic Flash Messages

Flash messages work automatically with the setup above:

```ruby
# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  def create
    @post = Post.new(post_params)
    if @post.save
      redirect_to @post, notice: "Post created successfully!"
    else
      flash.now[:error] = "Failed to create post"
      render :new, status: :unprocessable_entity
    end
  end
end
```

### Turbo Stream Toasts

Show toasts in response to Turbo Stream actions:

```erb
<%# app/views/posts/create.turbo_stream.erb %>
<%= turbo_stream.append "flash" do %>
  <div data-controller="toast"
       data-toast-type-value="success"
       data-toast-message-value="Post created!"
       data-toast-description-value="Your post is now live.">
  </div>
<% end %>

<%= turbo_stream.prepend "posts", @post %>
```

### Toast with Duration

```erb
<div data-controller="toast"
     data-toast-type-value="info"
     data-toast-message-value="This will disappear in 10 seconds"
     data-toast-duration-value="10000">
</div>
```

### Non-dismissible Toast

```erb
<div data-controller="toast"
     data-toast-type-value="warning"
     data-toast-message-value="Please complete your profile"
     data-toast-dismissible-value="false">
</div>
```

### Trigger Toast from JavaScript

You can also trigger toasts directly from your Stimulus controllers:

```javascript
// app/javascript/controllers/my_controller.js
import { Controller } from "@hotwired/stimulus";
import { toast } from "sonner-stimulus";

export default class extends Controller {
  save() {
    // ... save logic
    toast.success("Saved!", { description: "Your changes have been saved." });
  }

  delete() {
    toast.error("Deleted", { duration: 5000 });
  }

  async load() {
    toast.promise(fetch("/api/data"), {
      loading: "Loading...",
      success: "Data loaded!",
      error: "Failed to load data",
    });
  }
}
```

### Dismiss Toasts

```erb
<%# Dismiss a specific toast %>
<button data-controller="toast-dismiss"
        data-action="click->toast-dismiss#dismiss"
        data-toast-dismiss-id-value="my-toast-id">
  Dismiss
</button>

<%# Dismiss all toasts %>
<button data-controller="toast-dismiss"
        data-action="click->toast-dismiss#dismissAll">
  Clear All
</button>
```

---

## Helper Module (Optional)

For a more Rails-like API, create a helper module:

```ruby
# app/helpers/toast_helper.rb
module ToastHelper
  def toast_tag(message, type: :default, **options)
    data = {
      controller: "toast",
      toast_type_value: type,
      toast_message_value: message
    }

    data[:toast_description_value] = options[:description] if options[:description]
    data[:toast_duration_value] = options[:duration] if options[:duration]
    data[:toast_dismissible_value] = options[:dismissible] if options.key?(:dismissible)
    data[:toast_position_value] = options[:position] if options[:position]

    tag.div(data: data)
  end
end
```

Usage:

```erb
<%= toast_tag "Hello!", type: :success %>
<%= toast_tag "Error!", type: :error, description: "Something went wrong" %>
<%= toast_tag "Loading...", type: :loading, duration: 10000 %>
```

---

## Turbo Stream Helper (Optional)

Create a custom Turbo Stream action for toasts:

```ruby
# config/initializers/turbo_streams.rb
module TurboStreamsHelper
  def toast(message, type: :default, **options)
    turbo_stream.append("flash") do
      helpers.toast_tag(message, type: type, **options)
    end
  end
end

Turbo::Streams::TagBuilder.include(TurboStreamsHelper)
```

Usage in controllers:

```ruby
# app/controllers/posts_controller.rb
def create
  @post = Post.create(post_params)

  respond_to do |format|
    format.turbo_stream do
      render turbo_stream: [
        turbo_stream.toast("Post created!", type: :success),
        turbo_stream.prepend("posts", @post)
      ]
    end
  end
end
```

---

## Configuration Options

### Toaster Options

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-toaster-position-value` | String | `'bottom-right'` | `'top-left'`, `'top-right'`, `'top-center'`, `'bottom-left'`, `'bottom-right'`, `'bottom-center'` |
| `data-toaster-theme-value` | String | `'light'` | `'light'`, `'dark'`, `'system'` |
| `data-toaster-rich-colors-value` | Boolean | `false` | Colorful backgrounds for toast types |
| `data-toaster-close-button-value` | Boolean | `false` | Show close button |
| `data-toaster-expand-value` | Boolean | `false` | Expand toasts by default |
| `data-toaster-duration-value` | Number | `4000` | Default duration in ms |
| `data-toaster-visible-toasts-value` | Number | `3` | Max visible toasts |
| `data-toaster-gap-value` | Number | `14` | Gap between toasts (px) |
| `data-toaster-offset-value` | String | `'24px'` | Offset from viewport edge |

### Toast Options

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `data-toast-type-value` | String | No | `'default'`, `'success'`, `'error'`, `'warning'`, `'info'`, `'loading'`, or any custom type |
| `data-toast-message-value` | String | Yes | Toast message |
| `data-toast-description-value` | String | No | Additional description |
| `data-toast-duration-value` | Number | No | Duration in ms |
| `data-toast-dismissible-value` | Boolean | No | Can be dismissed (default: `true`) |
| `data-toast-close-button-value` | Boolean | No | Show close button |
| `data-toast-position-value` | String | No | Override position |
| `data-toast-id-value` | String | No | Custom toast ID |

---

## Custom Toast Types

You can create your own toast types beyond the built-in ones (`success`, `error`, `warning`, `info`, `loading`).

### Step 1: Use your custom type

```erb
<%# In your views %>
<div data-controller="toast"
     data-toast-type-value="congrats"
     data-toast-message-value="You did it!">
</div>

<%# Or with the helper %>
<%= toast_tag "Achievement unlocked!", type: :congrats %>
```

```javascript
// In JavaScript
toast.withType('congrats', 'You did it!');
toast.withType('celebration', 'Party time!', { duration: 5000 });
```

### Step 2: Add CSS for your custom type

```css
/* app/assets/stylesheets/toasts.css */

/* Basic custom type styling */
[data-sonner-toast][data-type="congrats"] {
  --normal-bg: #fef3c7;
  --normal-border: #f59e0b;
  --normal-text: #92400e;
}

/* With rich colors enabled */
[data-rich-colors="true"][data-sonner-toast][data-type="congrats"] {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-color: #d97706;
  color: white;
}

[data-rich-colors="true"][data-sonner-toast][data-type="congrats"] [data-close-button] {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Another example: celebration type */
[data-sonner-toast][data-type="celebration"] {
  --normal-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --normal-text: white;
  border: none;
}
```

### Step 3 (Optional): Add a custom icon

For custom types, you can provide an icon via the `icon` option:

```javascript
// Create a reusable function for your custom type
function congratsToast(message, options = {}) {
  return toast.withType('congrats', message, {
    icon: '🎉',  // or an HTML string: '<svg>...</svg>'
    ...options
  });
}

// Usage
congratsToast('Achievement unlocked!');
```

Or in your Stimulus controller, extend the ToastController:

```javascript
// app/javascript/controllers/custom_toast_controller.js
import { Controller } from "@hotwired/stimulus";
import { toast } from "sonner-stimulus";

export default class extends Controller {
  static values = {
    type: String,
    message: String,
    icon: String,
  }

  connect() {
    const icons = {
      congrats: '🎉',
      celebration: '🎊',
      rocket: '🚀',
    };

    toast.withType(this.typeValue, this.messageValue, {
      icon: this.hasIconValue ? this.iconValue : icons[this.typeValue],
    });

    this.element.remove();
  }
}
```

---

## Styling & CSS Customization

### CSS Variables

Sonner uses CSS variables for theming. Override them in your stylesheet:

```css
/* app/assets/stylesheets/toasts.css */

/* Global toast styling */
[data-sonner-toaster] {
  --width: 356px;
  --gap: 14px;
  --offset: 24px;

  /* Colors */
  --normal-bg: #fff;
  --normal-border: #e5e7eb;
  --normal-text: #1f2937;

  /* Success */
  --success-bg: #ecfdf5;
  --success-border: #10b981;
  --success-text: #065f46;

  /* Error */
  --error-bg: #fef2f2;
  --error-border: #ef4444;
  --error-text: #991b1b;

  /* Warning */
  --warning-bg: #fffbeb;
  --warning-border: #f59e0b;
  --warning-text: #92400e;

  /* Info */
  --info-bg: #eff6ff;
  --info-border: #3b82f6;
  --info-text: #1e40af;
}
```

### Dark Theme

```css
[data-sonner-toaster][data-theme="dark"] {
  --normal-bg: #1f2937;
  --normal-border: #374151;
  --normal-text: #f9fafb;

  --success-bg: #065f46;
  --success-text: #ecfdf5;

  --error-bg: #991b1b;
  --error-text: #fef2f2;
}
```

### Rich Colors

When `richColors` is enabled, toasts have more vibrant backgrounds:

```css
/* Customize rich color variants */
[data-rich-colors="true"][data-sonner-toast][data-type="success"] {
  background: #10b981;
  border-color: #059669;
  color: white;
}

[data-rich-colors="true"][data-sonner-toast][data-type="error"] {
  background: #ef4444;
  border-color: #dc2626;
  color: white;
}
```

### Toast Parts

Style specific parts of the toast:

```css
/* Toast container */
[data-sonner-toast] {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Title */
[data-sonner-toast] [data-title] {
  font-weight: 600;
  font-size: 14px;
}

/* Description */
[data-sonner-toast] [data-description] {
  font-size: 13px;
  opacity: 0.8;
}

/* Close button */
[data-sonner-toast] [data-close-button] {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

[data-sonner-toast] [data-close-button]:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Action buttons */
[data-sonner-toast] [data-button] {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
}

[data-sonner-toast] [data-action] {
  background: #1f2937;
  color: white;
}

[data-sonner-toast] [data-cancel] {
  background: transparent;
  border: 1px solid #e5e7eb;
}

/* Icon container */
[data-sonner-toast] [data-icon] {
  width: 20px;
  height: 20px;
}

/* Loading spinner */
[data-sonner-toast] .sonner-spinner {
  /* Customize spinner */
}
```

### Position-Based Styling

```css
/* Style toasts differently based on position */
[data-y-position="top"] [data-sonner-toast] {
  /* Top toasts */
}

[data-y-position="bottom"] [data-sonner-toast] {
  /* Bottom toasts */
}

[data-x-position="center"] [data-sonner-toast] {
  /* Center-aligned toasts */
}
```

### Animation Customization

```css
/* Custom enter animation */
[data-sonner-toast][data-mounted="true"] {
  animation: slideIn 0.3s ease-out;
}

/* Custom exit animation */
[data-sonner-toast][data-removed="true"] {
  animation: slideOut 0.2s ease-in forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
```

### Data Attributes Reference

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-sonner-toast` | - | Present on all toasts |
| `data-type` | `success`, `error`, `warning`, `info`, `loading`, or custom | Toast type |
| `data-rich-colors` | `true`, `false` | Rich colors enabled |
| `data-styled` | `true`, `false` | Default styling applied |
| `data-mounted` | `true`, `false` | Toast is mounted/visible |
| `data-removed` | `true`, `false` | Toast is being removed |
| `data-expanded` | `true`, `false` | Toast stack is expanded |
| `data-front` | `true`, `false` | Is the frontmost toast |
| `data-swiping` | `true`, `false` | Currently being swiped |
| `data-swipe-out` | `true`, `false` | Being swiped out |
| `data-y-position` | `top`, `bottom` | Vertical position |
| `data-x-position` | `left`, `right`, `center` | Horizontal position |
| `data-dismissible` | `true`, `false` | Can be dismissed |
| `data-invert` | `true`, `false` | Colors inverted |

---

## Custom Content

For fully custom toast content, use the vanilla API:

```javascript
import { toast } from "sonner-stimulus";

// HTML string
toast.custom('<div class="my-custom-toast">Custom content!</div>');

// HTMLElement
const el = document.createElement('div');
el.innerHTML = '<strong>Bold</strong> message';
toast.custom(el);

// Builder function (receives toast ID for dismiss handling)
toast.custom((id) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <span>Custom toast</span>
    <button onclick="window.toast.dismiss('${id}')">Close</button>
  `;
  return div;
});
```

---

## License

MIT
