// Content Versioning System / Inhaltsversionierungssystem / Sistem Versionare Conținut
// Track changes and manage content versions
// Änderungen verfolgen und Inhaltsversionen verwalten
// Urmărește modificările și gestionează versiunile de conținut

import { getSupabaseClient } from './supabase';

const supabase = getSupabaseClient();

// Types
export interface ContentVersion {
  id: string;
  content_id: string;
  content_type: 'post' | 'page' | 'modal';
  title: string;
  content: string;
  excerpt?: string;
  metadata?: Record<string, any>;
  version_number: number;
  created_at: string;
  created_by: string;
  change_summary?: string;
  is_published: boolean;
  is_current: boolean;
}

export interface ContentDiff {
  field: string;
  oldValue: string;
  newValue: string;
  added: string[];
  removed: string[];
}

/**
 * Create a new version of content
 */
export async function createVersion(
  contentId: string,
  contentType: 'post' | 'page' | 'modal',
  data: {
    title: string;
    content: string;
    excerpt?: string;
    metadata?: Record<string, any>;
    changeSummary?: string;
    userId: string;
  }
): Promise<ContentVersion | null> {
  // Get current version number
  const { data: lastVersion } = await supabase
    .from('content_versions')
    .select('version_number')
    .eq('content_id', contentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const newVersionNumber = (lastVersion?.version_number || 0) + 1;

  // Mark all previous versions as not current
  await supabase
    .from('content_versions')
    .update({ is_current: false })
    .eq('content_id', contentId);

  // Create new version
  const { data: version, error } = await supabase
    .from('content_versions')
    .insert({
      content_id: contentId,
      content_type: contentType,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      metadata: data.metadata,
      version_number: newVersionNumber,
      created_by: data.userId,
      change_summary: data.changeSummary,
      is_published: false,
      is_current: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating version:', error);
    return null;
  }

  return version;
}

/**
 * Get all versions for content
 */
export async function getVersions(
  contentId: string
): Promise<ContentVersion[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select('*')
    .eq('content_id', contentId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching versions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get specific version
 */
export async function getVersion(
  contentId: string,
  versionNumber: number
): Promise<ContentVersion | null> {
  const { data, error } = await supabase
    .from('content_versions')
    .select('*')
    .eq('content_id', contentId)
    .eq('version_number', versionNumber)
    .single();

  if (error) {
    console.error('Error fetching version:', error);
    return null;
  }

  return data;
}

/**
 * Restore a previous version
 */
export async function restoreVersion(
  contentId: string,
  versionNumber: number,
  userId: string
): Promise<boolean> {
  // Get the version to restore
  const version = await getVersion(contentId, versionNumber);
  if (!version) return false;

  // Create a new version from the restored content
  const newVersion = await createVersion(contentId, version.content_type, {
    title: version.title,
    content: version.content,
    excerpt: version.excerpt,
    metadata: version.metadata,
    changeSummary: `Restored from version ${versionNumber}`,
    userId,
  });

  return !!newVersion;
}

/**
 * Compare two versions
 */
export function compareVersions(
  oldVersion: ContentVersion,
  newVersion: ContentVersion
): ContentDiff[] {
  const diffs: ContentDiff[] = [];

  // Compare title
  if (oldVersion.title !== newVersion.title) {
    diffs.push({
      field: 'title',
      oldValue: oldVersion.title,
      newValue: newVersion.title,
      added: [],
      removed: [],
    });
  }

  // Compare content using simple diff
  if (oldVersion.content !== newVersion.content) {
    const oldLines = oldVersion.content.split('\n');
    const newLines = newVersion.content.split('\n');

    const added = newLines.filter((line) => !oldLines.includes(line));
    const removed = oldLines.filter((line) => !newLines.includes(line));

    diffs.push({
      field: 'content',
      oldValue: oldVersion.content,
      newValue: newVersion.content,
      added,
      removed,
    });
  }

  // Compare excerpt
  if (oldVersion.excerpt !== newVersion.excerpt) {
    diffs.push({
      field: 'excerpt',
      oldValue: oldVersion.excerpt || '',
      newValue: newVersion.excerpt || '',
      added: [],
      removed: [],
    });
  }

  return diffs;
}

/**
 * Publish a version
 */
export async function publishVersion(
  contentId: string,
  versionNumber: number
): Promise<boolean> {
  // Get the version to publish
  const version = await getVersion(contentId, versionNumber);
  if (!version) return false;

  // Unpublish all other versions
  await supabase
    .from('content_versions')
    .update({ is_published: false })
    .eq('content_id', contentId);

  // Publish this version
  const { error } = await supabase
    .from('content_versions')
    .update({ is_published: true })
    .eq('content_id', contentId)
    .eq('version_number', versionNumber);

  if (error) {
    console.error('Error publishing version:', error);
    return false;
  }

  // Also update the main content table
  await updateMainContent(contentId, version);

  return true;
}

/**
 * Update main content table with version data
 */
async function updateMainContent(
  contentId: string,
  version: ContentVersion
): Promise<void> {
  const table = version.content_type === 'post' ? 'posts' : 'pages';

  await supabase
    .from(table)
    .update({
      title: version.title,
      content: version.content,
      excerpt: version.excerpt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId);
}

/**
 * Auto-save draft with debounce
 */
let autoSaveTimeout: NodeJS.Timeout | null = null;

export function autoSaveDraft(
  contentId: string,
  contentType: 'post' | 'page' | 'modal',
  data: {
    title: string;
    content: string;
    excerpt?: string;
    metadata?: Record<string, any>;
    userId: string;
  },
  delay: number = 5000
): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    await saveDraft(contentId, contentType, data);
  }, delay);
}

/**
 * Save draft
 */
export async function saveDraft(
  contentId: string,
  contentType: 'post' | 'page' | 'modal',
  data: {
    title: string;
    content: string;
    excerpt?: string;
    metadata?: Record<string, any>;
    userId: string;
  }
): Promise<void> {
  const { error } = await supabase.from('content_drafts').upsert(
    {
      content_id: contentId,
      content_type: contentType,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      metadata: data.metadata,
      user_id: data.userId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'content_id,user_id',
    }
  );

  if (error) {
    console.error('Error saving draft:', error);
  }
}

/**
 * Get draft for content
 */
export async function getDraft(
  contentId: string,
  userId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('content_drafts')
    .select('*')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Delete draft
 */
export async function deleteDraft(
  contentId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('content_drafts')
    .delete()
    .eq('content_id', contentId)
    .eq('user_id', userId);
}

/**
 * SQL for content versioning tables
 */
export const CONTENT_VERSIONING_SQL = `
-- Content Versions Table
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'page', 'modal')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  metadata JSONB DEFAULT '{}',
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  change_summary TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_current BOOLEAN DEFAULT FALSE,
  UNIQUE(content_id, version_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_current ON content_versions(content_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_versions_published ON content_versions(content_id, is_published) WHERE is_published = TRUE;

-- Content Drafts Table
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, user_id)
);

-- Index for drafts
CREATE INDEX IF NOT EXISTS idx_content_drafts_user ON content_drafts(user_id, content_id);

-- RLS Policies
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;

-- Content versions: admins can manage, everyone can read published
CREATE POLICY "Public can view published versions" ON content_versions
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage versions" ON content_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Drafts: users can only see their own
CREATE POLICY "Users can manage own drafts" ON content_drafts
  FOR ALL USING (user_id = auth.uid());
`;
