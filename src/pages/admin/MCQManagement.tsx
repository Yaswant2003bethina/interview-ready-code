
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MCQ, Module } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MCQManagement = () => {
  const [mcqs, setMcqs] = useState<(MCQ & { module_name?: string })[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMcq, setEditingMcq] = useState<MCQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    module_id: '',
    explanation: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMcqs();
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchMcqs = async () => {
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select(`
          *,
          modules!mcqs_module_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mcqsWithModuleName = data?.map(mcq => ({
        id: mcq.id,
        question: mcq.question,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_answer: mcq.correct_answer as 'A' | 'B' | 'C' | 'D',
        difficulty: mcq.difficulty as 'Easy' | 'Medium' | 'Hard',
        module_id: mcq.module_id,
        explanation: mcq.explanation,
        created_at: mcq.created_at,
        module_name: mcq.modules?.name || 'General'
      })) || [];
      
      setMcqs(mcqsWithModuleName);
    } catch (error) {
      console.error('Error fetching MCQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        module_id: formData.module_id || null
      };

      if (editingMcq) {
        const { error } = await supabase
          .from('mcqs')
          .update(submitData)
          .eq('id', editingMcq.id);
        
        if (error) throw error;
        toast({ title: "MCQ updated successfully" });
      } else {
        const { error } = await supabase
          .from('mcqs')
          .insert([submitData]);
        
        if (error) throw error;
        toast({ title: "MCQ created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingMcq(null);
      resetForm();
      fetchMcqs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      difficulty: 'Easy',
      module_id: '',
      explanation: ''
    });
  };

  const handleEdit = (mcq: MCQ) => {
    setEditingMcq(mcq);
    setFormData({
      question: mcq.question,
      option_a: mcq.option_a,
      option_b: mcq.option_b,
      option_c: mcq.option_c,
      option_d: mcq.option_d,
      correct_answer: mcq.correct_answer,
      difficulty: mcq.difficulty,
      module_id: mcq.module_id || '',
      explanation: mcq.explanation || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (mcqId: string) => {
    if (!confirm('Are you sure you want to delete this MCQ?')) return;
    
    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('id', mcqId);
      
      if (error) throw error;
      toast({ title: "MCQ deleted successfully" });
      fetchMcqs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MCQ Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add MCQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMcq ? 'Edit MCQ' : 'Add New MCQ'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Question"
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Option A"
                    value={formData.option_a}
                    onChange={(e) => setFormData({...formData, option_a: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Option B"
                    value={formData.option_b}
                    onChange={(e) => setFormData({...formData, option_b: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Option C"
                    value={formData.option_c}
                    onChange={(e) => setFormData({...formData, option_c: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Option D"
                    value={formData.option_d}
                    onChange={(e) => setFormData({...formData, option_d: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Select value={formData.correct_answer} onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setFormData({...formData, correct_answer: value})}>
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
                  <Select value={formData.difficulty} onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setFormData({...formData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.module_id} onValueChange={(value) => setFormData({...formData, module_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Module (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>{module.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Explanation (Optional)"
                  value={formData.explanation}
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                />
                <Button type="submit" className="w-full">
                  {editingMcq ? 'Update MCQ' : 'Create MCQ'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>MCQ Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mcqs.map((mcq) => (
                <div key={mcq.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{mcq.question}</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(mcq)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(mcq.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                    <div>A) {mcq.option_a}</div>
                    <div>B) {mcq.option_b}</div>
                    <div>C) {mcq.option_c}</div>
                    <div>D) {mcq.option_d}</div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex space-x-4">
                      <span>Correct: {mcq.correct_answer}</span>
                      <span className={`px-2 py-1 rounded ${
                        mcq.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        mcq.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {mcq.difficulty}
                      </span>
                      <span>Module: {mcq.module_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
