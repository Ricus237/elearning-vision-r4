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
  
  if (result === null || (Array.isArray(result) && result.length === 0) || result?.error) {
    return { error: result?.error || "Erreur lors de l'inscription." };
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
