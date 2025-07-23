# Sprint 1 Types

**Note**: For Sprint 1, the TypeScript type definitions are currently embedded within the mock-data.ts file and component files. 

In Sprint 2, we've improved this pattern by extracting types into a dedicated `types/` folder for better organization and reusability.

## Current Type Locations

- Domain types: `mock-data/mock-data.ts`
- Component props: Within individual component files
- Navigation types: `components/unified-domain-ui.tsx`

## Future Refactoring

In a future refactoring, these types should be extracted to:
- `domain.types.ts` - Domain, Role, User, Membership types
- `navigation.types.ts` - Navigation and sidebar types
- `component.types.ts` - Shared component prop types

This would align Sprint 1 with the improved structure used in Sprint 2.