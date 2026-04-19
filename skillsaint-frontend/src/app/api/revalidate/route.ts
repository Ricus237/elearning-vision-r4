import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/revalidate
 * Called by the admin site-content page after saving any Moodle CMS data.
 * Purges the Next.js server cache for all public pages so changes are visible immediately.
 */
export async function POST() {
  try {
    // Revalidate all public-facing pages that use Moodle site data
    revalidatePath('/', 'layout');   // Covers layout (footer, header) on all pages
    revalidatePath('/');             // Homepage
    revalidatePath('/about');
    revalidatePath('/programs');
    revalidatePath('/apply');

    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (err) {
    console.error('[Revalidate] Error:', err);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
