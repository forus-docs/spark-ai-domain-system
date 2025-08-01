'use client';

import { AuthProvider } from '@/app/contexts/auth-context';
import { DomainProvider } from '@/app/contexts/domain-context';
import { ChatProvider } from '@/app/contexts/chat-context';
import { FileProvider } from '@/app/contexts/file-context';
import { KeycloakProvider } from '@/app/providers/keycloak-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KeycloakProvider>
      <AuthProvider>
        <DomainProvider>
          <ChatProvider>
            <FileProvider>
              {children}
            </FileProvider>
          </ChatProvider>
        </DomainProvider>
      </AuthProvider>
    </KeycloakProvider>
  );
}