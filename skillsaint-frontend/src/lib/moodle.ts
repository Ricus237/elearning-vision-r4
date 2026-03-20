const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

/**
 * Fonction de base pour appeler les Web Services de Moodle.
 */
export async function fetchMoodle(wsFunction: string, params: Record<string, any> = {}, userToken?: string) {
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
    const response = await fetch(`${MOODLE_URL}/webservice/rest/server.php?${query.toString()}`, {
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
  } catch (error) {
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
  } catch (error) {
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

/**
 * Vérifier si un utilisateur est inscrit à un cours.
 */
export async function isUserEnrolled(userId: number, courseId: number) {
  const data = await fetchMoodle('core_enrol_get_users_courses', { userid: userId });
  if (Array.isArray(data)) {
    return data.some(course => course.id === courseId);
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
    sitename: info?.sitename || "Skillsaint",
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
export function mapMoodleCourseToCourseType(mCourse: any): CourseType {
  return {
    _id: `course-${mCourse.id}`,
    title: mCourse.fullname || "Course",
    shortDescription: mCourse.summary?.replace(/<[^>]*>?/gm, '') || "No description provided",
    thumbnail: mCourse.courseimage || "/images/courses/img-1.png",
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
  };
}

/**
 * Récupère un cours spécifique par son ID.
 */
export async function getCourseById(courseId: number): Promise<CourseType | null> {
  const data = await fetchMoodle('core_course_get_courses', { options: { ids: [courseId] } });
  if (Array.isArray(data) && data.length > 0) {
    return mapMoodleCourseToCourseType(data[0]);
  }
  return null;
}

/**
 * Récupère tous les cours publics de Moodle et les mappe.
 */
export async function getPublicCourses(): Promise<CourseType[]> {
  const data = await fetchMoodle('core_course_get_courses');
  if (!Array.isArray(data)) return [];
  
  // On ignore le cours d'index 1 (souvent le cours du site Moodle lui-même)
  return data.filter(c => c.id > 1).map(mapMoodleCourseToCourseType);
}

/**
 * Mappe une catégorie provenant de Moodle vers le type CategoryType du frontend.
 */
export function mapMoodleCategoryToCategoryType(mCat: any): CategoryType {
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

