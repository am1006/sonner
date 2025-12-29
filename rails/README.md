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
| `data-toast-type-value` | String | No | `'default'`, `'success'`, `'error'`, `'warning'`, `'info'`, `'loading'` |
| `data-toast-message-value` | String | Yes | Toast message |
| `data-toast-description-value` | String | No | Additional description |
| `data-toast-duration-value` | Number | No | Duration in ms |
| `data-toast-dismissible-value` | Boolean | No | Can be dismissed (default: `true`) |
| `data-toast-close-button-value` | Boolean | No | Show close button |
| `data-toast-position-value` | String | No | Override position |
| `data-toast-id-value` | String | No | Custom toast ID |

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
