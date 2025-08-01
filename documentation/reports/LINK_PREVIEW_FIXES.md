# Link Preview Fixes

## Issue
Link previews were timing out while typing URLs in the message input, even though link previews should only appear on sent messages.

## Root Cause
The timeouts were actually coming from OLD messages in the chat history that contained invalid URLs (like `https://1.0.0`, `https://e.g.`, etc.), not from the current input being typed.

## Solutions Implemented

### 1. Enhanced URL Validation
- Added stricter URL validation in `url-utils.ts`
- Filters out version numbers, dates, localhost URLs
- Validates proper domain format with regex

### 2. Message State Checks
- Only extract URLs from messages that:
  - Have been saved (have messageId or _id)
  - Are not currently streaming
  - Have a createdAt timestamp

### 3. LinkPreview Component Improvements
- Reduced timeout from 10s to 3s to fail faster
- Removed console logging to reduce noise
- Added URL cache to prevent repeated attempts on failed URLs
- Skip preview for problematic domains (localhost, 127.0.0.1, etc.)

### 4. Error Handling
- Silent failures (no console errors)
- Fallback to simple link display
- Cache failed URLs to prevent retries

## Result
- Link previews only appear on saved messages
- Invalid URLs fail quickly and silently
- No more timeout errors while typing
- Better performance with URL caching