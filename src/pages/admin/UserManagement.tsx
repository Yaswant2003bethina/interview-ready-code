
import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { User } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async (formData: FormData) => {
    const userData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      full_name: formData.get('full_name') as string,
      role: formData.get('role') as 'student' | 'admin',
      password_hash: 'hashed_password' // In real app, hash the password
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id)
      } else {
        const { error } = await supabase
          .from('users')
          .insert(userData)
      }

      toast({
        title: editingUser ? 'User updated' : 'User created',
        description: 'User has been saved successfully.',
      })

      fetchUsers()
      setIsDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save user.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully.',
      })

      fetchUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUser(null); setIsDialogOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleSaveUser(new FormData(e.currentTarget))
            }} className="space-y-4">
              <Input
                name="username"
                placeholder="Username"
                defaultValue={editingUser?.username}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                defaultValue={editingUser?.email}
                required
              />
              <Input
                name="full_name"
                placeholder="Full Name"
                defaultValue={editingUser?.full_name}
                required
              />
              <Select name="role" defaultValue={editingUser?.role || 'student'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{user.full_name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingUser(user)
                    setIsDialogOpen(true)
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                
                {user.role !== 'admin' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
