# Frappe UI Notes

Project-local notes for Frappe UI components we use in this app.

## Card

A standardized container for grouping related content. Use it for form sections, dashboard widgets, settings blocks, and any UI that needs a consistent card shell with optional heading text and actions.

### Example

```vue
<script setup lang="ts">
import { Button, Card } from "frappe-ui";
</script>

<template>
  <Card
    title="Create account"
    subtitle="Start a project workspace with a few basic account details."
  >
    <template #actions>
      <Button>Help</Button>
    </template>

    <form class="space-y-4">
      <!-- FormControl, Password, Checkbox, etc. -->
    </form>
  </Card>
</template>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `undefined` | Main heading rendered at the top of the card. |
| `subtitle` | `string` | `undefined` | Supporting text rendered below the title. |
| `loading` | `boolean` | `false` | Shows the built-in loading state and hides default content. |

### Slots

| Slot | Purpose |
| --- | --- |
| `default` | Main card content. |
| `actions` | Right-side header actions. |
| `actions-left` | Left-side actions before the title. |

### Usage Notes

- Prefer `Card` over hand-rolled `div` wrappers for card-like containers.
- Let `Card` own its base padding, border, radius, and shadow.
- Use `title` and `subtitle` instead of custom heading blocks when possible.
- Use the `actions` slot for buttons like edit, save, filter, or help.
- Use `loading` when the card content depends on async data.

### Current App Usage

The auth playground pages use `Card` as the primary container:

- `app/pages/index.vue`
- `app/pages/login.vue`
- `app/pages/signup.vue`
