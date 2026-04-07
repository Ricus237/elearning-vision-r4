'use server';

import { cookies } from 'next/headers';
import { loginMoodle, createMoodleUser, enrolUserInCourse, fetchMoodle, startQuizAttempt, getAttemptData } from './moodle';
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

  // 2. Fetch enrolled courses
  const courses = await fetchMoodle('core_enrol_get_users_courses', { userid: parseInt(userId) });
  const enrolledCount = Array.isArray(courses) ? courses.length : 0;
  
  // Clean description html tags if any
  const cleanBio = user.description ? user.description.replace(/<[^>]*>?/gm, '') : "Moodle user enrolled in our eLearning platform.";

  return {
    id: user.id,
    fullname: user.fullname,
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
    email: user.email,
    address: user.city || "Not specified",
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
export async function updateProfileDataAction(data: { name?: string, email?: string, address?: string, bio?: string }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('moodle_user_id')?.value;
  if (!userId) return { error: "Non connecté" };

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

  const params = {
    users: {
      "0": userUpdatePayload
    }
  };

  const result = await fetchMoodle('core_user_update_users', params);
  
  if (result && result.error) {
    return { error: result.error };
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
