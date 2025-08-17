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

    // 使用admin API创建用户，无需邮件验证
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // 自动确认邮箱
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
        // 继续，因为认证用户已创建
      }

      // 用户已创建并确认，不需要生成额外的链接
    }

    return Response.json({
      user: data.user,
      message: 'User created successfully. Please sign in.',
    })
  } catch (error) {
    console.error('Sign up error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}