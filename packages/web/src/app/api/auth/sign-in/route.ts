import { createServerClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return Response.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Sign in error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}