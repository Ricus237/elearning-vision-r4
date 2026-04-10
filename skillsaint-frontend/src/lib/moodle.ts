const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

/**
 * Fonction de base pour appeler les Web Services de Moodle.
 */
export async function fetchMoodle(wsFunction: string, params: Record<string, unknown> = {}, userToken?: string) {
  // Si on est côté client (navigateur), on passe par notre proxy API
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/moodle', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ function: wsFunction, params }),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Client Moodle Fetch Error:", error);
      return null;
    }
  }

  // Logique serveur (existante)
  const token = userToken || MOODLE_TOKEN;
  if (!MOODLE_URL || !token) {
    return null;
  }

  const query = new URLSearchParams({
    wstoken: token,
    wsfunction: wsFunction,
    moodlewsrestformat: 'json',
  });

  // Helper function to flatten nested objects for Moodle REST API (e.g., users[0][username])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flattenParams = (obj: any, prefix: string = "") => {


    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}[${key}]` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        flattenParams(value, newKey);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            flattenParams(item, `${newKey}[${index}]`);
          } else {
            query.append(`${newKey}[${index}]`, item);
          }
        });
      } else {
        query.append(newKey, value);
      }
    });
  };

  flattenParams(params);

  try {
    const response = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: query.toString(),
      next: { revalidate: 0 },
    });
    
    if (!response.ok) return null;
    const json = await response.json();
    
    // Moodle retourne parfois les erreurs dans le JSON
    if (json.exception) {
      console.error(`Moodle Exception [${wsFunction}]:`, json.message);
      return { error: json.message };
    }
    return json;
  } catch {
    return null;
  }

}

/**
 * Login: Récupère un token pour un utilisateur spécifique.
 */
export async function loginMoodle(username: string, password: string) {
  if (!MOODLE_URL) return null;
  const query = new URLSearchParams({
    username,
    password,
    service: 'moodle_mobile_app' // Ou ton service personnalisé s'il accepte le login
  });

  try {
    const response = await fetch(`${MOODLE_URL}/login/token.php?${query.toString()}`);
    return await response.json();
  } catch {
    return null;
  }

}

/**
 * Créer un utilisateur dans Moodle.
 */
export async function createMoodleUser(user: { username: string, password: string, firstname: string, lastname: string, email: string }) {
  const params = {
    users: {
      "0": user
    }
  };
  return await fetchMoodle('core_user_create_users', params);
}

/**
 * Inscrire un utilisateur à un cours.
 */
export async function enrolUserInCourse(userId: number, courseId: number) {
  const params = {
    enrolments: {
      "0": {
        roleid: 5, // Student par défaut
        userid: userId,
        courseid: courseId
      }
    }
  };
  return await fetchMoodle('enrol_manual_enrol_users', params);
}

export async function getUserCourses(userId: number) {
  const data = await fetchMoodle('core_enrol_get_users_courses', { userid: userId });
  if (Array.isArray(data)) {
    return data.map(mapMoodleCourseToCourseType);
  }
  return [];
}



/**
 * Vérifie si un utilisateur est inscrit à un cours spécifique.
 */
export async function isUserEnrolled(userId: number, courseId: number): Promise<boolean> {
  const courses = await fetchMoodle('core_enrol_get_users_courses', { userid: userId });
  if (Array.isArray(courses)) {
    return courses.some((c: { id: number }) => c.id === courseId);

  }
  return false;
}

/**
 * Récupère les infos globales du site (comme le nom, le résumé "summary").
 * Note: Le résumé de la page d'accueil se trouve généralement dans le cours id=1.
 */
export async function getMoodleSiteData() {
  const info = await fetchMoodle('core_webservice_get_site_info');
  const allCourses = await fetchMoodle('core_course_get_courses');
  
  let summary = "";
  if (Array.isArray(allCourses)) {
    const siteCourse = allCourses.find(c => c.id === 1);
    if (siteCourse) {
      summary = siteCourse.summary || "";
    }
  }

  return {
    sitename: info?.sitename || "International Bible Institute",
    summary: summary || info?.summary || ""
  };
}

export async function getSiteInfo() {
  return await fetchMoodle('core_webservice_get_site_info');
}

import { CourseType } from "@/types/CourseType";
import { CategoryType } from "@/types/CategoryType";

/**
 * Mappe un cours provenant de Moodle vers le type CourseType du frontend.
 */
export function mapMoodleCourseToCourseType(mCourse: { 
  id: string | number, 
  fullname?: string, 
  summary?: string, 
  customfields?: Array<{ shortname: string, value: string }>,
  courseimage?: string,
  overviewfiles?: Array<{ mimetype?: string, fileurl: string }>,
  summaryfiles?: Array<{ mimetype?: string, fileurl: string }>,
  contacts?: Array<{ fullname: string }>,
  enrolledusercount?: number,
  visible?: number,
  category?: string | number
}): CourseType {

  return {
    _id: `course-${mCourse.id}`,
    title: mCourse.fullname || "Course",
    shortDescription: mCourse.summary?.replace(/<[^>]*>?/gm, '') || "No description provided",
    thumbnail: (() => {
      // 1. Chercher dans les customfields (souvent utilisé pour des images spécifiques)
      if (Array.isArray(mCourse.customfields)) {
        const imageField = mCourse.customfields.find((f: { shortname: string, value: string }) => 
          (f.shortname.toLowerCase().includes('image') || f.shortname.toLowerCase().includes('thumb')) && f.value
        );
        if (imageField) return imageField.value;
      }


      // 2. Priorité standard: courseimage
      if (mCourse.courseimage) return mCourse.courseimage;
      
      // 3. overviewfiles (Fichiers de résumé du cours)
      const files = mCourse.overviewfiles || mCourse.summaryfiles || [];
      if (files.length > 0) {
        const imageFile = files.find((f: { mimetype?: string, fileurl: string }) => f.mimetype && f.mimetype.startsWith('image/'));
        if (imageFile) {
          return `${imageFile.fileurl}${imageFile.fileurl.includes('?') ? '&' : '?'}token=${MOODLE_TOKEN}`;
        }

        // Fallback sur le premier fichier si pas de mimetype mais URL existante
        if (files[0].fileurl) {
           return `${files[0].fileurl}${files[0].fileurl.includes('?') ? '&' : '?'}token=${MOODLE_TOKEN}`;
        }
      }
      
      // 4. Extraction depuis le summary HTML si nécessaire (moins fiable)
      if (mCourse.summary && mCourse.summary.includes('<img')) {
        const match = mCourse.summary.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1]) return match[1];
      }

      return `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop`;
    })(),
    instructor: {
       name: mCourse.contacts?.[0]?.fullname || "Our Instructors",
    },
    totalLearners: mCourse.enrolledusercount || 0,
    isCertificationProvide: true,
    price: 0, // Moodle gère souvent les prix via des plugins externes, on met 0 par défaut
    discountPrice: 0,
    status: "Ongoing",
    slug: {
      current: mCourse.id.toString(),
    },
    level: "All Levels",
    overview: [],
    duration: 0,
    lessonsCount: mCourse.visible === 1 ? 10 : 0,
    categoryId: typeof mCourse.category === 'string' ? parseInt(mCourse.category) : mCourse.category,
  };

}

/**
 * Récupère un cours spécifique par son ID.
 */
export async function getCourseById(courseId: number): Promise<CourseType | null> {
  const [data, contents] = await Promise.all([
    fetchMoodle('core_course_get_courses_by_field', { field: 'id', value: courseId }),
    getCourseContents(courseId)
  ]);

  const courses = data?.courses;
  if (Array.isArray(courses) && courses.length > 0) {
    const mapped = mapMoodleCourseToCourseType(courses[0]);
    
    // Calculer le nombre réel de leçons
    let count = 0;
    contents.forEach((section: { modules?: Array<{ id: number }> }) => {

      count += (section.modules?.length || 0);
    });
    
    mapped.lessonsCount = count;
    mapped.duration = count * 15; // Estimation
    
    return mapped;
  }
  return null;
}

/**
 * Récupère tous les cours publics de Moodle et les mappe.
 */
export async function getPublicCourses(): Promise<CourseType[]> {
  const data = await fetchMoodle('core_course_get_courses_by_field');
  const courses = data?.courses;
  
  if (!Array.isArray(courses)) return [];
  
  const publicCourses = courses.filter((c: { id: number }) => c.id > 1);
  
  // Pour avoir le vrai nombre de leçons, on doit charger le contenu de chaque cours
  // on utilise Promise.all pour paralléliser les appels
  const coursesWithDetails = await Promise.all(publicCourses.map(async (c: { id: number }) => {

    try {
      const contents = await getCourseContents(c.id);
      let count = 0;
      contents.forEach((section: { modules?: Array<{ id: number }> }) => {

        count += (section.modules?.length || 0);
      });
      
      const mapped = mapMoodleCourseToCourseType(c);
      mapped.lessonsCount = count;
      // Estimation de la durée: on compte environ 15 min par module pour donner un chiffre "réel"
      mapped.duration = count * 15; 
      return mapped;
    } catch {

      return mapMoodleCourseToCourseType(c);
    }
  }));

  return coursesWithDetails;
}

/**
 * Mappe une catégorie provenant de Moodle vers le type CategoryType du frontend.
 */
export function mapMoodleCategoryToCategoryType(mCat: { id: number, name?: string, description?: string, coursecount?: number }): CategoryType {

  return {
    _id: `cat-${mCat.id}`,
    title: mCat.name || "Category",
    description: mCat.description?.replace(/<[^>]*>?/gm, '') || "",
    slug: {
      current: mCat.id.toString(),
    },
    courseCount: mCat.coursecount || 0,
  };
}

/**
 * Récupère toutes les catégories de Moodle et les mappe.
 */
export async function getMoodleCategories(): Promise<CategoryType[]> {
  const data = await fetchMoodle('core_course_get_categories');
  if (!Array.isArray(data)) return [];
  
  return data.map(mapMoodleCategoryToCategoryType);
}

/**
 * Récupère le contenu d'un cours (sections et modules).
 */
export async function getCourseContents(courseId: number) {
  return await fetchMoodle('core_course_get_contents', { courseid: courseId });
}

/**
 * Récupère les quiz d'un cours.
 */
export async function getCourseQuizzes(courseId: number) {
  const data = await fetchMoodle('mod_quiz_get_quizzes_by_courses', { courseids: [courseId] });
  return data?.quizzes || [];
}
/**
 * Commence une tentative de quiz.
 */
export async function startQuizAttempt(quizId: number, userToken?: string) {
  return await fetchMoodle('mod_quiz_start_attempt', { quizid: quizId }, userToken);
}

/**
 * Récupère les données d'une tentative (questions).
 */
export async function getAttemptData(attemptId: number, page: number = 0, userToken?: string) {
  return await fetchMoodle('mod_quiz_get_attempt_data', { attemptid: attemptId, page: page }, userToken);
}
/**
 * Récupère les pages d'un cours (avec leur contenu HTML).
 */
export async function getCoursePages(courseId: number) {
  const data = await fetchMoodle('mod_page_get_pages_by_courses', { courseids: [courseId] });
  return data?.pages || [];
}

/**
 * Récupère les leçons d'un cours.
 */
export async function getCourseLessons(courseId: number) {
  const data = await fetchMoodle('mod_lesson_get_lessons_by_courses', { courseids: [courseId] });
  return data?.lessons || [];
}
/**
 * Récupère les pages d'une leçon spécifique.
 */
export async function getLessonPages(lessonId: number) {
  const data = await fetchMoodle('mod_lesson_get_pages', { lessonid: lessonId });
  return data?.pages || [];
}

export async function getInstructors() {
  const courses = await getPublicCourses();
  const sortedInstructorsMap = new Map();

  courses.forEach(course => {
    if (course.instructor && course.instructor.name) {
      if (!sortedInstructorsMap.has(course.instructor.name)) {
        sortedInstructorsMap.set(course.instructor.name, {
          id: course.instructor.name.toLowerCase().replace(/\s+/g, '-'),
          name: course.instructor.name,
          title: "Senior Instructor",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=7d52f4&color=fff&size=256`,
          coursesCount: 1,
          rating: 4.8 + Math.random() * 0.2, // Random 4.8-5.0
        });
      } else {
        const instr = sortedInstructorsMap.get(course.instructor.name);
        instr.coursesCount += 1;
      }
    }
  });

  return Array.from(sortedInstructorsMap.values());
}

