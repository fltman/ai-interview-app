# UI Components

Mobile-optimized, touch-friendly React components built with TypeScript and Tailwind CSS.

## Overview

All components follow these principles:
- **Mobile-first**: Designed for touch interactions with minimum 44x44px touch targets
- **Accessible**: WCAG 2.1 compliant with proper ARIA attributes
- **Performant**: Optimized animations and transitions
- **Touch-optimized**: `touch-manipulation` CSS for faster tap response
- **Responsive**: Adapts from mobile to desktop seamlessly

## Installation

Components are already available in this project. Import from:

```tsx
import { Button, Input, Card, useToast } from '@/components/ui';
```

## Components

### Button

Touch-friendly button with multiple variants and states.

```tsx
import { Button } from '@/components/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes (lg has 52px height for better touch)
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>

// With icons (from lucide-react)
import { Mic } from 'lucide-react';
<Button icon={<Mic />}>Record</Button>
<Button icon={<Settings />} iconPosition="right">Settings</Button>

// States
<Button loading>Processing...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `fullWidth`: boolean
- `icon`: ReactNode
- `iconPosition`: 'left' | 'right'

---

### Input & Textarea

Touch-friendly form inputs with labels, errors, and helper text.

```tsx
import { Input, Textarea } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  helperText="We'll never share your email"
/>

<Input
  label="Name"
  error="This field is required"
/>

<Textarea
  label="Description"
  rows={4}
  placeholder="Enter description"
  helperText="Max 500 characters"
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `fullWidth`: boolean (default: true)

---

### Select

Native select with custom styling for mobile.

```tsx
import { Select } from '@/components/ui';

<Select
  label="Choose option"
  placeholder="Select..."
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3', disabled: true },
  ]}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `options`: SelectOption[]
- `placeholder`: string

---

### Card

Container component with header, body, and footer slots.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <h2>Card Title</h2>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Interactive card
<Card interactive hover onClick={() => console.log('clicked')}>
  <CardBody>Clickable card</CardBody>
</Card>
```

**Props:**
- `hover`: boolean - Add hover effect
- `interactive`: boolean - Add click/active states

---

### Modal

Bottom sheet on mobile, centered dialog on desktop.

```tsx
import { Modal, ModalBody, ModalFooter } from '@/components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <ModalBody>
    <p>Modal content</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

**Features:**
- Bottom sheet style on mobile with handle bar
- Centered dialog on desktop
- ESC key to close
- Focus trap
- Backdrop click to close (configurable)
- Prevents body scroll

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg'
- `closeOnBackdropClick`: boolean (default: true)
- `showCloseButton`: boolean (default: true)

---

### Toast

Global toast notification system with multiple variants.

```tsx
import { ToastProvider, useToast } from '@/components/ui';

// In your App.tsx
<ToastProvider>
  <YourApp />
</ToastProvider>

// In any component
const toast = useToast();

toast.success('Success message!');
toast.error('Error message!');
toast.warning('Warning message!');
toast.info('Info message!');

// Custom duration (default: 5000ms)
toast.success('Saved!', 3000);
```

**Features:**
- Auto-dismiss with timer
- Manual dismiss
- Stack multiple toasts
- Mobile-optimized positioning
- Animated entrance/exit

---

### AudioWaveform & AudioVisualizer

Visual feedback for audio recording/playback.

```tsx
import { AudioWaveform, AudioVisualizer, PulseIndicator } from '@/components/ui';

// Basic waveform
<AudioWaveform state="listening" barCount={5} />
<AudioWaveform state="speaking" barCount={7} />

// Complete visualizer with background
<AudioVisualizer
  isRecording={true}
  isSpeaking={false}
  size="lg"
/>

// Recording indicator
<PulseIndicator
  isActive={isRecording}
  size="lg"
  color="danger"
/>
```

**States:**
- `idle`: Static bars
- `listening`: Gentle wave animation
- `speaking`: Energetic animation

**Sizes:** 'sm' | 'md' | 'lg'

---

### ProgressBar & StepIndicator

Show progress and multi-step processes.

```tsx
import { ProgressBar, StepIndicator, CircularProgress } from '@/components/ui';

