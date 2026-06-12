import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// サービスロールクライアント（RLSをバイパス）
// サーバーサイドのServer Actions/API Routesのみで使用
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
