import { CourseType } from "@/types/CourseType";
import { getPublicCourses, getMoodleSiteData, getCourseContents, fetchMoodle } from "./moodle";

/**
 * Fetches Hero data from Moodle site info or returns default values.
 */
export async function getHeroData(): Promise<{ title: string; description: string }> {
  const info = await getMoodleSiteData();
  if (info) {
    return {
      title: info.sitename || "Explore Christian Faith",
      description: info.summary?.replace(/<[^>]*>?/gm, "") || "Deepen your understanding of Scripture."
    };
  }
  return {
    title: "Explore Christian Faith",
    description: "Discover comprehensive Christian education covering Biblical foundations, theology, and spiritual growth."
  };
}

/**
 * Fetches all courses from Moodle API.
 */
export async function getAllCourses(): Promise<CourseType[]> {
  try {
    const realCourses = await getPublicCourses();
    if (realCourses && realCourses.length > 0) {
      return realCourses;
    }
  } catch (error) {
    console.warn("Could not fetch real courses from Moodle, using fallbacks.");
  }

  // Fallback / Mock data if Moodle is not connected or empty
  return [
    {
      _id: "1",
      title: "Introduction to Biblical Studies",
      shortDescription: "Learn the basics of interpreting sacred texts and understanding their context.",
      instructor: {
        name: "International Bible Institute Team"
      },
      thumbnail: "/images/course/course-1.png",
      price: 49.99,
      totalLearners: 1250,
      lessonsCount: 24,
      slug: {
        current: "introduction-to-biblical-studies"
      },
      status: "Ongoing",
      level: "Beginner",
      discountPrice: 29.99,
      isCertificationProvide: true,
      overview: []
    },
    {
      _id: "2",
      title: "Mastering Systematic Theology",
      shortDescription: "Dive deep into the foundations of faith and major theological doctrines.",
      instructor: {
        name: "International Bible Institute Expert"
      },
      thumbnail: "/images/course/course-2.png",
      price: 89.99,
      totalLearners: 850,
      lessonsCount: 42,
      slug: {
        current: "mastering-systematic-theology"
      },
      status: "Completed",
      level: "Intermediate",
      discountPrice: 59.99,
      isCertificationProvide: true,
      overview: []
    },
    {
      _id: "3",
      title: "Christian Leadership Fundamentals",
      shortDescription: "Develop your leadership skills according to biblical principles.",
      instructor: {
        name: "Ministry Master"
      },
      thumbnail: "/images/course/course-3.png",
      price: 69.99,
      totalLearners: 2100,
      lessonsCount: 30,
      slug: {
        current: "christian-leadership-fundamentals"
      },
      status: "Ongoing",
      level: "Beginner",
      discountPrice: 45.99,
      isCertificationProvide: true,
      overview: []
    }
  ];
}

/**
 * Fetches Global Site Data from Moodle plugin.
 */
export async function getGlobalSiteData() {
  const defaultData = {
    hero_badge: "Empowering Spiritual Leaders",
    mission: { title: "Our Mission", content: "To form mature believers..." },
    vision: { title: "Our Vision", content: "To cultivate believers..." },
    about: {
      hero_title: "Our Identity & Vision",
      founder_title: "Welcome Letter from Founder",
      founder_content: "Welcome to the International Bible Institute...",
      founder_name: "In Christ, Our Founder",
      goal_title: "Our Goal",
      goal_content: "Raising a generation of leaders..."
    },
    programs: {
      hero_title: "Academic Programs",
      hero_desc: "Equipping the next generation of spiritual and global leaders.",
      core_title: "Kingdom Foundations",
      core_items: ["40-minute pre-recorded lessons", "Daily journaling", "Practical assignments"]
    },
    enrollment: {
      hero_title: "Apply to IBI",
      hero_desc: "Complete your application form and choose your program.",
      plans: {
        standard: { price: 299, quota: 3 },
        premium: { price: 499, quota: 6 },
        executive: { price: 999, quota: Infinity }
      },
      security_note: ""
    }
  };

  try {
    const data = await fetchMoodle('local_skillsaint_get_all_site_data');
    if (data && !data.error) {
       return {
          hero_badge: data.hero_badge || defaultData.hero_badge,
          mission: { title: data.mission_title || defaultData.mission.title, content: data.mission_content || defaultData.mission.content },
          vision: { title: data.vision_title || defaultData.vision.title, content: data.vision_content || defaultData.vision.content },
          about: {
            hero_title: data.about_hero_title || defaultData.about.hero_title,
            founder_title: data.founder_title || defaultData.about.founder_title,
            founder_content: data.founder_content || defaultData.about.founder_content,
            founder_name: data.founder_name || defaultData.about.founder_name,
            goal_title: data.goal_title || defaultData.about.goal_title,
            goal_content: data.goal_content || defaultData.about.goal_content
          },
          programs: {
            hero_title: data.programs_hero_title || defaultData.programs.hero_title,
            hero_desc: data.programs_hero_desc || defaultData.programs.hero_desc,
            core_title: data.core_program_title || defaultData.programs.core_title,
            core_items: data.core_program_items ? data.core_program_items.split('\n').filter(Boolean) : defaultData.programs.core_items
          },
          enrollment: {
            hero_title: data.apply_hero_title || defaultData.enrollment.hero_title,
            hero_desc: data.apply_hero_desc || defaultData.enrollment.hero_desc,
            plans: {
              standard: { price: parseInt(data.price_standard) || 299, quota: parseInt(data.quota_standard) || 3 },
              premium: { price: parseInt(data.price_premium) || 499, quota: parseInt(data.quota_premium) || 6 },
              executive: { price: parseInt(data.price_executive) || 999, quota: Infinity }
            },
            security_note: data.security_note || defaultData.enrollment.security_note
          }
       };
    }
  } catch (_e) {
    console.error("Moodle plugin error, using fallbacks:", _e);
  }

  return defaultData;
}