/**
 * Traite le contenu HTML provenant de Moodle pour corriger les liens d'images et vidéos.
 * Ajoute le token d'accès aux URLs pluginfile.php pour permettre l'affichage externe.
 */
export function processMoodleHtml(html: string): string {
  if (!html) return "";
  
  let processedHtml = html;
  
  // 1. Ajouter le token aux URLs de fichiers Moodle (pluginfile.php)
  const moodleFileRegex = /src="([^"]+pluginfile\.php\/[^"]+)"/g;
  
  processedHtml = processedHtml.replace(moodleFileRegex, (match, url) => {
    const separator = url.includes('?') ? '&' : '?';
    if (url.includes('token=')) return match;
    const token = process.env.MOODLE_TOKEN || "";
    return `src="${url}${separator}token=${token}"`;
  });

  // 2. S'assurer que les URLs sont absolues si elles commencent par /
  const moodleUrl = process.env.MOODLE_URL || "";
  if (moodleUrl) {
    const baseUrl = moodleUrl.endsWith('/') ? moodleUrl.slice(0, -1) : moodleUrl;
    // Uniquement pour les liens relatifs internes (pas déjà absolus)
    processedHtml = processedHtml.replace(/src="(?!\s*https?:\/\/)\/([^"]+)"/g, `src="${baseUrl}/$1"`);
    processedHtml = processedHtml.replace(/href="(?!\s*https?:\/\/)\/([^"]+)"/g, `href="${baseUrl}/$1"`);
  }

  return processedHtml;
}

/**
 * Récupère tous les examens (quiz) avec les métadonnées IBI.
 */
export async function getExamsFull() {
  return await fetchMoodle('local_skillsaint_get_exams');
}

/**
 * Crée une question QCM de manière programmatique dans un quiz Moodle.
 */
export async function createQuestion(params: {
  courseid: number,
  quizid: number,
  name: string,
  text: string,
  answers: Array<{ text: string, fraction: number }>
}) {
  return await fetchMoodle('local_skillsaint_create_question', params);
}

/**
 * Initialise un nouvel examen (Quiz) dans un cours Moodle.
 */
export async function initExam(courseId: number, name: string = "Final Assessment") {
  return await fetchMoodle('local_skillsaint_init_exam', { courseid: courseId, name });
}

/**
 * Récupère toutes les questions d'un quiz Moodle.
 */
export async function getQuizQuestions(quizId: number) {
  return await fetchMoodle('local_skillsaint_get_quiz_questions', { quizid: quizId });
}
