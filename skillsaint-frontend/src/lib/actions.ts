'use server';

import { cookies } from 'next/headers';
import { loginMoodle, createMoodleUser, enrolUserInCourse, fetchMoodle, startQuizAttempt, getAttemptData, getPublicCourses, getCourseQuizzes } from './moodle';
import { redirect } from 'next/navigation';

/**
 * Connecte un utilisateur et stocke son token/ID dans les cookies.
 */
export async function loginAction(formData: FormData) {
  const identifier = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = await loginMoodle(identifier, password);

  if (result && result.token) {
    const cookieStore = await cookies();
    cookieStore.set('moodle_token', result.token, { httpOnly: true, path: '/' });
    cookieStore.set('moodle_user', identifier, { path: '/' });
    
    // 2. Récupérer l'ID réel de l'utilisateur et son rôle admin
    const siteInfo = await fetchMoodle('core_webservice_get_site_info', {}, result.token);
    
    if (siteInfo && siteInfo.userid) {
      cookieStore.set('moodle_user_id', siteInfo.userid.toString(), { path: '/' });
      
      // Stocker si l'utilisateur est admin pour protéger les routes /admin
      // On vérifie le flag natif de Moodle ou si c'est l'utilisateur 'admin' par défaut
      if (siteInfo.userisadmin || siteInfo.username === 'admin') {
        cookieStore.set('moodle_is_admin', 'true', { path: '/' });
      } else {
        cookieStore.delete('moodle_is_admin');
      }
    } else {
      // Fallback si core_webservice_get_site_info échoue avec le token user
      // Tenter de retrouver l'utilisateur par email/username via le MASTER TOKEN
      const users = await fetchMoodle('core_user_get_users_by_field', {
        field: 'email',
        'values[0]': identifier
      });
      let userData = Array.isArray(users) ? users[0] : null;
      
      if (!userData) {
        const usersByUsername = await fetchMoodle('core_user_get_users_by_field', {
          field: 'username',
          'values[0]': identifier
        });
        userData = Array.isArray(usersByUsername) ? usersByUsername[0] : null;
      }
      
      if (userData && userData.id) {
        cookieStore.set('moodle_user_id', userData.id.toString(), { path: '/' });
        // ID 2 est généralement l'admin principal dans Moodle
        if (userData.username === 'admin' || userData.id === 2) {
          cookieStore.set('moodle_is_admin', 'true', { path: '/' });
        }
      }
    }

    return { success: true };
  }

  // Log pour déboguer si erreur
  console.log("Moodle Login Fail:", identifier, result);

  return { error: "Identifiants invalides" };
}

/**
 * Déconnecte l'utilisateur.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('moodle_token');
  cookieStore.delete('moodle_user');
  cookieStore.delete('moodle_user_id');
  cookieStore.delete('user_email'); // On détruit aussi l'email de session
  redirect('/');
}

/**
 * Enregistre un nouvel utilisateur.
 */
export async function registerAction(formData: FormData) {
  const email = (formData.get('email') as string).toLowerCase();
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  const username = email; 

  const user = {
    username: username,
    password: password,
    firstname: firstName,
    lastname: lastName,
    email: email,
  };

  const result = await createMoodleUser(user);

  if (result && Array.isArray(result) && result[0]?.id) {
    // Session auto après création
    const loginResult = await loginMoodle(username, password);
    if (loginResult && loginResult.token) {
      const cookieStore = await cookies();
      cookieStore.set('moodle_token', loginResult.token, { secure: true, httpOnly: true });
      cookieStore.set('moodle_user', username, { secure: true });
      cookieStore.set('moodle_user_id', result[0].id.toString(), { secure: true });
      return { success: true, userId: result[0].id };
    }
    return { success: true, userId: result[0].id, needsLogin: true };
  }

  if (result?.error) {
    return { error: result.error };
  }

  return { error: "Erreur lors de la création du compte" };
}

/**
 * Inscrit l'utilisateur à un cours.
 */
export async function enrollAction(courseId: number) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;

  if (!userId) {
     return { error: "Vous devez être connecté pour vous inscrire." };
  }

  const result = await enrolUserInCourse(parseInt(userId), courseId);
  
  if (result?.error) {
    return { error: result.error };
  }

  return { success: true };
}

