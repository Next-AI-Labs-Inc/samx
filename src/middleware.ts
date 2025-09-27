import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// For now, disable auth middleware since it's causing Edge Runtime issues
// TODO: Implement proper Edge Runtime compatible auth checking
export async function middleware(request: NextRequest) {
  // Skip auth checks for now to avoid Node.js module issues
  // Auth will be handled at the API route level instead
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Currently disabled - will be enabled when auth is working
  ]
}
