
import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { MCQ, Module } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, HelpCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const MCQManagement: React.FC = () => {
  const [mcqs, setMcqs] = useState<(MCQ & { module_name?: string })[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

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

  const handleSaveMCQ = async (formData: FormData) => {
    const mcqData = {
      question: formData.get('question') as string,
      option_a: formData.get('option_a') as string,
      option_b: formData.get('option_b') as string,
      option_c: formData.get('option_c') as string,
      option_d: formData.get('option_d') as string,
      correct_answer: formData.get('correct_answer') as 'A' | 'B' | 'C' | 'D',
      difficulty: formData.get('difficulty') as 'Easy' | 'Medium' | 'Hard',
      module_id: formData.get('module_id') as string || null,
      explanation: formData.get('explanation') as string
    }

    try {
      if (editingMCQ) {
        const { error } = await supabase
          .from('mcqs')
          .update(mcqData)
          .eq('id', editingMCQ.id)
      } else {
        const { error } = await supabase
          .from('mcqs')
          .insert(mcqData)
      }

      toast({
        title: editingMCQ ? 'MCQ updated' : 'MCQ created',
        description: 'MCQ has been saved successfully.',
      })

      fetchData()
      setIsDialogOpen(false)
      setEditingMCQ(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save MCQ.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteMCQ = async (mcqId: string) => {
    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('id', mcqId)

      if (error) throw error

      toast({
        title: 'MCQ deleted',
        description: 'MCQ has been deleted successfully.',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete MCQ.',
        variant: 'destructive',
      })
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MCQ Management</h1>
          <p className="text-gray-600">Create and manage multiple choice questions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingMCQ(null); setIsDialogOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Add MCQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMCQ ? 'Edit MCQ' : 'Add New MCQ'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleSaveMCQ(new FormData(e.currentTarget))
            }} className="space-y-4">
              <Textarea
                name="question"
                placeholder="Question"
                defaultValue={editingMCQ?.question}
                required
                rows={3}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="option_a"
                  placeholder="Option A"
                  defaultValue={editingMCQ?.option_a}
                  required
                />
                <Input
                  name="option_b"
                  placeholder="Option B"
                  defaultValue={editingMCQ?.option_b}
                  required
                />
                <Input
                  name="option_c"
                  placeholder="Option C"
                  defaultValue={editingMCQ?.option_c}
                  required
                />
                <Input
                  name="option_d"
                  placeholder="Option D"
                  defaultValue={editingMCQ?.option_d}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select name="correct_answer" defaultValue={editingMCQ?.correct_answer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Correct Answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>

                <Select name="difficulty" defaultValue={editingMCQ?.difficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select name="module_id" defaultValue={editingMCQ?.module_id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General</SelectItem>
                    {modules.map(module => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                name="explanation"
                placeholder="Explanation (optional)"
                defaultValue={editingMCQ?.explanation}
                rows={2}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMCQ ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {mcqs.map((mcq) => (
          <Card key={mcq.id}>
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMCQ(mcq)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteMCQ(mcq.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionText = mcq[`option_${option.toLowerCase()}` as keyof MCQ] as string
                  const isCorrect = mcq.correct_answer === option
                  
                  return (
                    <div
                      key={option}
                      className={`p-2 rounded border text-sm ${
                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-medium mr-2">{option})</span>
                      <span>{optionText}</span>
                      {isCorrect && <span className="ml-2 text-green-600">✓</span>}
                    </div>
                  )
                })}
              </div>
              
              {mcq.explanation && (
                <div className="p-3 bg-blue-50 rounded text-sm">
                  <strong>Explanation:</strong> {mcq.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {mcqs.length === 0 && !loading && (
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No MCQs found</h3>
          <p className="text-gray-600">Start by creating your first MCQ question.</p>
        </div>
      )}
    </div>
  )
}
