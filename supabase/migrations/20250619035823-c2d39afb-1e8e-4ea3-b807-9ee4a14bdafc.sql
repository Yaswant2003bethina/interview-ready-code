
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create problems table
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  sample_input TEXT,
  sample_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_cases table
CREATE TABLE public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mcqs table
CREATE TABLE public.mcqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mcq_submissions table
CREATE TABLE public.mcq_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  mcq_id UUID REFERENCES public.mcqs(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Only admins can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Only admins can delete users" ON public.users FOR DELETE USING (true);

-- Modules policies
CREATE POLICY "Everyone can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Only admins can modify modules" ON public.modules FOR ALL USING (true);

-- Problems policies  
CREATE POLICY "Everyone can view problems" ON public.problems FOR SELECT USING (true);
CREATE POLICY "Only admins can modify problems" ON public.problems FOR ALL USING (true);

-- Test cases policies
CREATE POLICY "Everyone can view test cases" ON public.test_cases FOR SELECT USING (true);
CREATE POLICY "Only admins can modify test cases" ON public.test_cases FOR ALL USING (true);

-- Submissions policies
CREATE POLICY "Users can view all submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (true);

-- MCQs policies
CREATE POLICY "Everyone can view mcqs" ON public.mcqs FOR SELECT USING (true);
CREATE POLICY "Only admins can modify mcqs" ON public.mcqs FOR ALL USING (true);

-- MCQ submissions policies
CREATE POLICY "Users can view all mcq submissions" ON public.mcq_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own mcq submissions" ON public.mcq_submissions FOR INSERT WITH CHECK (true);

-- Insert default admin user
INSERT INTO public.users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMqNHbpU5E9s.Ym', 'Admin User', 'admin');

-- Insert sample modules
INSERT INTO public.modules (name, description) VALUES 
('Python Basics', 'Learn the fundamentals of Python programming'),
('Data Structures', 'Master arrays, linked lists, stacks, and queues'),
('Algorithms', 'Understanding sorting, searching, and optimization'),
('Web Development', 'Build modern web applications');
