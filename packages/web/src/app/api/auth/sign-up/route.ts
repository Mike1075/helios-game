import { supabase } from '@/lib/supabase'
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // 不需要邮件验证
      }
    })

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // 创建用户记录
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])

      if (userError) {
        console.error('User creation error:', userError)
        // 继续，因为用户已创建
      }
    }

    return Response.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Sign up error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}