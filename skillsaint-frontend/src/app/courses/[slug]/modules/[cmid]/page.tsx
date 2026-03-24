import { getCourseContents, getCoursePages, getCourseLessons, getLessonPages, processMoodleHtml } from "@/lib/moodle";
import Link from "next/link";
import { ArrowRight } from "@/lib/icons";

const ModuleViewer = async ({ params }: { params: Promise<{ slug: string, cmid: string }> }) => {
  const { slug, cmid } = await params;
  const courseId = parseInt(slug);
  const cmidNum = parseInt(cmid);

  // 1. Get contents to find out what this module is
  const contents = await getCourseContents(courseId);
  let module: any = null;
  if (Array.isArray(contents)) {
    for (const section of contents) {
      if (section.modules) {
        module = section.modules.find((m: any) => m.id === cmidNum);
        if (module) break;
      }
    }
  }

  if (!module) {
    return (
      <main className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Module not found</h1>
        <Link href={`/courses/${slug}`} className="text-purple-600 hover:underline inline-flex items-center gap-2">
            Back to course <ArrowRight className="size-4 rotate-180" />
        </Link>
      </main>
    );
  }

  let contentHtml = "";
  const title = module.name;

  if (module.modname === 'page') {
    const pages = await getCoursePages(courseId);
    const pageDetail = Array.isArray(pages) ? pages.find((p: any) => p.coursemodule === cmidNum) : null;
    if (pageDetail) {
        contentHtml = pageDetail.content;
    } else {
        contentHtml = "<p>Could not load page content from Moodle.</p>";
    }
  } else if (module.modname === 'lesson') {
    const lessons = await getCourseLessons(courseId);
    const lessonDetail = Array.isArray(lessons) ? lessons.find((l: any) => l.coursemodule === cmidNum) : null;
    if (lessonDetail) {
        const pages = await getLessonPages(lessonDetail.id);
        if (Array.isArray(pages) && pages.length > 0) {
            // Join all pages with a separator for simple viewing
            contentHtml = pages.map((p: any) => `
                <div class="lesson-page mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-purple-900 border-b pb-2">${p.page.title}</h2>
                    <div class="page-contents">${p.page.contents}</div>
                </div>
            `).join('<hr class="my-12 border-gray-100" />');
        } else {
            contentHtml = "<p>This lesson has no pages or content yet.</p>";
        }
    } else {
        contentHtml = "<p>Could not load lesson details from Moodle.</p>";
    }
  } else if (module.modname === 'resource') {
     if (module.contents?.[0]) {
         const file = module.contents[0];
         contentHtml = `
            <div class="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <div class="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                    <svg class="size-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 class="text-xl font-bold mb-2">${file.filename}</h3>
                <p class="text-gray-500 mb-8 text-center max-w-md">This file resource can be viewed or downloaded directly.</p>
                <a href="${file.fileurl}" target="_blank" class="px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95">
                    Open Resource
                </a>
            </div>
         `;
     }
  } else {
      contentHtml = `
        <div class="py-12 text-center">
            <p class="text-gray-500 mb-6">Internal viewing for <strong>${module.modname}</strong> is not yet supported.</p>
            <a href="${module.url}" target="_blank" class="text-purple-600 font-medium hover:underline inline-flex items-center gap-2">
                View on Moodle <ArrowRight className="size-4" />
            </a>
        </div>
      `;
  }

  return (
    <main className="bg-gray-50 min-h-screen">
        <div className="container py-12 max-w-4xl">
            <Link 
                href={`/courses/${slug}`} 
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-8 group"
            >
                <span className="size-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50">
                    <ArrowRight className="size-4 rotate-180" />
                </span>
                Back to Syllabus
            </Link>
            
            <div className="bg-white p-8 sm:p-12 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                        {module.modname}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-10 text-gray-900 leading-tight">{title}</h1>
                
                <div 
                    className="moodle-content prose prose-purple max-w-full 
                        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
                        [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3
                        [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-gray-600
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                        [&_li]:mb-1
                        [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:my-8
                        [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-2xl [&_iframe]:shadow-lg [&_iframe]:my-10
                        [&_a]:text-purple-600 [&_a]:underline
                    " 
                    dangerouslySetInnerHTML={{ __html: processMoodleHtml(contentHtml) }} 
                />
            </div>
            
            <div className="mt-12 flex justify-between items-center text-sm text-gray-400">
                <p>© {new Date().getFullYear()} Skillsaint eLearning</p>
                <div className="flex gap-6">
                    <Link href="#" className="hover:text-gray-600 transition-colors underline decoration-gray-200">Next Lesson</Link>
                </div>
            </div>
        </div>
    </main>
  );
};

export default ModuleViewer;
