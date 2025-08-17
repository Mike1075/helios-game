import { createServerClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createServerClient()
    
    // 创建users表
    const { error: usersError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (usersError) {
      console.error('Users table creation error:', usersError)
    }

    // 创建chat_sessions表
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.chat_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
          title TEXT DEFAULT 'New Chat',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (sessionsError) {
      console.error('Sessions table creation error:', sessionsError)
    }

    // 创建chat_messages表
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.chat_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
          session_id TEXT NOT NULL,
          role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
          content TEXT NOT NULL,
          model TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (messagesError) {
      console.error('Messages table creation error:', messagesError)
    }

    return Response.json({
      success: true,
      message: 'Database tables initialized successfully',
      errors: {
        users: usersError,
        sessions: sessionsError,
        messages: messagesError
      }
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return Response.json(
      { error: 'Failed to initialize database', details: error },
      { status: 500 }
    )
  }
}