/**
 * Récupère l'utilisateur actuel.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const username = cookieStore.get('moodle_user')?.value;
  const userId = cookieStore.get('moodle_user_id')?.value;
  return username ? { username, id: userId } : null;
}

/**
 * Récupère les données complètes du profil de l'utilisateur.
 */
export async function getProfileDataAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return null;

  // 1. Fetch full user info from Moodle using Admin Token
  const users = await fetchMoodle('core_user_get_users_by_field', {
    field: 'id',
    'values[0]': parseInt(userId)
  });

  if (!Array.isArray(users) || users.length === 0) return null;
  const user = users[0];

  // 2. Fetch enrolled courses and extra profile data from local systems
  const dashboardData = await fetchMoodle('local_skillsaint_get_student_dashboard_data', { userid: parseInt(userId) });
  const enrolledCount = dashboardData?.courses ? dashboardData.courses.length : 0;
  
  // Clean description html tags if any
  const cleanBio = user.description ? user.description.replace(/<[^>]*>?/gm, '') : "Moodle user enrolled in our eLearning platform.";

  return {
    id: user.id,
    fullname: user.fullname,
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
    email: user.email,
    address: dashboardData?.address || user.city || "Not specified",
    phone: dashboardData?.phone || "",
    motivation: dashboardData?.motivation || "",
    spiritual_bg: dashboardData?.spiritual_bg || "",
    bio: cleanBio,
    userpictureurl: user.profileimageurl || user.profileimageurlsmall,
    firstaccess: user.firstaccess || user.timecreated, // Timestamp in seconds
    enrolledCoursesCount: enrolledCount,
    examsPassed: 0 // Exams logic requires a more complex Moodle gradebook API depending on your setup
  };
}

/**
 * Met à jour le profil utilisateur via Moodle.
 */
export async function updateProfileDataAction(data: { 
  name?: string, 
  email?: string, 
  address?: string, 
  bio?: string,
  phone?: string,
  motivation?: string,
  spiritual_bg?: string
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: "Non connecté" };

  // 1. Update Core Moodle fields
  // Split name into firstname and lastname
  let firstname = data.name;
  let lastname = " ";
  if (data.name && data.name.includes(" ")) {
     const parts = data.name.split(" ");
     firstname = parts[0];
     lastname = parts.slice(1).join(" ");
  }

  const userUpdatePayload: Record<string, string | number> = {
    id: parseInt(userId)
  };

  if (firstname) userUpdatePayload.firstname = firstname;
  if (lastname) userUpdatePayload.lastname = lastname;
  if (data.email) userUpdatePayload.email = data.email;
  if (data.address) userUpdatePayload.city = data.address;
  if (data.bio) userUpdatePayload.description = data.bio;

  const coreResult = await fetchMoodle('core_user_update_users', {
    users: { "0": userUpdatePayload }
  });
  
  if (coreResult && coreResult.error) {
    return { error: coreResult.error };
  }

  // 2. Update Skillsaint custom fields
  const customResult = await updateStudentProfileAction({
    phone: data.phone || "",
    address: data.address || "",
    motivation: data.motivation || "",
    spiritual_bg: data.spiritual_bg || "",
  });

  if (customResult?.error) {
    return { error: customResult.error };
  }

  return { success: true };
}

/**
 * Récupère les questions d'un quiz via une tentative.
 */
export async function getQuizQuestionsAction(quizId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('moodle_token')?.value;
  
  if (!token) return { error: "Vous devez être connecté pour passer l'examen." };

  try {
    // 1. Vérifier s'il y a déjà une tentative en cours
    // On retire le paramètre status qui peut causer des erreurs selon la version de Moodle
    const userAttempts = await fetchMoodle('mod_quiz_get_user_attempts', { quizid: quizId }, token);
    
    let attempt = null;
    if (userAttempts && userAttempts.attempts && Array.isArray(userAttempts.attempts)) {
      // On cherche une tentative en cours
      attempt = userAttempts.attempts.find((a: { state: string; id: number }) => a.state === 'inprogress');
    }

    if (!attempt) {
      // Sinon, on en commence une nouvelle
      const startResult = await startQuizAttempt(quizId, token);
      if (startResult?.exception || startResult?.error) {
        // Gérer le cas spécifique où Moodle dit qu'une tentative est déjà en cours malgré notre check
        if (startResult.message?.toLowerCase().includes('inprogress') || startResult.message?.toLowerCase().includes('en cours')) {
             const retryAttempts = await fetchMoodle('mod_quiz_get_user_attempts', { quizid: quizId }, token);
             attempt = retryAttempts?.attempts?.find((a: { state: string; id: number }) => a.state === 'inprogress');
        }
        
        if (!attempt) {
            return { error: startResult.message || startResult.error };
        }
      } else {
          attempt = startResult.attempt;
      }
    }
    
    if (!attempt) return { error: "Impossible de récupérer ou créer une tentative. Ce quiz est peut-être fermé." };

    // 2. Récupérer les données de la tentative (les questions)
    const data = await getAttemptData(attempt.id, 0, token);
    if (data?.exception) return { error: data.message };

    return { 
      success: true, 
      questions: data.questions || [], 
      attemptId: attempt.id,
      quizName: data.quizname || "Exam"
    };
  } catch {
    return { error: "Erreur lors de la récupération du quiz." };
  }
}

