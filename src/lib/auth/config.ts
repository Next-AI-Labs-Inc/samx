import NextAuth, { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getDatabase } from "@/lib/db/connection"
import { v4 as uuidv4 } from "uuid"

// Simple local auth for development that's cloud-ready
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Local Admin",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@localhost" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For local development - simple admin credentials
        const adminEmail = process.env.ADMIN_EMAIL || "admin@localhost"
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
        
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          try {
            // Check if admin user exists in database
            const db = getDatabase()
            let adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail) as any
            
            if (!adminUser) {
              // Create admin user if doesn't exist
              const userId = uuidv4()
              const now = new Date().toISOString()
              
              db.prepare(`
                INSERT INTO users (id, email, name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
              `).run(userId, adminEmail, "Admin User", now, now)
              
              adminUser = { id: userId, email: adminEmail, name: "Admin User" }
            }
            
            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name || "Admin User",
            }
          } catch (error) {
            console.log('Database not available for auth, using fallback admin user');
            // Return a temporary admin user when database is not available
            return {
              id: 'temp-admin-id',
              email: adminEmail,
              name: "Admin User (No DB)",
            }
          }
        }

        return null
      }
    })
  ],
  // Disable database adapter when DB is not available to prevent crashes
  adapter: undefined,
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)