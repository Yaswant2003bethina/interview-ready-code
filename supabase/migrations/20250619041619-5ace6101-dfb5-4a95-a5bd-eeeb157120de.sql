
-- Create users table to replace the current auth system
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update modules table if needed
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS problem_count INTEGER DEFAULT 0;

-- Update problems table to ensure proper relationships
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Update mcqs table to ensure proper module relationship
ALTER TABLE public.mcqs DROP CONSTRAINT IF EXISTS mcqs_module_id_fkey;
ALTER TABLE public.mcqs ADD CONSTRAINT mcqs_module_id_fkey 
  FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;

-- Update submissions table to use custom users table
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update mcq_submissions table to use custom users table  
ALTER TABLE public.mcq_submissions DROP CONSTRAINT IF EXISTS mcq_submissions_user_id_fkey;
ALTER TABLE public.mcq_submissions ADD CONSTRAINT mcq_submissions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable Row Level Security with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Only admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Only admins can update users" ON public.users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Public read access for users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public insert for users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Public delete for users" ON public.users FOR DELETE USING (true);

-- Ensure other tables have proper public access
DROP POLICY IF EXISTS "Everyone can view modules" ON public.modules;
CREATE POLICY "Public access modules" ON public.modules FOR ALL USING (true);

DROP POLICY IF EXISTS "Everyone can view problems" ON public.problems;  
CREATE POLICY "Public access problems" ON public.problems FOR ALL USING (true);

DROP POLICY IF EXISTS "Everyone can view test cases" ON public.test_cases;
CREATE POLICY "Public access test_cases" ON public.test_cases FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view all submissions" ON public.submissions;
CREATE POLICY "Public access submissions" ON public.submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Everyone can view mcqs" ON public.mcqs;
CREATE POLICY "Public access mcqs" ON public.mcqs FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view all mcq submissions" ON public.mcq_submissions;
CREATE POLICY "Public access mcq_submissions" ON public.mcq_submissions FOR ALL USING (true);

-- Insert default admin user (password is 'admin123')
INSERT INTO public.users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@admin.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMqNHbpU5E9s.Ym', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample modules with updated structure
INSERT INTO public.modules (name, description, problem_count) VALUES 
('Python Basics', 'Learn the fundamentals of Python programming', 0),
('Data Structures', 'Master arrays, linked lists, stacks, and queues', 0),
('Algorithms', 'Understanding sorting, searching, and optimization', 0),
('Web Development', 'Build modern web applications', 0)
ON CONFLICT DO NOTHING;

-- Update problem counts for modules
UPDATE public.modules SET problem_count = (
  SELECT COUNT(*) FROM public.problems WHERE problems.module_id = modules.id
);