/**
 * Récupère les données réelles du dashboard étudiant.
 */
export async function getStudentDashboardAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  const moodleUser = cookieStore.get('moodle_user')?.value || "";
  const isAdmin = cookieStore.get('moodle_is_admin')?.value === 'true' || moodleUser === 'admin';

  if (!userId) return null;

  interface DashboardCourse {
    id: number;
    fullname: string;
    image_url?: string;
    summary?: string;
  }

  interface DashboardExam {
    id: number;
    name: string;
    courseid: number;
    timeLimit: number;
    intro: string;
  }

  const dashboardData: { 
    plan: string, 
    phone: string,
    address: string,
    motivation: string,
    spiritual_bg: string,
    courses: DashboardCourse[], 
    exams: DashboardExam[] 
  } = {
    plan: 'none',
    phone: '',
    address: '',
    motivation: '',
    spiritual_bg: '',
    courses: [],
    exams: []
  };

  try {
    const data = await fetchMoodle('local_skillsaint_get_student_dashboard_data', { userid: parseInt(userId) });
    if (data && !data.error) {
      dashboardData.plan = data.plan || 'none';
      dashboardData.phone = data.phone || '';
      dashboardData.address = data.address || '';
      dashboardData.motivation = data.motivation || '';
      dashboardData.spiritual_bg = data.spiritual_bg || '';
      dashboardData.courses = data.courses || [];
      dashboardData.exams = data.exams || [];
    }
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
  }

  // SMART FALLBACK: If admin has no enrolled courses (or fetch failed), show all public courses for preview
  if (isAdmin && dashboardData.courses.length === 0) {
    try {
      const allCourses = await getPublicCourses();
      
      if (allCourses && allCourses.length > 0) {
        dashboardData.courses = allCourses.map(c => ({
          id: parseInt(c.slug.current),
          fullname: c.title,
          image_url: c.thumbnail,
          summary: c.shortDescription
        }));
      } else {
        // Ultimate fallback if even public courses are empty
        dashboardData.courses = [
          { id: 999, fullname: "Admin Preview: Biblic Foundation", summary: "This is a preview course because you are logged in as admin.", image_url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800" },
          { id: 998, fullname: "Admin Preview: Systematic Theology", summary: "Another preview course for testing purposes.", image_url: "https://images.unsplash.com/photo-1544648181-3bf43c92015a?q=80&w=800" }
        ];
      }
      
      if (dashboardData.plan === 'none') dashboardData.plan = 'executive';
    } catch (e) {
      console.error("Fallback fetch failed", e);
    }
  }

  // Fetch quizzes dynamically if the custom WS didn't return any but the user has courses
  if (dashboardData.exams.length === 0 && dashboardData.courses.length > 0) {
    try {
      const allExams: DashboardExam[] = [];
      // We process sequentially to avoid overwhelming Moodle with too many parallel WS calls
      for (const course of dashboardData.courses) {
        if (course.id > 1) {
          const quizzes = await getCourseQuizzes(course.id);
          if (Array.isArray(quizzes)) {
            allExams.push(...quizzes.map((q: { id: number; name: string; timelimit?: number; intro?: string }) => ({
              id: q.id,
              courseid: course.id,
              name: q.name,
              timeLimit: q.timelimit || 0,
              intro: q.intro || ""
            })));
          }
        }
      }
      dashboardData.exams = allExams;
    } catch (e) {
      console.error("Failed to dynamically load exams for courses", e);
    }
  }

  return dashboardData;
}

