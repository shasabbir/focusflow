# FocusFlow Extension Icons

This directory should contain the following icon files:

- `icon-16.png` - 16x16 pixels (toolbar icon)
- `icon-32.png` - 32x32 pixels (toolbar icon on high-DPI)
- `icon-48.png` - 48x48 pixels (extension management page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store)

## Creating Icons

You can create these icons using any image editor. The icons should:

1. Have a timer/clock theme to represent the Pomodoro functionality
2. Use a consistent color scheme (recommended: blue #3b82f6)
3. Be easily recognizable at small sizes
4. Have transparent backgrounds for the smaller sizes

## Temporary Solution

For testing purposes, you can:

1. Copy the existing favicon.ico from the Next.js app
2. Convert it to PNG format in multiple sizes
3. Or use any generic timer/clock icon

## Generating Icons Programmatically

Run the `generate-icons.js` script in a browser console to create basic icons:

```bash
# Open generate-icons.js in a browser and run it
# It will generate and download the icon files
```

The generated icons will have a simple blue circle with a clock design.
