import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SetupAdmin = () => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addLog = (msg: string) => {
    setMessage(prev => prev + '\n' + msg);
  };

  const handleCreateOrUpdateAdmin = async () => {
    setLoading(true);
    setMessage('Starting process...');
    
    try {
      let userId = '';
      let userEmail = '';

      // 1. Try to SignUp
      addLog('Attempting to create user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
            nama_lengkap: 'Super Admin'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered") || signUpError.status === 422) {
          addLog('User exists. Logging in...');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) throw new Error(`Login failed: ${signInError.message}`);
          
          userId = signInData.user?.id || '';
          userEmail = signInData.user?.email || '';
          addLog(`Logged in as ${userEmail} (${userId})`);

          // Update metadata
          addLog('Updating auth metadata...');
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              role: 'admin',
              nama_lengkap: 'Super Admin'
            }
          });

          if (updateError) throw new Error(`Failed to update metadata: ${updateError.message}`);
          addLog('Auth metadata updated.');

        } else {
          throw signUpError;
        }
      } else {
        userId = signUpData.user?.id || '';
        userEmail = signUpData.user?.email || '';
        addLog(`User created: ${userEmail} (${userId})`);
      }

      if (!userId) throw new Error('No User ID found.');

      // 2. FORCE UPDATE user_roles table
      addLog('Fixing user_roles table...');
      
      // First, delete existing roles to avoid duplicates or conflicts
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        addLog(`Warning: Could not delete old roles: ${deleteError.message}`);
      } else {
        addLog('Old roles removed.');
      }

      // Insert 'admin' role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: 'admin' }
        ]);

      if (insertError) {
        addLog(`Error inserting admin role: ${insertError.message}`);
        addLog('Trying fallback: maybe user_roles is a view? checking direct profiles...');
        
        // Fallback: Check if we can update profiles if user_roles fails
        // Sometimes roles are in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            email: userEmail,
            role: 'admin', // Try setting role in profile if column exists
            full_name: 'Super Admin'
          });
          
         if (profileError) addLog(`Profile update also failed: ${profileError.message}`);
         else addLog('Profile updated with role.');

      } else {
        addLog('Successfully inserted "admin" role into user_roles table.');
      }

      // 3. Clear Local Storage Cache
      addLog('Clearing local cache...');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('user_roles_') || key.startsWith('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      addLog(`Cleared ${keysToRemove.length} cache items.`);

      addLog('DONE! You can now go to /auth and login.');

    } catch (err: any) {
      addLog(`CRITICAL ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear(); 
      setMessage('Logged out and cleared local storage.');
    } catch (err: any) {
      setMessage(`Error logging out: ${err.message}`);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Admin Setup Tool v2 (Force Fix)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleCreateOrUpdateAdmin} disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Create/Fix Admin User'}
          </Button>
          <Button onClick={handleLogout} variant="destructive" disabled={loading} className="w-full">
            Force Logout & Clear Storage
          </Button>
          
          <div className="mt-4 p-4 text-xs font-mono bg-black text-green-400 rounded h-64 overflow-y-auto whitespace-pre-wrap">
            {message || 'Ready...'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAdmin;
