
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  created_at: string;
}

export interface Module {
  id: string;
  name: string;
  description: string | null;
  problem_count: number;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sample_input: string | null;
  sample_output: string | null;
  module_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MCQ {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  module_id: string | null;
  explanation: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  code: string;
  status: string;
  score: number;
  submitted_at: string;
}
