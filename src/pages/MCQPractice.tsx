
import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { MCQ, Module } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, HelpCircle, Filter } from 'lucide-react'

export const MCQPractice: React.FC = () => {
  const { user } = useAuth()
  const [mcqs, setMcqs] = useState<(MCQ & { module_name?: string })[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, { correct: boolean; submitted: boolean }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .order('name')

      // Fetch MCQs with module names
      const { data: mcqsData } = await supabase
        .from('mcqs')
        .select(`
          *,
          modules!mcqs_module_id_fkey(name)
        `)
        .order('created_at', { ascending: false })

      setModules(modulesData || [])
      setMcqs(mcqsData?.map(mcq => ({
        ...mcq,
        module_name: mcq.modules?.name
      })) || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMcqs = mcqs.filter(mcq => {
    const moduleMatch = selectedModule === 'all' || mcq.module_id === selectedModule
    const difficultyMatch = selectedDifficulty === 'all' || mcq.difficulty === selectedDifficulty
    return moduleMatch && difficultyMatch
  })

  const handleAnswerSelect = (mcqId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [mcqId]: answer }))
  }

  const handleSubmitAnswer = async (mcq: MCQ) => {
    const selectedAnswer = answers[mcq.id]
    if (!selectedAnswer || !user) return

    try {
      const isCorrect = selectedAnswer === mcq.correct_answer

      // Save submission
      await supabase
        .from('mcq_submissions')
        .insert({
          user_id: user.id,
          mcq_id: mcq.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        })

      setResults(prev => ({
        ...prev,
        [mcq.id]: { correct: isCorrect, submitted: true }
      }))
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 rounded w-40"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MCQ Practice</h1>
        <p className="text-gray-600">Test your knowledge with multiple choice questions</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(module => (
                <SelectItem key={module.id} value={module.id}>
                  {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {filteredMcqs.map((mcq) => {
          const result = results[mcq.id]
          const selectedAnswer = answers[mcq.id]
          
          return (
            <Card key={mcq.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{mcq.question}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(mcq.difficulty)}>
                        {mcq.difficulty}
                      </Badge>
                      {mcq.module_name && (
                        <Badge variant="outline">{mcq.module_name}</Badge>
                      )}
                    </div>
                  </div>
                  {result?.submitted && (
                    <div className="ml-4">
                      {result.correct ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {['A', 'B', 'C', 'D'].map(option => {
                    const optionText = mcq[`option_${option.toLowerCase()}` as keyof MCQ] as string
                    const isSelected = selectedAnswer === option
                    const isCorrect = mcq.correct_answer === option
                    const showResult = result?.submitted
                    
                    return (
                      <div
                        key={option}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          showResult
                            ? isCorrect
                              ? 'bg-green-50 border-green-200'
                              : isSelected && !isCorrect
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                            : isSelected
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => !result?.submitted && handleAnswerSelect(mcq.id, option)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium mr-3">{option})</span>
                          <span>{optionText}</span>
                          {showResult && isCorrect && (
                            <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!result?.submitted ? (
                  <Button
                    onClick={() => handleSubmitAnswer(mcq)}
                    disabled={!selectedAnswer}
                    className="w-full"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${
                      result.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {result.correct ? '✓ Correct!' : `✗ Incorrect. The correct answer is ${mcq.correct_answer}`}
                    </div>
                    {mcq.explanation && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                        <p className="text-blue-800">{mcq.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredMcqs.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No MCQs found</h3>
          <p className="text-gray-600">
            {selectedModule !== 'all' || selectedDifficulty !== 'all'
              ? 'Try adjusting your filters.'
              : 'Contact your administrator to add MCQ questions.'}
          </p>
        </div>
      )}
    </div>
  )
}
