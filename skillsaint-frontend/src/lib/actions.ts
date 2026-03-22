'use server';

import { cookies } from 'next/headers';
import { loginMoodle, createMoodleUser, enrolUserInCourse, isUserEnrolled, fetchMoodle } from './moodle';
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
    cookieStore.set('moodle_token', result.token, { secure: true, httpOnly: true });
    cookieStore.set('moodle_user', identifier, { secure: true });
    
    // Récupérer l'ID réel de l'utilisateur
    const siteInfo = await fetchMoodle('core_webservice_get_site_info', {}, result.token);
    if (siteInfo && siteInfo.userid) {
      cookieStore.set('moodle_user_id', siteInfo.userid.toString(), { secure: true });
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
  
  // NOUVEAU : On utilise directement l'email comme Username
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

  const userUpdatePayload: any = {
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
