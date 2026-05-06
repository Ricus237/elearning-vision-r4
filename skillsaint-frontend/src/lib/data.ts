import { CourseType } from "@/types/CourseType";
import { getPublicCourses, getMoodleSiteData, fetchMoodle, getMoodleCategories } from "./moodle";
import { CategoryType } from "@/types/CategoryType";
export { getMoodleSiteData };

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
  } catch {
    console.warn("Could not fetch real courses, using fallbacks.");
  }


  // Fallback / Mock data if Moodle is not connected or empty
  return [
    {
      _id: "1",
      title: "Introduction to Biblical Studies",
      shortDescription: "Learn the basics of interpreting sacred texts and understanding their context.",
      instructor: {
        name: "Global Bible Institute Team"
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
        name: "Global Bible Institute Expert"
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
    mission: { title: "Our Mission", content: "To form mature believers who impact every sphere of society with biblical truth." },
    vision: { title: "Our Vision", content: "To cultivate believers who transform every sphere of society." },
    about: {
      hero_title: "Our Identity & Vision",
      founder_title: "Welcome Letter from Founder",
      founder_content: "Welcome to the Global Bible Institute.\n\nWe are committed to raising a generation of leaders rooted in the Word of God.",
      founder_name: "In Christ, Our Founder",
      goal_title: "Our Goal",
      goal_content: "Raising a generation of leaders equipped with biblical foundations and global vision."
    },
    programs: {
      hero_title: "Academic Programs",
      hero_desc: "Equipping the next generation of spiritual and global leaders.",
      hero_image: "/program.jpg",
      core_title: "Kingdom Foundations",
      core_items: ["40-minute pre-recorded lessons", "Daily journaling", "Practical assignments"],
      floating: {
        badge_1: "Academic Excellence",
        subtitle_1: "Rigorous Study",
        badge_2: "Certified Curriculum"
      }
    },
    enrollment: {
      hero_title: "Apply to GBI",
      hero_desc: "Complete your application form and choose your program.",
      plans: {
        standard: { price: 299, quota: 3 },
        premium: { price: 499, quota: 6 },
        executive: { price: 999, quota: Infinity }
      },
      security_note: "Your data is protected. Payment is processed securely."
    },
    highlights: {
      curriculum_title: "Curriculum Overview",
      curriculum_desc: "Discover our Kingdom Foundations program, subjects, and study schedule.",
      apply_title: "Application Form",
      apply_desc: "Ready to join? Start your application process here and join our global community.",
      footer_description: "A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God",
      home_floating: {
        badge_1: "Global Leadership Community",
        subtitle_1: "Join the Vision",
        badge_2: "Accredited Programs"
      },
    },
    home_hero_image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=2070",
    auth: {
      login_title: "LOGIN",
      login_subtitle: "How to i get started?",
      login_bg: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029",
      login_image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1974",
      forgot_title: "Forgot Password",
      forgot_subtitle: "Enter your email to reset your password"
    }
  };

  try {
    const data = await fetchMoodle('local_skillsaint_get_all_site_data');
    if (data && !data.error) {
       return {
          hero_badge: data.hero_badge || defaultData.hero_badge,
          mission: { title: data.mission_title || defaultData.mission.title, content: data.mission_content || defaultData.mission.content },
          vision: { title: data.vision_title || defaultData.vision.title, content: data.vision_content || defaultData.vision.content },
          home_hero_image: data.home_hero_image || defaultData.home_hero_image,
          auth: {
            login_title: data.auth_login_title || defaultData.auth.login_title,
            login_subtitle: data.auth_login_subtitle || defaultData.auth.login_subtitle,
            login_bg: data.auth_login_bg || defaultData.auth.login_bg,
            login_image: data.auth_login_image || defaultData.auth.login_image,
            forgot_title: data.auth_forgot_title || defaultData.auth.forgot_title,
            forgot_subtitle: data.auth_forgot_subtitle || defaultData.auth.forgot_subtitle
          },
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
            hero_image: data.programs_hero_image || defaultData.programs.hero_image,
            core_title: data.core_program_title || defaultData.programs.core_title,
            core_items: data.core_program_items ? data.core_program_items.split('\n').filter(Boolean) : defaultData.programs.core_items,
            floating: {
              badge_1: data.programs_floating_badge_1 || defaultData.programs.floating.badge_1,
              subtitle_1: data.programs_floating_subtitle_1 || defaultData.programs.floating.subtitle_1,
              badge_2: data.programs_floating_badge_2 || defaultData.programs.floating.badge_2
            }
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
          },
          highlights: {
            curriculum_title: data.highlight_curriculum_title || defaultData.highlights.curriculum_title,
            curriculum_desc: data.highlight_curriculum_desc || defaultData.highlights.curriculum_desc,
            apply_title: data.highlight_apply_title || defaultData.highlights.apply_title,
            apply_desc: data.highlight_apply_desc || defaultData.highlights.apply_desc,
            footer_description: data.footer_description || defaultData.highlights.footer_description,
            home_floating: {
              badge_1: data.home_floating_badge_1 || defaultData.highlights.home_floating.badge_1,
              subtitle_1: data.home_floating_subtitle_1 || defaultData.highlights.home_floating.subtitle_1,
              badge_2: data.home_floating_badge_2 || defaultData.highlights.home_floating.badge_2
            }
          }
       };
    }
  } catch (_e) {
    console.error("Database plugin error, using fallbacks:", _e);
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

    const result = await fetchMoodle('local_skillsaint_save_application', payload);
    return result || { error: true };
  } catch (_e) {
    console.error("Failed to save application:", _e);
    return { error: true };
  }

}

/**
 * Confirms payment and enrolls user.
 */
export async function confirmPayment(email: string, amount: number = 0, method: string = "", transactionId: string = "", userId: number = 0) {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          function: "local_skillsaint_confirm_payment", 
          params: { email, amount, method, transaction_id: transactionId, userid: userId } 
        }),
      });
      return await response.json();
    } catch (_e) {
      console.error("Browser-side confirmPayment error:", _e);
      return { status: "error", message: "Network error" };
    }
  }

  try {
    const result = await fetchMoodle("local_skillsaint_confirm_payment", { 
      email, 
      amount, 
      method, 
      transaction_id: transactionId,
      userid: userId
    });
    return result || { status: "error", message: "Empty response" };
  } catch (_e) {
    console.error("Server-side confirmPayment error:", _e);
    return { status: "error", message: "Database connection error" };
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
    } catch {
      return { status: 'error', message: 'Connection error' };
    }

  }

  try {
    const result = await fetchMoodle('local_skillsaint_activate_account', { email, code });
    return result;
  } catch {
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
    } catch {
      return false;
    }

  }

  try {
    const result = await fetchMoodle('local_skillsaint_check_activation', { email });
    return result.is_activated === 1;
  } catch {
    return false;
  }

}

export async function getCoursesWithCategories(): Promise<{ courses: CourseType[], categories: CategoryType[] }> {
    const [courses, categories] = await Promise.all([
        getAllCourses(),
        getMoodleCategories()
    ]);
    return { courses, categories };
}
