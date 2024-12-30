import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import { collection, getDocs, query ,where } from 'firebase/firestore';
import { db } from './firebaseConfig';

async function getUser(email: string): Promise<User | undefined> {
    try {
        const q = query(collection(db, 'users'), where('email', '==', email));
       const user = await getDocs(q);
         if (user.empty) return undefined;
         return user.docs[0].data() as User;
     
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user.');
    }
    
  }
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
        async authorize(credentials) {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

            if (parsedCredentials.success) {
                const { email, password } = parsedCredentials.data;
                const user = await getUser(email);
                if (!user) return null;
                return user
              }

              console.log('invalid credentials');
              return null;
        },
      }),
    ],
  });