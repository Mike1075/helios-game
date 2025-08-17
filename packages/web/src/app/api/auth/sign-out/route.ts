import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return Response.json({ message: 'Signed out successfully' })
  } catch (error) {
    console.error('Sign out error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}