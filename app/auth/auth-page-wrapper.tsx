import { cookies } from 'next/headers';
import AuthPageClient from './auth-page-client';

export default function AuthPageWrapper() {
  const cookieStore = cookies();
  const intendedDomain = cookieStore.get('intendedDomain')?.value;
  
  return <AuthPageClient intendedDomain={intendedDomain} />;
}