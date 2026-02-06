// Content Scheduling System / Inhaltsplanungssystem / Sistem Programare Conținut
// Schedule posts and content for future publication
// Planen von Beiträgen und Inhalten für zukünftige Veröffentlichung
// Programează postări și conținut pentru publicare viitoare

import { getSupabaseClient } from './supabase';

const supabase = getSupabaseClient();

// Types
export interface ScheduledContent {
  id: string;
  content_id: string;
  content_type: 'post' | 'page' | 'modal' | 'newsletter';
  action: 'publish' | 'unpublish' | 'update' | 'delete';
  scheduled_for: string;
  executed_at?: string;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  error_message?: string;
  created_by: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ScheduleOptions {
  contentId: string;
  contentType: 'post' | 'page' | 'modal' | 'newsletter';
  action: 'publish' | 'unpublish' | 'update' | 'delete';
  scheduledFor: Date;
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * Schedule content for future action
 */
export async function scheduleContent(
  options: ScheduleOptions
): Promise<ScheduledContent | null> {
  const { data, error } = await supabase
    .from('scheduled_content')
    .insert({
      content_id: options.contentId,
      content_type: options.contentType,
      action: options.action,
      scheduled_for: options.scheduledFor.toISOString(),
      status: 'pending',
      created_by: options.userId,
      metadata: options.metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Error scheduling content:', error);
    return null;
  }

  return data;
}

/**
 * Cancel scheduled action
 */
export async function cancelScheduled(scheduleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('scheduled_content')
    .update({ status: 'cancelled' })
    .eq('id', scheduleId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error cancelling schedule:', error);
    return false;
  }

  return true;
}

/**
 * Update scheduled time
 */
export async function updateSchedule(
  scheduleId: string,
  newTime: Date
): Promise<boolean> {
  const { error } = await supabase
    .from('scheduled_content')
    .update({ scheduled_for: newTime.toISOString() })
    .eq('id', scheduleId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error updating schedule:', error);
    return false;
  }

  return true;
}

/**
 * Get pending scheduled items
 */
export async function getPendingSchedules(): Promise<ScheduledContent[]> {
  const { data, error } = await supabase
    .from('scheduled_content')
    .select('*')
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  return data || [];
}

/**
 * Get scheduled items for specific content
 */
export async function getSchedulesForContent(
  contentId: string
): Promise<ScheduledContent[]> {
  const { data, error } = await supabase
    .from('scheduled_content')
    .select('*')
    .eq('content_id', contentId)
    .order('scheduled_for', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  return data || [];
}

/**
 * Execute scheduled action (called by cron job or Edge Function)
 */
export async function executeScheduledAction(
  schedule: ScheduledContent
): Promise<boolean> {
  try {
    switch (schedule.action) {
      case 'publish':
        await publishContent(schedule.content_id, schedule.content_type);
        break;
      case 'unpublish':
        await unpublishContent(schedule.content_id, schedule.content_type);
        break;
      case 'update':
        if (schedule.metadata?.updates) {
          await updateContent(
            schedule.content_id,
            schedule.content_type,
            schedule.metadata.updates
          );
        }
        break;
      case 'delete':
        await deleteContent(schedule.content_id, schedule.content_type);
        break;
    }

    // Mark as executed
    await supabase
      .from('scheduled_content')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', schedule.id);

    return true;
  } catch (error: any) {
    // Mark as failed
    await supabase
      .from('scheduled_content')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error',
      })
      .eq('id', schedule.id);

    return false;
  }
}

/**
 * Content actions
 */
async function publishContent(
  contentId: string,
  contentType: string
): Promise<void> {
  const table = contentType === 'post' ? 'posts' : 'pages';
  await supabase
    .from(table)
    .update({ published: true, published_at: new Date().toISOString() })
    .eq('id', contentId);
}

async function unpublishContent(
  contentId: string,
  contentType: string
): Promise<void> {
  const table = contentType === 'post' ? 'posts' : 'pages';
  await supabase
    .from(table)
    .update({ published: false })
    .eq('id', contentId);
}

async function updateContent(
  contentId: string,
  contentType: string,
  updates: Record<string, any>
): Promise<void> {
  const table = contentType === 'post' ? 'posts' : 'pages';
  await supabase.from(table).update(updates).eq('id', contentId);
}

async function deleteContent(
  contentId: string,
  contentType: string
): Promise<void> {
  const table = contentType === 'post' ? 'posts' : 'pages';
  // Soft delete by marking as deleted
  await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contentId);
}

/**
 * Process due schedules (call from Edge Function or cron)
 */
export async function processDueSchedules(): Promise<{
  processed: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  const { data: dueSchedules, error } = await supabase
    .from('scheduled_content')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now);

  if (error || !dueSchedules) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const schedule of dueSchedules) {
    const success = await executeScheduledAction(schedule);
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * SQL for content scheduling
 */
export const CONTENT_SCHEDULING_SQL = `
-- Scheduled Content Table
CREATE TABLE IF NOT EXISTS scheduled_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'page', 'modal', 'newsletter')),
  action VARCHAR(50) NOT NULL CHECK (action IN ('publish', 'unpublish', 'update', 'delete')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON scheduled_content(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_content_id ON scheduled_content(content_id);

-- RLS
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedules" ON scheduled_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
`;
