import { createClient } from '@supabase/supabase-js'

// 注意：请将下面的值替换为您在 Supabase 控制台获取的实际值
const supabaseUrl = 'https://ehsfmciathifanermnoc.supabase.co'  // 替换为您的 Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc2ZtY2lhdGhpZmFuZXJtbm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Mzc1ODcsImV4cCI6MjA5MDUxMzU4N30.9RqvkbcCKyGklS6MwXWaeXuDeFci9Y4Jr0mwFyxbjII'  // 替换为您的 anon/public key

export const supabase = createClient(supabaseUrl, supabaseKey)
