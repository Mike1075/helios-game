import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // 测试数据库连接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    if (connectionError) {
      return Response.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError,
        config: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
          serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing'
        }
      }, { status: 500 })
    }

    // 检查表是否存在
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'chat_sessions', 'chat_messages'])

    const existingTables = tables?.map(t => t.table_name) || []

    // 测试认证表
    const { data: authTest, error: authError } = await supabase.auth.admin.listUsers()

    return Response.json({
      success: true,
      message: 'Database connection successful',
      connection: 'OK',
      tables: {
        users: existingTables.includes('users'),
        chat_sessions: existingTables.includes('chat_sessions'),
        chat_messages: existingTables.includes('chat_messages'),
        total_found: existingTables.length
      },
      auth: {
        admin_access: !authError,
        user_count: authTest?.users?.length || 0
      },
      config: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        service_key: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
        anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return Response.json({
      success: false,
      error: 'Database test failed',
      details: error,
      config: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        service_key: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
        anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    }, { status: 500 })
  }
}