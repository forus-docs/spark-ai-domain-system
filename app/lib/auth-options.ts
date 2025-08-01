import { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';

// Helper to refresh access token
async function refreshAccessToken(token: JWT) {
  try {
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      wellKnown: `${process.env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }): Promise<JWT> {
      // Initial sign in
      if (account && profile) {
        // Provision user in NetBuild database if not exists
        try {
          await connectToDatabase();
          
          // Check if user exists by keycloakId
          let user = await User.findOne({ keycloakId: profile.sub });
          
          if (!user) {
            // Create new user from Keycloak profile
            user = await User.create({
              keycloakId: profile.sub!,
              email: profile.email || '',
              name: profile.name || (profile as any).preferred_username || 'Unknown User',
              username: (profile as any).preferred_username || profile.email?.split('@')[0] || `user_${Date.now()}`,
              role: 'user',
              domains: [],
              apiKeys: [],
              identity: {
                isVerified: true, // Keycloak users are considered verified
                verifiedAt: new Date(),
                verificationType: 'keycloak',
              },
            });
            console.log('Created new NetBuild user from Keycloak:', user.id);
          } else {
            // Update existing user with latest info from Keycloak
            user.email = profile.email || user.email;
            user.name = profile.name || (profile as any).preferred_username || user.name;
            await user.save();
          }
          
          return {
            ...token,
            accessToken: account.access_token,
            accessTokenExpires: Date.now() + ((account as any).expires_in ?? 0) * 1000,
            refreshToken: account.refresh_token,
            user: {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              username: user.username,
              groups: (profile as any).groups || [],
              keycloakId: profile.sub!,
            },
          };
        } catch (error) {
          console.error('Error provisioning user:', error);
          throw new Error('Failed to provision user');
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
        session.user = token.user as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/keycloak-signin',
    signOut: '/auth/keycloak-signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  debug: process.env.NODE_ENV === 'development',
};

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      groups: string[];
      keycloakId: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      username: string;
      groups: string[];
      keycloakId: string;
    };
  }
}