/**
 * Student sends a support inquiry about a course.
 */
export async function sendInquiryAction(data: { courseid: number; subject: string; message: string }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: 'Not authenticated' };

  const result = await fetchMoodle('local_skillsaint_send_inquiry', {
    userid: parseInt(userId),
    courseid: data.courseid,
    subject: data.subject,
    message: data.message,
  });

  if (result?.error) return { error: result.error };
  return { success: true, inquiry_id: result?.inquiry_id };
}

/**
 * Student retrieves their own inquiries (with admin replies).
 */
export async function getStudentInquiriesAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return [];

  const result = await fetchMoodle('local_skillsaint_get_student_inquiries', {
    userid: parseInt(userId),
  });
  return Array.isArray(result) ? result : [];
}

/**
 * Admin: get all inquiries with optional status filter.
 */
export async function getAdminInquiriesAction(statusFilter: string = 'all') {
  const result = await fetchMoodle('local_skillsaint_get_all_inquiries', {
    status_filter: statusFilter,
  });
  return Array.isArray(result) ? result : [];
}

/**
 * Admin: reply to an inquiry and update its status.
 */
export async function replyInquiryAction(data: { inquiry_id: number; reply: string; status: string }) {
  const result = await fetchMoodle('local_skillsaint_reply_inquiry', {
    inquiry_id: data.inquiry_id,
    reply: data.reply,
    status: data.status,
  });
  if (result?.error) return { error: result.error };
  return { success: true };
}

/**
 * Upload avatar image as base64 to Moodle.
 */
export async function updateAvatarAction(imageBase64: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: 'Not authenticated' };

  const result = await fetchMoodle('local_skillsaint_update_avatar', {
    userid: parseInt(userId),
    imagebase64: imageBase64,
  });

  if (result?.error || result?.status === 'error') {
    return { error: result?.message || 'Avatar update failed' };
  }
  return { success: true };
}

/**
 * Add a message to an existing support thread (Student or Admin).
 */
export async function addInquiryMessageAction(data: { inquiry_id: number; message: string }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: 'Not authenticated' };

  const result = await fetchMoodle('local_skillsaint_add_inquiry_message', {
    inquiry_id: data.inquiry_id,
    userid: parseInt(userId),
    message: data.message,
  });

  if (result?.error || result?.status === 'error') {
    return { error: result?.message || 'Failed to add message' };
  }
  return { success: true };
}

/**
 * Delete a student's own support inquiry and its messages.
 */
export async function deleteInquiryAction(inquiryId: number) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: 'Not authenticated' };

  const result = await fetchMoodle('local_skillsaint_delete_inquiry', {
    inquiry_id: inquiryId,
    userid: parseInt(userId),
  });

  if (result?.error || result?.status === 'error') {
    return { error: result?.message || 'Failed to delete inquiry' };
  }
  return { success: true };
}

/**
 * Update a student's personal/spiritual profile.
 */
export async function updateStudentProfileAction(data: {
  phone: string;
  address: string;
  motivation: string;
  spiritual_bg: string;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: 'Not authenticated' };

  const result = await fetchMoodle('local_skillsaint_update_student_profile', {
    userid: parseInt(userId),
    phone: data.phone,
    address: data.address,
    motivation: data.motivation,
    spiritual_bg: data.spiritual_bg,
  });

  if (result?.error || result?.status === 'error') {
    return { error: result?.message || 'Failed to update profile' };
  }
  return { success: true };
}

/**
 * Changes student password
 */
export async function changePasswordAction(current: string, newPass: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: 'Not authenticated' };

  try {
    const result = await fetchMoodle('local_skillsaint_change_password', {
      userid: parseInt(userId),
      currentpassword: current,
      newpassword: newPass
    });

    if (result?.status === 'error') {
      return { error: result.message };
    }

    return { success: true, message: result?.message || 'Password updated' };
  } catch (err) {
    console.error("Change password error:", err);
    return { error: "Moodle connection error" };
  }
}

/**
 * Handle forgot password request
 */
export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get('email') as string;
  // This usually requires a custom Moodle function or redirection to Moodle's native reset page.
  // We'll simulate a success message for the UI.
  console.log("Forgot password request for:", email);
  
  // Real implementation would be:
  // await fetchMoodle('local_skillsaint_forgot_password', { email });
  
  return { success: true, message: "If an account exists for this email, you will receive reset instructions shortly." };
}

