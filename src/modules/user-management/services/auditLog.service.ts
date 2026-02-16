import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
    id: string;
    user_id: string;
    module_code: string | null;
    action: string;
    entity: string | null;
    entity_id: string | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    // Joined fields
    user_email?: string;
    user_name?: string;
}

export interface AuditLogFilter {
    module_code?: string;
    action?: string;
    entity?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

/**
 * Audit Log Service
 * Provides read-only access to audit logs and a helper to insert audit entries from the frontend.
 */
export const AuditLogService = {
    /**
     * Fetch audit logs with optional filters.
     * Only accessible by admin users (enforced by RLS).
     */
    async list(filter: AuditLogFilter = {}): Promise<{ data: AuditLogEntry[]; count: number }> {
        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (filter.module_code) {
            query = query.eq('module_code', filter.module_code);
        }
        if (filter.action) {
            query = query.eq('action', filter.action);
        }
        if (filter.entity) {
            query = query.eq('entity', filter.entity);
        }
        if (filter.user_id) {
            query = query.eq('user_id', filter.user_id);
        }
        if (filter.date_from) {
            query = query.gte('created_at', filter.date_from);
        }
        if (filter.date_to) {
            query = query.lte('created_at', filter.date_to);
        }

        const limit = filter.limit || 50;
        const offset = filter.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[AuditLogService] Error fetching logs:', error);
            throw error;
        }

        // Enrich with user info
        const enrichedData = await this.enrichWithUserInfo(data || []);

        return { data: enrichedData, count: count || 0 };
    },

    /**
     * Enrich audit log entries with user email/name from profiles.
     */
    async enrichWithUserInfo(entries: any[]): Promise<AuditLogEntry[]> {
        if (entries.length === 0) return [];

        const userIds = [...new Set(entries.map(e => e.user_id).filter(Boolean))];

        if (userIds.length === 0) return entries;

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

        const profileMap = new Map(
            (profiles || []).map(p => [p.id, { email: p.email, full_name: p.full_name }])
        );

        return entries.map(entry => ({
            ...entry,
            user_email: profileMap.get(entry.user_id)?.email || 'Unknown',
            user_name: profileMap.get(entry.user_id)?.full_name || 'Unknown',
        }));
    },

    /**
     * Log a sensitive action from the frontend.
     * Use this for client-side operations that need audit tracking.
     */
    async logAction(params: {
        action: string;
        module_code?: string;
        entity?: string;
        entity_id?: string;
        old_values?: Record<string, any>;
        new_values?: Record<string, any>;
    }): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                module_code: params.module_code || 'USER_MANAGEMENT',
                action: params.action,
                entity: params.entity || null,
                entity_id: params.entity_id || null,
                old_values: params.old_values || null,
                new_values: params.new_values || null,
                user_agent: navigator.userAgent,
            });
        } catch (err) {
            console.error('[AuditLogService] Failed to write audit log:', err);
            // Non-fatal - don't throw
        }
    },

    /**
     * Get distinct action types for filter dropdown.
     */
    async getDistinctActions(): Promise<string[]> {
        const { data } = await supabase
            .from('audit_logs')
            .select('action')
            .order('action');

        if (!data) return [];
        return [...new Set(data.map(d => d.action))];
    },

    /**
     * Get distinct module codes for filter dropdown.
     */
    async getDistinctModules(): Promise<string[]> {
        const { data } = await supabase
            .from('audit_logs')
            .select('module_code')
            .not('module_code', 'is', null)
            .order('module_code');

        if (!data) return [];
        return [...new Set(data.map(d => d.module_code).filter(Boolean) as string[])];
    },
};
