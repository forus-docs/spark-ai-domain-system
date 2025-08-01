# Contact Access Libraries Research Report

**Date**: January 23, 2025  
**Project**: Spark AI Domain System  
**Purpose**: Evaluate contact access solutions for "Invite Member" feature

## Executive Summary

This report evaluates reputable libraries and APIs for accessing user contacts in web and mobile applications. The research covers browser-based APIs, mobile-specific solutions, and cross-platform approaches, with a focus on security, privacy, and user experience.

## 1. Web Browser Solutions

### Contact Picker API

**Status**: W3C Working Draft (Last updated July 4, 2025)  
**Browser Support**: 
- Chrome 80+ on Android M or later
- Safari (experimental feature)
- Not yet available on desktop browsers

**Key Features**:
- One-time access model (no persistent permissions)
- Requires user gesture to invoke
- Secure context required (HTTPS only)
- User maintains full control over shared data
- Available properties: name, email, tel, address, icon

**Implementation Example**:
```javascript
// Feature detection
const isSupported = 'contacts' in navigator && 'ContactsManager' in window;

// Basic implementation
async function selectContacts() {
  if (!isSupported) {
    console.log('Contact Picker API not supported');
    return;
  }

  try {
    const props = ['name', 'email', 'tel'];
    const opts = { multiple: true };
    
    // This will show the native contact picker
    const contacts = await navigator.contacts.select(props, opts);
    
    // Process selected contacts
    contacts.forEach(contact => {
      console.log(contact.name, contact.email, contact.tel);
    });
  } catch (error) {
    console.error('Contact selection failed:', error);
  }
}
```

**Security Features**:
- Cannot be called on page load
- Requires explicit user interaction
- Users can deselect specific properties before sharing
- No background access to contacts
- Each access requires new permission

**Limitations**:
- Limited browser support (mainly mobile)
- No desktop browser support yet
- Cannot access contact photos on some platforms

## 2. Google People API

**Status**: Active (replaced deprecated Contacts API)  
**Important Update**: OAuth 2.0 mandatory from March 14, 2025

**Key Features**:
- Full CRUD operations on Google contacts
- Access to personal contacts and domain contacts (Google Workspace)
- Batch operations support
- Contact groups management
- Profile information access

**OAuth 2.0 Scopes**:
```
https://www.googleapis.com/auth/contacts.readonly       // Read contacts
https://www.googleapis.com/auth/contacts                 // Read/write contacts
https://www.googleapis.com/auth/contacts.other.readonly  // Other contacts
https://www.googleapis.com/auth/directory.readonly       // Directory contacts
```

**Implementation Flow**:
1. Register app in Google API Console
2. Obtain OAuth 2.0 credentials
3. Implement OAuth flow in application
4. Request appropriate scopes
5. Use access token to call People API

**API Operations**:
- `people.connections.list` - List user's connections
- `people.get` - Get specific person details
- `people.createContact` - Create new contact
- `people.updateContact` - Update existing contact
- `people.deleteContact` - Delete contact

## 3. Mobile App Solutions

### Expo Contacts (Recommended for Expo/React Native)

**Platform**: iOS and Android  
**Package**: `expo-contacts`

**Features**:
- Integrated with Expo SDK
- Automatic permission handling
- No manual linking required
- TypeScript support
- Contact picker UI on iOS

**Implementation**:
```javascript
import * as Contacts from 'expo-contacts';

async function getContacts() {
  const { status } = await Contacts.requestPermissionsAsync();
  
  if (status === 'granted') {
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Emails,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Name
      ],
    });
    
    if (data.length > 0) {
      console.log(data);
    }
  }
}
```

### React Native Contacts

**Platform**: iOS and Android  
**Package**: `react-native-contacts`  
**Note**: Auto-linking supported for RN 0.60+

**Features**:
- Full contact management (CRUD)
- Access to all contact fields
- Batch operations
- Contact photos support
- Search functionality

**Permissions Required**:
- Android: `READ_CONTACTS`, `WRITE_CONTACTS`
- iOS: Contacts framework permissions

## 4. Security and Privacy Considerations

### Best Practices

1. **Principle of Least Privilege**
   - Only request necessary contact fields
   - Avoid storing contact data unless essential
   - Use one-time access when possible

2. **User Consent**
   - Clear explanation of why contacts are needed
   - Provide value proposition before requesting access
   - Allow users to manually enter contacts as alternative

3. **Data Protection**
   - Encrypt stored contact data
   - Implement data retention policies
   - Provide data deletion options
   - GDPR compliance for EU users

4. **Permission Handling**
   - Gracefully handle permission denials
   - Provide fallback options
   - Don't repeatedly request denied permissions

### Privacy Regulations Compliance