// Linear progress
<ProgressBar
  value={65}
  max={100}
  showLabel
  label="Upload Progress"
  color="primary"
/>

// Step indicator
<StepIndicator
  steps={['Settings', 'Interview', 'Review', 'Export']}
  currentStep={2}
/>

// Circular progress
<CircularProgress
  value={75}
  showLabel
  label="Complete"
/>
```

**Colors:** 'primary' | 'success' | 'warning' | 'danger'

---

### Skeleton

Loading placeholders for better perceived performance.

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  SkeletonForm,
  SkeletonAvatar
} from '@/components/ui';

// Basic skeleton
<Skeleton variant="text" width="100%" />
<Skeleton variant="rectangular" height={200} />
<Skeleton variant="circular" width={40} height={40} />

// Pre-built patterns
<SkeletonText lines={3} />
<SkeletonCard />
<SkeletonList items={5} />
<SkeletonForm fields={4} />
<SkeletonAvatar size="lg" />
```

**Variants:** 'text' | 'rectangular' | 'circular'

**Animation:** 'pulse' | 'wave' | 'none'

---

## Mobile-First Best Practices

### Touch Targets
All interactive elements meet the 44x44px minimum:
- Buttons: `min-h-touch` (44px) by default
- Large buttons: `min-h-[52px]` for primary actions
- Input fields: `min-h-touch` (44px)

### Responsive Breakpoints
```tsx
// Mobile-first approach
<div className="flex flex-col sm:flex-row gap-4">
  {/* Stacked on mobile, row on tablet+ */}
</div>
```

Breakpoints:
- `xs`: 375px (small phones)
- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)

### Safe Areas (iOS notch support)
```tsx
<div className="pt-safe pb-safe">
  {/* Content respects iOS safe areas */}
</div>
```

### Touch Optimization
All components include:
- `touch-manipulation` - Disables double-tap zoom
- `select-none` - Prevents text selection on buttons
- Active/pressed states for tactile feedback
- Haptic-friendly animations (reduced motion respected)

---

## Accessibility

All components include:
- Proper ARIA attributes
- Keyboard navigation support
- Focus-visible rings (not on mouse click)
- Screen reader friendly labels
- Error announcements
- Semantic HTML

### Focus Management
```tsx
// Visible focus rings only for keyboard
.focus-visible:ring-2
```

---

## Styling Conventions

### Colors
Primary color: `primary-500` (defined in tailwind.config.js)

```tsx
// Semantic colors
bg-primary-500    // Main brand color
bg-green-500      // Success
bg-red-500        // Error/Danger
bg-yellow-500     // Warning
bg-blue-500       // Info
```

### Spacing
Use gap utilities instead of margins:
```tsx
<div className="flex gap-4">
  <Button>One</Button>
  <Button>Two</Button>
</div>
```

### Transitions
Standard duration: `duration-200` or `duration-300`

```tsx
transition-all duration-200
```

---

## Examples

See `ComponentShowcase.tsx` for a complete demo of all components.

To view the showcase, import it in your app:

```tsx
import { ComponentShowcase } from '@/components/ui/ComponentShowcase';

// Add route or render directly
<ComponentShowcase />
```

---

## TypeScript

All components are fully typed with TypeScript. Import types as needed:

```tsx
import type { ButtonProps, ButtonVariant, ToastVariant } from '@/components/ui';
```

---

## Performance Tips

1. **Use Skeleton loaders** - Better perceived performance than spinners
2. **Lazy load modals** - Only render when open
3. **Debounce input changes** - Especially for search/filter
4. **Memoize expensive renders** - Use React.memo for heavy components

---

## Browser Support

- iOS Safari 14+
- Chrome for Android 90+
- Desktop browsers (evergreen)

---

## Contributing

When adding new components:
1. Follow mobile-first design
2. Include TypeScript types
3. Add to index.ts exports
4. Document props and usage
5. Test on real mobile devices
6. Verify WCAG 2.1 compliance
