import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始数据库调试检查...');
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: {} as any
    };
    
    // 1. 检查character_states表
    try {
      const { data: statesData, error: statesError } = await supabase
        .from('character_states')
        .select('character_id, energy, boredom, last_updated')
        .limit(5);
        
      results.checks.character_states = {
        success: !statesError,
        error: statesError?.message || null,
        data: statesData || null,
        count: statesData?.length || 0
      };
    } catch (error) {
      results.checks.character_states = {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : error}`,
        data: null,
        count: 0
      };
    }
    
    // 2. 检查scene_events表
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('scene_events')
        .select('id, character_id, content, timestamp')
        .order('timestamp', { ascending: false })
        .limit(3);
        
      results.checks.scene_events = {
        success: !eventsError,
        error: eventsError?.message || null,
        data: eventsData || null,
        count: eventsData?.length || 0
      };
    } catch (error) {
      results.checks.scene_events = {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : error}`,
        data: null,
        count: 0
      };
    }
    
    // 3. 检查基础连接
    try {
      const { data: connData, error: connError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);
        
      results.checks.connection = {
        success: !connError,
        error: connError?.message || null,
        tables: connData || null
      };
    } catch (error) {
      results.checks.connection = {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : error}`,
        tables: null
      };
    }
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Database debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}