- **GDPR**: Explicit consent, data portability, right to deletion
- **CCPA**: Transparency about data collection and usage
- **COPPA**: Special considerations for children under 13

## 5. Recommended Implementation Strategy for Spark AI

### Progressive Enhancement Approach

```javascript
// 1. Primary: Contact Picker API (mobile web)
if ('contacts' in navigator) {
  // Use Contact Picker API
  showContactPickerButton();
} 
// 2. Secondary: Google People API (optional integration)
else if (userHasGoogleAccount) {
  // Offer Google contacts import
  showGoogleImportOption();
} 
// 3. Fallback: Manual entry
else {
  // Show manual contact form
  showManualContactForm();
}
```

### Implementation Phases

**Phase 1: Web Implementation**
- Implement Contact Picker API for mobile browsers
- Add manual contact entry form
- Create invitation flow UI

**Phase 2: Google Integration** (Optional)
- Add Google OAuth integration
- Implement People API for contact import
- Store user preferences

**Phase 3: Native Mobile** (Future)
- Create React Native version using Expo
- Implement Expo Contacts for native access
- Sync with web version

### UI/UX Recommendations

1. **Clear Value Proposition**
   ```
   "Invite your team members easily by selecting from your contacts"
   ```

2. **Permission Request Context**
   ```
   "Spark needs access to your contacts to help you invite team members. 
   We only access the contacts you select and never store them without 
   your permission."
   ```

3. **Progressive Disclosure**
   - Show manual entry first
   - Offer contact picker as enhancement
   - Explain benefits of using contacts

## 6. Technical Implementation Guide

### Next.js Integration Example

```typescript
// hooks/useContactPicker.ts
import { useState, useCallback } from 'react';

interface Contact {
  name?: string[];
  email?: string[];
  tel?: string[];
}

export function useContactPicker() {
  const [isSupported] = useState(
    'contacts' in navigator && 'ContactsManager' in window
  );
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  const selectContacts = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Contact Picker API not supported');
    }

    try {
      const contacts = await (navigator as any).contacts.select(
        ['name', 'email', 'tel'],
        { multiple: true }
      );
      setSelectedContacts(contacts);
      return contacts;
    } catch (error) {
      console.error('Failed to select contacts:', error);
      throw error;
    }
  }, [isSupported]);

  return {
    isSupported,
    selectedContacts,
    selectContacts,
  };
}
```

### Component Implementation

```typescript
// components/InviteMember.tsx
import { useContactPicker } from '@/hooks/useContactPicker';

export function InviteMember() {
  const { isSupported, selectContacts } = useContactPicker();
  const [manualEmail, setManualEmail] = useState('');

  const handleContactSelect = async () => {
    try {
      const contacts = await selectContacts();
      // Process contacts for invitation
      sendInvitations(contacts);
    } catch (error) {
      // Fall back to manual entry
    }
  };

  return (
    <div>
      {isSupported ? (
        <button onClick={handleContactSelect}>
          Select from Contacts
        </button>
      ) : (
        <input
          type="email"
          placeholder="Enter email address"
          value={manualEmail}
          onChange={(e) => setManualEmail(e.target.value)}
        />
      )}
    </div>
  );
}
```

## 7. Testing Considerations

### Browser Testing
- Test on Android Chrome (primary support)
- Test on iOS Safari (if experimental feature enabled)
- Verify fallback on desktop browsers

### Permission Scenarios
- First-time permission request
- Permission denied handling
- Permission revoked handling
- Multiple selection scenarios

### Edge Cases
- Empty contact selection
- Contacts without email/phone
- Large contact lists performance
- Network connectivity issues

## 8. Performance Considerations

- Contact Picker API is native UI (fast)
- Google People API requires network calls
- Consider pagination for large contact lists
- Cache permission status to avoid repeated checks

## 9. Conclusion

For the Spark AI "Invite Member" feature, we recommend:

1. **Primary**: Implement Contact Picker API for mobile web browsers
2. **Fallback**: Provide manual email/phone entry
3. **Enhancement**: Consider Google People API for power users
4. **Future**: Plan for native mobile app with full contact access

This approach provides the best balance of:
- User privacy and control
- Cross-platform compatibility
- Progressive enhancement
- Future scalability

## 10. Resources and References

- [W3C Contact Picker API Specification](https://www.w3.org/TR/contact-picker/)
- [MDN Contact Picker API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API)
- [Google People API Documentation](https://developers.google.com/people)
- [Expo Contacts Documentation](https://docs.expo.dev/versions/latest/sdk/contacts/)
- [React Native Contacts GitHub](https://github.com/morenoh149/react-native-contacts)
- [What PWA Can Do Today](https://whatpwacando.today/)

---

**Report prepared for**: Spark AI Domain System  
**Next steps**: Implement Phase 1 with Contact Picker API and manual fallback