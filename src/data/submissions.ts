// The member's own tickets marked as seen once they open Submissions, so their red dot goes
// on every device (supabase/result-submissions.sql).
import { database } from './database.ts';

export async function markOwnSubmissionsSeen(): Promise<void> {
  const { error } = await database().rpc('mark_submissions_seen');
  if (error) throw new Error(error.message);
}
