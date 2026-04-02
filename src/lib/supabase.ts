import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置
// 优先使用环境变量，如果没有则使用默认值（仅开发环境）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ehsfmciathifanermnoc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2ZtY2lhdGhpZmFuZXJtbm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Mzc1ODcsImV4cCI6MjA5MDUxMzU4N30.9RqvkbcCKyGklS6MwXWaeXuDeFci9Y4Jr0mwFyxbjII'

export const supabase = createClient(supabaseUrl, supabaseKey)
