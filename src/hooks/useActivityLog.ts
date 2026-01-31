import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: any;
}

export function useActivityLog() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const logActivity = async ({ action, entityType, entityId, entityName, details }: ActivityLogParams) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Cannot log activity: No authenticated user');
        return;
      }

      // We try to log to activity_logs table if it exists
      // If the table doesn't exist, this will fail but we catch it
      const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details,
      });

      if (error) {
        console.warn('Error logging activity (non-critical):', error);
      }
    } catch (error) {
      console.warn('Error in logActivity (non-critical):', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { logActivity, isLoading };
}
