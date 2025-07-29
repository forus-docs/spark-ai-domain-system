# Link Preview Implementation

## Overview
This document describes the link preview implementation in the chat interface.

## Current Implementation

### Simple Link Preview (Active)
We're currently using `SimpleLinkPreview` component that provides a clean, simple preview without external dependencies:
- Extracts domain from URL
- Shows a link icon
- Displays domain and full URL
- Works immediately without API calls

### Microlink Integration (Active)
The `LinkPreview` component uses Microlink's free API (no key required) to provide rich previews:
- Fetches site metadata automatically
- Shows title, description, and images
- Works with most websites
- Free tier has generous limits for most use cases

## How It Works

1. **URL Detection**: 
   - Extracts URLs from message text (with or without protocol)
   - `www.forus.digital` becomes `https://www.forus.digital`

2. **Message Rendering**:
   - Text and URLs are rendered separately
   - URLs appear on new lines with preview cards
   - Markdown is still supported for text portions

3. **Preview Display**:
   - Simple preview shows domain and URL in a card
   - Microlink preview (when enabled) shows:
     - Site title and description
     - Preview image
     - Site logo
     - Rich metadata

## Files Involved

- `/app/lib/url-utils.ts` - URL extraction and validation
- `/app/components/chatscope/message-content.tsx` - Message rendering logic
- `/app/components/chatscope/simple-link-preview.tsx` - Simple preview component
- `/app/components/chatscope/link-preview.tsx` - Microlink preview component

## Switching Between Preview Styles

To switch back to simple previews (if needed):

Update `message-content.tsx` line 65:
```tsx
// Change from:
<LinkPreview url={part.content} />
// To:
<SimpleLinkPreview url={part.content} />
```

## Known Limitations

- Microlink free tier has rate limits
- Some sites block preview extraction
- CORS issues may occur with certain domains
- Preview loading can take a few seconds