// Map back for existing Home Page compatibility
export async function getExtraSiteData() {
  const all = await getGlobalSiteData();
  return all;
}

export async function getAboutData() {
  const all = await getGlobalSiteData();
  return all.about;
}

export async function getProgramsData() {
  const all = await getGlobalSiteData();
  return all.programs;
}

export async function getEnrollmentData() {
  const all = await getGlobalSiteData();
  return all.enrollment;
}

/**
 * Saves student application to Moodle (pending status)
 */
export async function saveApplication(
  formData: Record<string, string | string[] | boolean | undefined>, 
  planId: string, 
  courseIds: string[]
) {

  try {
    const match = document.cookie.match(/moodle_user_id=([^;]+)/);
    const userId = match ? parseInt(match[1]) : 0;

    // We serialize all extra info (demographics + spiritual) to JSON to store it in a single text field
    const spiritualInfo = JSON.stringify({
      // Missed demographic fields
      gender: formData.gender || '',
      dob: formData.dob || '',
      marital_status: formData.marital_status || '',
      country: formData.country || '',

      // Church & Spiritual background
      relationship: formData.relationship_description || '',
      believer_duration: formData.believer_duration || '',
      baptisms: [
        formData['baptism-water'] ? 'water' : null,
        formData['baptism-spirit'] ? 'spirit' : null
      ].filter(Boolean),
      ministry: formData.ministry_experience || '',
      church: formData.church_name || '',
      church_role: formData.church_role || '',
      pastor_name: formData.pastor_name || '',
      
      // Goals & Aspirations
      growth_areas: formData['growth-area'] ? (Array.isArray(formData['growth-area']) ? formData['growth-area'] : [formData['growth-area']]) : [],
      aspirations: formData.ministry_aspirations || '',
      leadership: formData.leadership_goals || ''
    });

    const payload = {
      fullname: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      address: formData.address || '',
      motivation: formData.enrollment_motivation || '',
      spiritual_info: spiritualInfo,
      selected_plan: planId,
      selected_courses: courseIds.join(','),
      userid: userId
    };

    // SMART: Envoie la requête via notre serveur sécurisé si on est sur le navigateur
    if (typeof window !== "undefined") {
      const response = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_save_application", params: payload }),
      });
      return await response.json();
    }

    // Exécution directe si on est déjà côté serveur
    const result = await fetchMoodle('local_skillsaint_save_application', payload);
    return result;
  } catch (_e) {
    console.error("Failed to save application to Moodle:", _e);
    return { error: true };
  }

}

/**
 * Confirms payment and triggers enrollment in Moodle
 */
/**
 * Confirms payment and enrolls user.
 * SMART: If run in browser, it calls the server-side API bridge to securely access the Moodle Token.
 */
export async function confirmPayment(email: string) {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_confirm_payment", params: { email } }),
      });
      return await response.json();
    } catch (_e) {
      console.error("Browser-side confirmPayment error:", _e);
      return { status: "error", message: "Network error" };
    }

  }

  try {
    const result = await fetchMoodle("local_skillsaint_confirm_payment", { email });
    return result || { status: "error", message: "Empty response" };
  } catch (_e) {
    console.error("Server-side confirmPayment error:", _e);
    return { status: "error", message: "Moodle connection error" };
  }

}

/**
 * Activates account with code
 */
export async function activateAccount(email: string, code: string) {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_activate_account", params: { email, code } }),
      });
      return await response.json();
    } catch (_e) {
      return { status: 'error', message: 'Connection error' };
    }

  }

  try {
    const result = await fetchMoodle('local_skillsaint_activate_account', { email, code });
    return result;
  } catch (_e) {
    return { status: 'error', message: 'Connection error' };
  }

}

/**
 * Checks if user is activated
 */
export async function checkActivation(email: string) {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_check_activation", params: { email } }),
      });
      const result = await response.json();
      return result.is_activated === 1;
    } catch (_e) {
      return false;
    }

  }

  try {
    const result = await fetchMoodle('local_skillsaint_check_activation', { email });
    return result.is_activated === 1;
  } catch (_e) {
    return false;
  }

}
