'use client';

import { DomainProvider } from './domain-provider';

interface DomainLayoutProps {
  children: React.ReactNode;
  params: { domain: string };
}

export default function DomainLayout({
  children,
  params
}: DomainLayoutProps) {
  return (
    <DomainProvider domainSlug={params.domain}>
      {children}
    </DomainProvider>
  );
}