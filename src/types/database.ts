
export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  full_name: string
  role: 'student' | 'admin'
  created_at: string
}

export interface Module {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Problem {
  id: string
  module_id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  sample_input?: string
  sample_output?: string
  created_at: string
}

export interface TestCase {
  id: string
  problem_id: string
  input: string
  expected_output: string
  hidden: boolean
  created_at: string
}

export interface MCQ {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  module_id?: string
  explanation?: string
  created_at: string
}

export interface Submission {
  id: string
  user_id: string
  problem_id: string
  code: string
  status: string
  score: number
  submitted_at: string
}
