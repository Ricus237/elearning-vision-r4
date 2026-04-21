<?php
defined('MOODLE_INTERNAL') || die();
require_once("$CFG->libdir/externallib.php");

class local_skillsaint_external extends external_api
{

    /**
     * Set/Update application data before payment.
     */
    public static function save_application_parameters()
    {
        return new external_function_parameters(array(
            'fullname' => new external_value(PARAM_TEXT, 'User full name'),
            'email' => new external_value(PARAM_RAW, 'User email address'),
            'phone' => new external_value(PARAM_TEXT, 'Phone number'),
            'address' => new external_value(PARAM_TEXT, 'Mailing address'),
            'motivation' => new external_value(PARAM_TEXT, 'Enrollment goals/motivation'),
            'spiritual_info' => new external_value(PARAM_TEXT, 'Spiritual background (serialized/json)'),
            'selected_plan' => new external_value(PARAM_TEXT, 'Selected plan ID'),
            'selected_courses' => new external_value(PARAM_TEXT, 'Comma separated course IDs'),
            'userid' => new external_value(PARAM_INT, 'User ID if available', VALUE_DEFAULT, 0),
        ));
    }

    public static function save_application($fullname, $email, $phone, $address, $motivation, $spiritual_info, $selected_plan, $selected_courses, $userid)
    {
        global $DB;
        $email = strtolower(trim($email));

        $record = new stdClass();
        $record->fullname = $fullname;
        $record->email = $email;
        $record->phone = $phone;
        $record->address = $address;
        $record->motivation = $motivation;
        $record->spiritual_bg = $spiritual_info;
        $record->selected_plan = $selected_plan;
        $record->selected_courses = $selected_courses;
        $record->userid = $userid;
        $record->timecreated = time();
        $record->timemodified = time();
        $record->payment_status = 'pending';

        // Check if application already exists for this email
        $existing = $DB->get_record('local_skillsaint_apps', array('email' => $email, 'payment_status' => 'pending'));
        if ($existing) {
            $record->id = $existing->id;
            unset($record->timecreated);
            $DB->update_record('local_skillsaint_apps', $record);
            return array('status' => 'updated', 'app_id' => $existing->id);
        } else {
            $id = $DB->insert_record('local_skillsaint_apps', $record);
            return array('status' => 'created', 'app_id' => $id);
        }
    }

    public static function save_application_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'created or updated'),
            'app_id' => new external_value(PARAM_INT, 'The application record ID'),
        ));
    }

    /**
     * Finalize application after payment: Update status, Create user, Enroll in courses.
     */
    public static function confirm_payment_parameters()
    {
        return new external_function_parameters(array(
            'email' => new external_value(PARAM_RAW, 'User email address to find the application'),
        ));
    }

    public static function confirm_payment($email)
    {
        global $DB, $CFG;
        $email = strtolower(trim($email));
        require_once($CFG->dirroot . '/user/lib.php');
        require_once($CFG->dirroot . '/enrol/externallib.php');

        // 1. Find the application
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $email));
        if (!$app) {
            throw new invalid_parameter_exception('No application found for this email: ' . $email);
        }

        // 2. If already paid, just return success (prevents error on refresh)
        if ($app->payment_status === 'paid') {
            return array(
                'status' => 'success',
                'user_id' => 0, // Should find actual user ID if needed
                'courses_enrolled' => 0,
                'activation_code' => $app->activation_code
            );
        }

        // 3. Mark as paid
        $app->payment_status = 'paid';
        $app->timemodified = time();
        $DB->update_record('local_skillsaint_apps', $app);

        // 3. Find or Create the Moodle user
        $user = $DB->get_record('user', array('email' => $email, 'mnethostid' => $CFG->mnet_localhost_id));
        if (!$user) {
            $usernew = new stdClass();
            $usernew->username = strtolower(str_replace(' ', '', $app->fullname)) . rand(100, 999);
            $usernew->email = $email;
            $usernew->firstname = explode(' ', $app->fullname)[0];
            $usernew->lastname = isset(explode(' ', $app->fullname)[1]) ? explode(' ', $app->fullname)[1] : 'Student';
            $usernew->auth = 'manual';
            $usernew->confirmed = 1;
            $usernew->password = hash_internal_user_password('Skillsaint2024!'); // Temporary password
            $user_id = user_create_user($usernew);
            $user = $DB->get_record('user', array('id' => $user_id));
        }

        // 4. Enroll in courses
        $course_ids = array();
        if ($app->selected_plan === 'executive') {
            // "Executive" Plan: Enroll in ALL visible courses automatically
            $all_courses = $DB->get_records('course', array('visible' => 1));
            foreach ($all_courses as $c) {
                if ($c->id != 1) { // Skip the main Moodle site course
                    $course_ids[] = $c->id;
                }
            }
        } else if (!empty($app->selected_courses)) {
            $course_ids = explode(',', $app->selected_courses);
        }

        if (!empty($course_ids)) {
            $enrol = enrol_get_plugin('manual');
            if ($enrol) {
                foreach ($course_ids as $cid) {
                    $cid = (int) trim($cid);
                    $course = $DB->get_record('course', array('id' => $cid));
                    if ($course) {
                        $instance = $DB->get_record('enrol', array('courseid' => $cid, 'enrol' => 'manual'), '*', IGNORE_MISSING);
                        if ($instance) {
                            $enrol->enrol_user($instance, $user->id, 5); // 5 is the standard student role ID
                        }
                    }
                }
            }
        }

        // 5. Generate activation code (Keep it for history, but activate automatically)
        $activation_code = 'IBI-' . rand(1000, 9999) . '-' . strtoupper(substr(md5(time()), 0, 4));
        $app->activation_code = $activation_code;
        $app->is_activated = 0; // Auto-activate after payment!
        $DB->update_record('local_skillsaint_apps', $app);

        return array(
            'status' => 'success',
            'user_id' => $user->id,
            'courses_enrolled' => count(explode(',', $app->selected_courses)),
            'activation_code' => $activation_code
        );
    }

    public static function confirm_payment_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error'),
            'user_id' => new external_value(PARAM_INT, 'The Moodle user ID'),
            'courses_enrolled' => new external_value(PARAM_INT, 'Number of courses enrolled'),
            'activation_code' => new external_value(PARAM_TEXT, 'The activation code to be sent by admin'),
        ));
    }

    /**
     * Verify activation code and unlock account.
     */
    public static function activate_account_parameters()
    {
        return new external_function_parameters(array(
            'email' => new external_value(PARAM_RAW, 'User email address'),
            'code' => new external_value(PARAM_TEXT, 'The activation code entered by user'),
        ));
    }

    public static function activate_account($email, $code)
    {
        global $DB;
        $email = strtolower(trim($email));
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $email));
        if (!$app) {
            return array('status' => 'error', 'message' => 'Application not found');
        }

        if ($app->is_activated == 1) {
            return array('status' => 'success', 'message' => 'Already activated');
        }

        // Master Code for testing !
        if (trim($code) === '0000') {
            $app->is_activated = 1;
            $DB->update_record('local_skillsaint_apps', $app);
            return array('status' => 'success', 'message' => 'Dev Master Code accepted');
        }

        if ($app->activation_code !== trim($code)) {
            return array('status' => 'error', 'message' => 'Invalid activation code');
        }

        $app->is_activated = 1;
        $app->timemodified = time();
        $DB->update_record('local_skillsaint_apps', $app);
        return array('status' => 'success', 'message' => 'Account unlocked!');
    }

    public static function activate_account_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Check if an account is activated.
     */
    public static function check_activation_parameters()
    {
        return new external_function_parameters(array(
            'email' => new external_value(PARAM_RAW, 'User email address'),
        ));
    }

    public static function check_activation($email)
    {
        global $DB;
        $email = strtolower(trim($email));
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $email));
        if ($app) {
            return array('is_activated' => (int) $app->is_activated);
        }
        return array('is_activated' => 0);
    }

    public static function check_activation_returns()
    {
        return new external_single_structure(array(
            'is_activated' => new external_value(PARAM_INT, '1 if active, 0 otherwise'),
        ));
    }


    public static function get_all_site_data_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_all_site_data()
    {
        return array(
            'hero_badge' => get_config('local_skillsaint', 'hero_badge'),
            'mission_title' => get_config('local_skillsaint', 'mission_title'),
            'mission_content' => get_config('local_skillsaint', 'mission_content'),
            'vision_title' => get_config('local_skillsaint', 'vision_title'),
            'vision_content' => get_config('local_skillsaint', 'vision_content'),

            'about_hero_title' => get_config('local_skillsaint', 'about_hero_title'),
            'founder_title' => get_config('local_skillsaint', 'founder_title'),
            'founder_content' => get_config('local_skillsaint', 'founder_content'),
            'founder_name' => get_config('local_skillsaint', 'founder_name'),
            'goal_title' => get_config('local_skillsaint', 'goal_title'),
            'goal_content' => get_config('local_skillsaint', 'goal_content'),

            'programs_hero_title' => get_config('local_skillsaint', 'programs_hero_title'),
            'programs_hero_desc' => get_config('local_skillsaint', 'programs_hero_desc'),
            'core_program_title' => get_config('local_skillsaint', 'core_program_title'),
            'core_program_items' => get_config('local_skillsaint', 'core_program_items'),

            'apply_hero_title' => get_config('local_skillsaint', 'apply_hero_title'),
            'apply_hero_desc' => get_config('local_skillsaint', 'apply_hero_desc'),
            'price_standard' => get_config('local_skillsaint', 'price_standard'),
            'quota_standard' => get_config('local_skillsaint', 'quota_standard'),
            'price_premium' => get_config('local_skillsaint', 'price_premium'),
            'quota_premium' => get_config('local_skillsaint', 'quota_premium'),
            'price_executive' => get_config('local_skillsaint', 'price_executive'),
            'security_note' => get_config('local_skillsaint', 'security_note'),

            'highlight_curriculum_title' => get_config('local_skillsaint', 'highlight_curriculum_title'),
            'highlight_curriculum_desc' => get_config('local_skillsaint', 'highlight_curriculum_desc'),
            'highlight_apply_title' => get_config('local_skillsaint', 'highlight_apply_title'),
            'highlight_apply_desc' => get_config('local_skillsaint', 'highlight_apply_desc'),
            'footer_description' => get_config('local_skillsaint', 'footer_description'),
            'home_hero_image' => get_config('local_skillsaint', 'home_hero_image'),
            'programs_hero_image' => get_config('local_skillsaint', 'programs_hero_image'),
            'home_floating_badge_1' => get_config('local_skillsaint', 'home_floating_badge_1'),
            'home_floating_subtitle_1' => get_config('local_skillsaint', 'home_floating_subtitle_1'),
            'home_floating_badge_2' => get_config('local_skillsaint', 'home_floating_badge_2'),
            'programs_floating_badge_1' => get_config('local_skillsaint', 'programs_floating_badge_1'),
            'programs_floating_subtitle_1' => get_config('local_skillsaint', 'programs_floating_subtitle_1'),
            'programs_floating_badge_2' => get_config('local_skillsaint', 'programs_floating_badge_2'),
        );
    }

    public static function get_all_site_data_returns()
    {
        return new external_single_structure(array(
            'hero_badge' => new external_value(PARAM_TEXT, 'The hero badge label'),
            'mission_title' => new external_value(PARAM_TEXT, 'Mission section title'),
            'mission_content' => new external_value(PARAM_TEXT, 'Mission section content'),
            'vision_title' => new external_value(PARAM_TEXT, 'Vision section title'),
            'vision_content' => new external_value(PARAM_TEXT, 'Vision section content'),
            'about_hero_title' => new external_value(PARAM_TEXT, 'About page hero title'),
            'founder_title' => new external_value(PARAM_TEXT, 'Founder section title'),
            'founder_content' => new external_value(PARAM_TEXT, 'Founder section content'),
            'founder_name' => new external_value(PARAM_TEXT, 'Founder name'),
            'goal_title' => new external_value(PARAM_TEXT, 'Goal title'),
            'goal_content' => new external_value(PARAM_TEXT, 'Goal content'),
            'programs_hero_title' => new external_value(PARAM_TEXT, 'Programs page title'),
            'programs_hero_desc' => new external_value(PARAM_TEXT, 'Programs page desc'),
            'core_program_title' => new external_value(PARAM_TEXT, 'Core program title'),
            'core_program_items' => new external_value(PARAM_TEXT, 'Core program items list'),
            'apply_hero_title' => new external_value(PARAM_TEXT, 'Apply hero title'),
            'apply_hero_desc' => new external_value(PARAM_TEXT, 'Apply hero desc'),
            'price_standard' => new external_value(PARAM_TEXT, 'Standard Price'),
            'quota_standard' => new external_value(PARAM_TEXT, 'Standard Quota'),
            'price_premium' => new external_value(PARAM_TEXT, 'Premium Price'),
            'quota_premium' => new external_value(PARAM_TEXT, 'Premium Quota'),
            'price_executive' => new external_value(PARAM_TEXT, 'Executive Price'),
            'security_note' => new external_value(PARAM_TEXT, 'Security Note'),

            'highlight_curriculum_title' => new external_value(PARAM_TEXT, 'Highlight curriculum title', VALUE_DEFAULT, ''),
            'highlight_curriculum_desc' => new external_value(PARAM_RAW, 'Highlight curriculum desc', VALUE_DEFAULT, ''),
            'highlight_apply_title' => new external_value(PARAM_TEXT, 'Highlight apply title', VALUE_DEFAULT, ''),
            'highlight_apply_desc' => new external_value(PARAM_RAW, 'Highlight apply desc', VALUE_DEFAULT, ''),
            'footer_description' => new external_value(PARAM_RAW, 'Footer description', VALUE_DEFAULT, ''),
            'home_hero_image' => new external_value(PARAM_RAW, 'Home hero image URL', VALUE_DEFAULT, ''),
            'programs_hero_image' => new external_value(PARAM_RAW, 'Programs hero image URL', VALUE_DEFAULT, ''),
            'home_floating_badge_1' => new external_value(PARAM_TEXT, 'Home floating badge 1', VALUE_DEFAULT, ''),
            'home_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Home floating subtitle 1', VALUE_DEFAULT, ''),
            'home_floating_badge_2' => new external_value(PARAM_TEXT, 'Home floating badge 2', VALUE_DEFAULT, ''),
            'programs_floating_badge_1' => new external_value(PARAM_TEXT, 'Programs floating badge 1', VALUE_DEFAULT, ''),
            'programs_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Programs floating subtitle 1', VALUE_DEFAULT, ''),
            'programs_floating_badge_2' => new external_value(PARAM_TEXT, 'Programs floating badge 2', VALUE_DEFAULT, ''),
        ));
    }

    /**
     * Save all site content data.
     */
    public static function save_site_data_parameters()
    {
        return new external_function_parameters(array(
            'sitename' => new external_value(PARAM_TEXT, 'Site name', VALUE_DEFAULT, ''),
            'summary' => new external_value(PARAM_TEXT, 'Site summary / hero description', VALUE_DEFAULT, ''),
            'hero_badge' => new external_value(PARAM_TEXT, 'Hero badge', VALUE_DEFAULT, ''),
            'mission_title' => new external_value(PARAM_TEXT, 'Mission title', VALUE_DEFAULT, ''),
            'mission_content' => new external_value(PARAM_TEXT, 'Mission content', VALUE_DEFAULT, ''),
            'vision_title' => new external_value(PARAM_TEXT, 'Vision title', VALUE_DEFAULT, ''),
            'vision_content' => new external_value(PARAM_TEXT, 'Vision content', VALUE_DEFAULT, ''),
            'about_hero_title' => new external_value(PARAM_TEXT, 'About hero title', VALUE_DEFAULT, ''),
            'founder_title' => new external_value(PARAM_TEXT, 'Founder title', VALUE_DEFAULT, ''),
            'founder_content' => new external_value(PARAM_RAW, 'Founder content', VALUE_DEFAULT, ''),
            'founder_name' => new external_value(PARAM_TEXT, 'Founder name', VALUE_DEFAULT, ''),
            'goal_title' => new external_value(PARAM_TEXT, 'Goal title', VALUE_DEFAULT, ''),
            'goal_content' => new external_value(PARAM_TEXT, 'Goal content', VALUE_DEFAULT, ''),
            'programs_hero_title' => new external_value(PARAM_TEXT, 'Programs hero title', VALUE_DEFAULT, ''),
            'programs_hero_desc' => new external_value(PARAM_TEXT, 'Programs hero desc', VALUE_DEFAULT, ''),
            'core_program_title' => new external_value(PARAM_TEXT, 'Core program title', VALUE_DEFAULT, ''),
            'core_program_items' => new external_value(PARAM_RAW, 'Core program items', VALUE_DEFAULT, ''),
            'apply_hero_title' => new external_value(PARAM_TEXT, 'Apply hero title', VALUE_DEFAULT, ''),
            'apply_hero_desc' => new external_value(PARAM_TEXT, 'Apply hero desc', VALUE_DEFAULT, ''),
            'price_standard' => new external_value(PARAM_TEXT, 'Standard price', VALUE_DEFAULT, ''),
            'quota_standard' => new external_value(PARAM_TEXT, 'Standard quota', VALUE_DEFAULT, ''),
            'price_premium' => new external_value(PARAM_TEXT, 'Premium price', VALUE_DEFAULT, ''),
            'quota_premium' => new external_value(PARAM_TEXT, 'Premium quota', VALUE_DEFAULT, ''),
            'price_executive' => new external_value(PARAM_TEXT, 'Executive price', VALUE_DEFAULT, ''),
            'security_note' => new external_value(PARAM_TEXT, 'Security note', VALUE_DEFAULT, ''),
            'highlight_curriculum_title' => new external_value(PARAM_TEXT, 'Highlight curriculum title', VALUE_DEFAULT, ''),
            'highlight_curriculum_desc' => new external_value(PARAM_RAW, 'Highlight curriculum desc', VALUE_DEFAULT, ''),
            'highlight_apply_title' => new external_value(PARAM_TEXT, 'Highlight apply title', VALUE_DEFAULT, ''),
            'highlight_apply_desc' => new external_value(PARAM_RAW, 'Highlight apply desc', VALUE_DEFAULT, ''),
            'footer_description' => new external_value(PARAM_RAW, 'Footer description', VALUE_DEFAULT, ''),
            'home_hero_image' => new external_value(PARAM_RAW, 'Home hero image URL', VALUE_DEFAULT, ''),
            'programs_hero_image' => new external_value(PARAM_RAW, 'Programs hero image URL', VALUE_DEFAULT, ''),
            'home_floating_badge_1' => new external_value(PARAM_TEXT, 'Home floating badge 1', VALUE_DEFAULT, ''),
            'home_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Home floating subtitle 1', VALUE_DEFAULT, ''),
            'home_floating_badge_2' => new external_value(PARAM_TEXT, 'Home floating badge 2', VALUE_DEFAULT, ''),
            'programs_floating_badge_1' => new external_value(PARAM_TEXT, 'Programs floating badge 1', VALUE_DEFAULT, ''),
            'programs_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Programs floating subtitle 1', VALUE_DEFAULT, ''),
            'programs_floating_badge_2' => new external_value(PARAM_TEXT, 'Programs floating badge 2', VALUE_DEFAULT, ''),
        ));
    }

    public static function save_site_data(
        $sitename,
        $summary,
        $hero_badge,
        $mission_title,
        $mission_content,
        $vision_title,
        $vision_content,
        $about_hero_title,
        $founder_title,
        $founder_content,
        $founder_name,
        $goal_title,
        $goal_content,
        $programs_hero_title,
        $programs_hero_desc,
        $core_program_title,
        $core_program_items,
        $apply_hero_title,
        $apply_hero_desc,
        $price_standard,
        $quota_standard,
        $price_premium,
        $quota_premium,
        $price_executive,
        $security_note,
        $highlight_curriculum_title = '',
        $highlight_curriculum_desc = '',
        $highlight_apply_title = '',
        $highlight_apply_desc = '',
        $footer_description = '',
        $home_hero_image = '',
        $programs_hero_image = '',
        $home_floating_badge_1 = '',
        $home_floating_subtitle_1 = '',
        $home_floating_badge_2 = '',
        $programs_floating_badge_1 = '',
        $programs_floating_subtitle_1 = '',
        $programs_floating_badge_2 = ''
    ) {
        global $DB, $CFG;

        // 1. Update Moodle site name & summary (stored in the 'course' table, id=1 = site course)
        if (!empty($sitename) || !empty($summary)) {
            $site = $DB->get_record('course', array('id' => 1));
            if ($site) {
                if (!empty($sitename))
                    $site->fullname = $sitename;
                if (!empty($summary))
                    $site->summary = $summary;
                $site->timemodified = time();
                $DB->update_record('course', $site);
            }
        }

        // 2. Save all other fields to plugin config
        $fields = array(
            'hero_badge' => $hero_badge,
            'mission_title' => $mission_title,
            'mission_content' => $mission_content,
            'vision_title' => $vision_title,
            'vision_content' => $vision_content,
            'about_hero_title' => $about_hero_title,
            'founder_title' => $founder_title,
            'founder_content' => $founder_content,
            'founder_name' => $founder_name,
            'goal_title' => $goal_title,
            'goal_content' => $goal_content,
            'programs_hero_title' => $programs_hero_title,
            'programs_hero_desc' => $programs_hero_desc,
            'core_program_title' => $core_program_title,
            'core_program_items' => $core_program_items,
            'apply_hero_title' => $apply_hero_title,
            'apply_hero_desc' => $apply_hero_desc,
            'price_standard' => $price_standard,
            'quota_standard' => $quota_standard,
            'price_premium' => $price_premium,
            'quota_premium' => $quota_premium,
            'price_executive' => $price_executive,
            'security_note' => $security_note,
            'highlight_curriculum_title' => $highlight_curriculum_title,
            'highlight_curriculum_desc' => $highlight_curriculum_desc,
            'highlight_apply_title' => $highlight_apply_title,
            'highlight_apply_desc' => $highlight_apply_desc,
            'footer_description' => $footer_description,
            'home_hero_image' => $home_hero_image,
            'programs_hero_image' => $programs_hero_image,
            'home_floating_badge_1' => $home_floating_badge_1,
            'home_floating_subtitle_1' => $home_floating_subtitle_1,
            'home_floating_badge_2' => $home_floating_badge_2,
            'programs_floating_badge_1' => $programs_floating_badge_1,
            'programs_floating_subtitle_1' => $programs_floating_subtitle_1,
            'programs_floating_badge_2' => $programs_floating_badge_2,
        );

        foreach ($fields as $key => $value) {
            if ($value !== '') {
                set_config($key, $value, 'local_skillsaint');
            }
        }

        // 3. Purge caches so changes are reflected immediately
        purge_all_caches();

        return array('status' => 'success');
    }

    public static function save_site_data_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_TEXT, 'success or error'),
        ));
    }

    /**
     * Get all admin dashboard statistics from real DB data.
     */
    public static function get_admin_dashboard_stats_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_admin_dashboard_stats()
    {
        global $DB;

        // Count all enrolled students (users with at least 1 active enrollment, excluding admin)
        $total_students = $DB->count_records_sql(
            "SELECT COUNT(DISTINCT userid) FROM {user_enrolments} ue
             JOIN {enrol} e ON e.id = ue.enrolid
             WHERE e.courseid != 1"
        );

        // Count all visible, real courses (exclude site course id=1)
        $active_courses = $DB->count_records_select('course', 'id != 1 AND visible = 1');

        // Get last 5 registered students (real Moodle users) with their enrollment info
        $recent_users_sql = "
            SELECT u.id, u.firstname, u.lastname, u.email, u.timecreated,
                   COALESCE(apps.selected_plan, 'N/A') as plan,
                   COALESCE(apps.payment_status, 'N/A') as payment_status,
                   COALESCE(apps.is_activated, 0) as is_activated,
                   (SELECT COUNT(*) FROM {user_enrolments} ue2
                    JOIN {enrol} e2 ON e2.id = ue2.enrolid
                    WHERE ue2.userid = u.id AND e2.courseid != 1) as enrolled_count
            FROM {user} u
            LEFT JOIN {local_skillsaint_apps} apps ON apps.email = u.email
            WHERE u.id != 1 AND u.deleted = 0
            ORDER BY u.timecreated DESC
            LIMIT 5
        ";
        $recent_users_raw = $DB->get_records_sql($recent_users_sql);

        $recent_students = array();
        foreach ($recent_users_raw as $u) {
            $recent_students[] = array(
                'id' => (int) $u->id,
                'name' => trim($u->firstname . ' ' . $u->lastname),
                'email' => $u->email,
                'plan' => $u->plan,
                'payment_status' => $u->payment_status,
                'is_activated' => (int) $u->is_activated,
                'enrolled_count' => (int) $u->enrolled_count,
                'registered_at' => (int) $u->timecreated,
            );
        }

        // Count paid applications this month
        $first_of_month = mktime(0, 0, 0, date('n'), 1, date('Y'));
        $new_this_month = $DB->count_records_select(
            'local_skillsaint_apps',
            "payment_status = 'paid' AND timecreated >= ?",
            array($first_of_month)
        );

        // Total paid applications (revenue estimation)
        $total_paid = $DB->count_records('local_skillsaint_apps', array('payment_status' => 'paid'));

        // Count quizzes (exams)
        $total_quizzes = $DB->count_records('quiz');

        return array(
            'total_students' => (int) $total_students,
            'active_courses' => (int) $active_courses,
            'new_this_month' => (int) $new_this_month,
            'total_paid_apps' => (int) $total_paid,
            'total_quizzes' => (int) $total_quizzes,
            'recent_students' => $recent_students,
        );
    }

    public static function get_admin_dashboard_stats_returns()
    {
        return new external_single_structure(array(
            'total_students' => new external_value(PARAM_INT, 'Total enrolled students'),
            'active_courses' => new external_value(PARAM_INT, 'Number of active courses'),
            'new_this_month' => new external_value(PARAM_INT, 'New paid enrollments this month'),
            'total_paid_apps' => new external_value(PARAM_INT, 'Total paid applications ever'),
            'total_quizzes' => new external_value(PARAM_INT, 'Number of quizzes/exams'),
            'recent_students' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_INT, 'User ID'),
                    'name' => new external_value(PARAM_TEXT, 'Full name'),
                    'email' => new external_value(PARAM_TEXT, 'Email'),
                    'plan' => new external_value(PARAM_TEXT, 'Subscription plan'),
                    'payment_status' => new external_value(PARAM_TEXT, 'Payment status'),
                    'is_activated' => new external_value(PARAM_INT, 'Is account activated'),
                    'enrolled_count' => new external_value(PARAM_INT, 'Number of courses enrolled'),
                    'registered_at' => new external_value(PARAM_INT, 'Unix timestamp of registration'),
                ))
            ),
        ));
    }

    /**
     * Get all Moodle users for the admin students page.
     */
    public static function get_all_admin_users_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_all_admin_users()
    {
        global $DB;
        $sql = "
            SELECT u.id, u.firstname, u.lastname, u.email, u.suspended, u.timecreated, u.deleted,
                   COALESCE(apps.selected_plan, 'N/A') as plan,
                   COALESCE(apps.payment_status, 'N/A') as payment_status,
                   COALESCE(apps.is_activated, 0) as is_activated,
                   COALESCE(apps.activation_code, '') as activation_code,
                   (SELECT COUNT(*) FROM {user_enrolments} ue
                    JOIN {enrol} e ON e.id = ue.enrolid
                    WHERE ue.userid = u.id AND e.courseid != 1) as enrolled_count
            FROM {user} u
            LEFT JOIN {local_skillsaint_apps} apps ON apps.email = u.email
            WHERE u.id != 1 AND u.deleted = 0
            ORDER BY u.timecreated DESC
        ";
        $rows = $DB->get_records_sql($sql);

        $result = array();
        foreach ($rows as $r) {
            $result[] = array(
                'id' => (int) $r->id,
                'name' => trim($r->firstname . ' ' . $r->lastname),
                'email' => $r->email,
                'suspended' => (int) $r->suspended,
                'plan' => $r->plan,
                'payment_status' => $r->payment_status,
                'is_activated' => (int) $r->is_activated,
                'activation_code' => $r->activation_code,
                'enrolled_count' => (int) $r->enrolled_count,
                'registered_at' => (int) $r->timecreated,
            );
        }
        return $result;
    }

    public static function get_all_admin_users_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'User ID'),
                'name' => new external_value(PARAM_TEXT, 'Full name'),
                'email' => new external_value(PARAM_TEXT, 'Email'),
                'suspended' => new external_value(PARAM_INT, '1 if suspended'),
                'plan' => new external_value(PARAM_TEXT, 'Subscription plan'),
                'payment_status' => new external_value(PARAM_TEXT, 'Payment status'),
                'is_activated' => new external_value(PARAM_INT, '1 if activated'),
                'activation_code' => new external_value(PARAM_TEXT, 'Activation code'),
                'enrolled_count' => new external_value(PARAM_INT, 'Number of enrolled courses'),
                'registered_at' => new external_value(PARAM_INT, 'Unix timestamp'),
            ))
        );
    }

    /**
     * Get all paid applications for the finance page.
     */
    public static function get_all_paid_applications_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_all_paid_applications()
    {
        global $DB;
        $apps = $DB->get_records_select(
            'local_skillsaint_apps',
            "payment_status = 'paid'",
            null,
            'timecreated DESC',
            '*'
        );
        $result = array();
        foreach ($apps as $a) {
            $result[] = array(
                'id' => (int) $a->id,
                'fullname' => $a->fullname,
                'email' => $a->email,
                'selected_plan' => $a->selected_plan,
                'is_activated' => (int) $a->is_activated,
                'timecreated' => (int) $a->timecreated,
            );
        }
        return $result;
    }

    public static function get_all_paid_applications_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'App ID'),
                'fullname' => new external_value(PARAM_TEXT, 'Full name'),
                'email' => new external_value(PARAM_TEXT, 'Email'),
                'selected_plan' => new external_value(PARAM_TEXT, 'Plan'),
                'is_activated' => new external_value(PARAM_INT, '1 if activated'),
                'timecreated' => new external_value(PARAM_INT, 'Unix timestamp'),
            ))
        );
    }
    // ==========================================
    // NATIVE COURSE OPERATIONS
    // ==========================================

    public static function create_course_parameters()
    {
        return new external_function_parameters(array(
            'courses' => new external_multiple_structure(
                new external_single_structure(array(
                    'fullname' => new external_value(PARAM_TEXT, 'Course full name'),
                    'shortname' => new external_value(PARAM_TEXT, 'Course short name'),
                    'summary' => new external_value(PARAM_RAW, 'Course summary', VALUE_DEFAULT, ''),
                    'visible' => new external_value(PARAM_INT, '1 if visible, 0 hidden', VALUE_DEFAULT, 1),
                    'numsections' => new external_value(PARAM_INT, 'Number of sections', VALUE_DEFAULT, 4),
                    'format' => new external_value(PARAM_TEXT, 'Course format', VALUE_DEFAULT, 'topics'),
                    'startdate' => new external_value(PARAM_INT, 'Course start date', VALUE_DEFAULT, 0),
                    'enddate' => new external_value(PARAM_INT, 'Course end date', VALUE_DEFAULT, 0),
                    'categoryid' => new external_value(PARAM_INT, 'Category ID', VALUE_DEFAULT, 1),
                    'cover_image' => new external_value(PARAM_RAW, 'Base64 image content', VALUE_DEFAULT, ''),
                    'syllabus_pdf' => new external_value(PARAM_RAW, 'Base64 PDF content', VALUE_DEFAULT, ''),
                ))
            )
        ));
    }

    public static function create_course($courses)
    {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/course/lib.php');

        $params = self::validate_parameters(self::create_course_parameters(), array('courses' => $courses));
        $created_courses = array();

        $category = $DB->get_records_sql('SELECT id FROM {course_categories} ORDER BY sortorder ASC', null, 0, 1);
        $category_id = $category ? reset($category)->id : 1;

        foreach ($params['courses'] as $cdata) {
            $course = new stdClass();
            $course->fullname = $cdata['fullname'];
            $course->shortname = $cdata['shortname'];
            $course->summary = $cdata['summary'];
            $course->visible = $cdata['visible'];
            $course->category = !empty($cdata['categoryid']) ? $cdata['categoryid'] : $category_id;
            $course->startdate = $cdata['startdate'] ? $cdata['startdate'] : time();
            $course->format = $cdata['format'];
            if (!empty($cdata['enddate']))
                $course->enddate = $cdata['enddate'];

            $newcourse = create_course($course);

            // Handle Files
            $context = context_course::instance($newcourse->id);
            if (!empty($cdata['cover_image'])) {
                self::save_base64_file($cdata['cover_image'], $context->id, 'course', 'overviewfiles', 'cover_' . time() . '.png');
            }
            if (!empty($cdata['syllabus_pdf'])) {
                self::save_base64_file($cdata['syllabus_pdf'], $context->id, 'course', 'summaryfiles', 'syllabus_' . time() . '.pdf');
            }

            $created_courses[] = array('id' => $newcourse->id, 'shortname' => $newcourse->shortname);
        }
        return $created_courses;
    }

    public static function create_course_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'Course ID'),
                'shortname' => new external_value(PARAM_TEXT, 'Course short name'),
            ))
        );
    }

    public static function update_course_parameters()
    {
        return new external_function_parameters(array(
            'courses' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_INT, 'Course ID'),
                    'fullname' => new external_value(PARAM_TEXT, 'Course full name'),
                    'shortname' => new external_value(PARAM_TEXT, 'Course short name'),
                    'summary' => new external_value(PARAM_RAW, 'Course summary', VALUE_DEFAULT, ''),
                    'visible' => new external_value(PARAM_INT, '1 if visible, 0 hidden', VALUE_DEFAULT, 1),
                    'numsections' => new external_value(PARAM_INT, 'Number of sections', VALUE_DEFAULT, 4),
                    'format' => new external_value(PARAM_TEXT, 'Course format', VALUE_DEFAULT, 'topics'),
                    'startdate' => new external_value(PARAM_INT, 'Course start date', VALUE_DEFAULT, 0),
                    'enddate' => new external_value(PARAM_INT, 'Course end date', VALUE_DEFAULT, 0),
                    'categoryid' => new external_value(PARAM_INT, 'Category ID', VALUE_DEFAULT, 1),
                    'cover_image' => new external_value(PARAM_RAW, 'Base64 image content', VALUE_DEFAULT, ''),
                    'syllabus_pdf' => new external_value(PARAM_RAW, 'Base64 PDF content', VALUE_DEFAULT, ''),
                ))
            )
        ));
    }

    public static function update_course($courses)
    {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/course/lib.php');

        $params = self::validate_parameters(self::update_course_parameters(), array('courses' => $courses));

        foreach ($params['courses'] as $cdata) {
            $course = new stdClass();
            $course->id = $cdata['id'];
            $course->fullname = $cdata['fullname'];
            $course->shortname = $cdata['shortname'];
            $course->summary = $cdata['summary'];
            $course->visible = $cdata['visible'];
            if (!empty($cdata['categoryid']))
                $course->category = $cdata['categoryid'];
            if (!empty($cdata['startdate']))
                $course->startdate = $cdata['startdate'];
            if (!empty($cdata['enddate']))
                $course->enddate = $cdata['enddate'];
            if (!empty($cdata['format']))
                $course->format = $cdata['format'];

            update_course($course);

            // Handle Files
            $context = context_course::instance($cdata['id']);
            if (!empty($cdata['cover_image'])) {
                self::save_base64_file($cdata['cover_image'], $context->id, 'course', 'overviewfiles', 'cover_' . time() . '.png');
            }
            if (!empty($cdata['syllabus_pdf'])) {
                self::save_base64_file($cdata['syllabus_pdf'], $context->id, 'course', 'summaryfiles', 'syllabus_' . time() . '.pdf');
            }
        }
        return array('status' => 'success');
    }

    private static function save_base64_file($base64data, $contextid, $component, $filearea, $filename)
    {
        $fs = get_file_storage();
        if (strpos($base64data, ',') !== false) {
            $base64data = explode(',', $base64data)[1];
        }
        $content = base64_decode($base64data, true);
        if (!$content)
            return false;
        $fs->delete_area_files($contextid, $component, $filearea, 0);
        $filerecord = array(
            'contextid' => $contextid,
            'component' => $component,
            'filearea' => $filearea,
            'itemid' => 0,
            'filepath' => '/',
            'filename' => $filename,
        );
        return $fs->create_file_from_string($filerecord, $content);
    }

    public static function update_course_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'Status')
        ));
    }

    public static function delete_course_parameters()
    {
        return new external_function_parameters(array(
            'courseids' => new external_multiple_structure(
                new external_value(PARAM_INT, 'Course ID')
            )
        ));
    }

    public static function delete_course($courseids)
    {
        global $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        $params = self::validate_parameters(self::delete_course_parameters(), array('courseids' => $courseids));
        foreach ($params['courseids'] as $cid) {
            delete_course($cid, false);
        }
        return array('warnings' => array());
    }

    public static function delete_course_returns()
    {
        return new external_single_structure(array(
            'warnings' => new external_multiple_structure(
                new external_single_structure(array(
                    'item' => new external_value(PARAM_TEXT, '', VALUE_OPTIONAL),
                    'itemid' => new external_value(PARAM_INT, '', VALUE_OPTIONAL),
                    'warningcode' => new external_value(PARAM_ALPHANUM, '', VALUE_OPTIONAL),
                    'message' => new external_value(PARAM_TEXT, '', VALUE_OPTIONAL)
                )),
                'List of warnings',
                VALUE_OPTIONAL
            )
        ));
    }

    // ==========================================
    // SECTION OPERATIONS
    // ==========================================

    public static function rename_section_parameters()
    {
        return new external_function_parameters(array(
            'sectionid' => new external_value(PARAM_INT, 'Section ID'),
            'name' => new external_value(PARAM_TEXT, 'New section name'),
        ));
    }

    public static function rename_section($sectionid, $name)
    {
        global $DB;
        $section = $DB->get_record('course_sections', array('id' => $sectionid), '*', MUST_EXIST);
        $section->name = $name;
        $section->timemodified = time();
        $DB->update_record('course_sections', $section);
        return array('status' => 'success');
    }

    public static function rename_section_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error')
        ));
    }

    public static function add_section_parameters()
    {
        return new external_function_parameters(array(
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
        ));
    }

    public static function add_section($courseid)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);

        // Use standard Moodle core logic if available, otherwise manual
        $newsection = course_create_section($courseid, 0); // 0 appends to end
        return array('status' => 'success', 'sectionid' => $newsection->id);
    }

    public static function add_section_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success'),
            'sectionid' => new external_value(PARAM_INT, 'New section ID'),
        ));
    }

    // ==========================================
    // MODULE OPERATIONS
    // ==========================================

    public static function add_module_parameters()
    {
        return new external_function_parameters(array(
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'sectionid' => new external_value(PARAM_INT, 'Section ID'),
            'name' => new external_value(PARAM_TEXT, 'Module name'),
            'content' => new external_value(PARAM_RAW, 'Page content'),
        ));
    }

    public static function add_module($courseid, $sectionid, $name, $content)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        require_once($CFG->dirroot . '/mod/page/lib.php');

        $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
        $section = $DB->get_record('course_sections', array('id' => $sectionid), '*', MUST_EXIST);

        // 1. Create the Course Module (CM) entry
        $module = $DB->get_record('modules', array('name' => 'page'), '*', MUST_EXIST);

        $cw = new stdClass();
        $cw->course = $courseid;
        $cw->module = $module->id;
        $cw->instance = 0; // Will be updated
        $cw->section = $section->id;
        $cw->added = time();
        $cw->visible = 1;
        $cw->visibleoncoursepage = 1;

        $cmid = add_course_module($cw);

        // 2. Create the Page instance
        $page = new stdClass();
        $page->course = $courseid;
        $page->name = $name;
        $page->intro = $name;
        $page->introformat = FORMAT_HTML;
        $page->content = $content;
        $page->contentformat = FORMAT_HTML;
        $page->legacyfiles = 0;
        $page->printheading = 1;
        $page->printintro = 0;
        $page->display = 0;
        $page->coursemodule = $cmid;

        $instanceid = page_add_instance($page, null);

        // 3. Link CM to Instance
        $DB->set_field('course_modules', 'instance', $instanceid, array('id' => $cmid));

        // 4. Add to section and rebuild cache
        if (!empty($section->section)) {
            course_add_cm_to_section($course->id, $cmid, $section->section);
        }

        rebuild_course_cache($courseid, true);

        return array('status' => 'success', 'cmid' => $cmid);
    }

    public static function add_module_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success'),
            'cmid' => new external_value(PARAM_INT, 'New module ID'),
        ));
    }

    public static function update_module_content_parameters()
    {
        return new external_function_parameters(array(
            'cmid' => new external_value(PARAM_INT, 'Course module ID'),
            'content' => new external_value(PARAM_RAW, 'New HTML content for the page'),
        ));
    }

    public static function update_module_content($cmid, $content)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/course/lib.php');

        $params = self::validate_parameters(self::update_module_content_parameters(), array(
            'cmid' => $cmid,
            'content' => $content,
        ));

        // Get the course module
        $cm = $DB->get_record('course_modules', array('id' => $params['cmid']), '*', MUST_EXIST);
        $module = $DB->get_record('modules', array('id' => $cm->module), '*', MUST_EXIST);

        // Support Page, Label and Resource
        if ($module->name === 'page') {
            $DB->set_field('page', 'content', $params['content'], array('id' => $cm->instance));
            $DB->set_field('page', 'timemodified', time(), array('id' => $cm->instance));
        } else if ($module->name === 'label') {
            $DB->set_field('label', 'intro', $params['content'], array('id' => $cm->instance));
            $DB->set_field('label', 'timemodified', time(), array('id' => $cm->instance));
        } else if ($module->name === 'resource') {
            $DB->set_field('resource', 'intro', $params['content'], array('id' => $cm->instance));
            $DB->set_field('resource', 'timemodified', time(), array('id' => $cm->instance));
        } else {
            throw new moodle_exception('Module type is "' . $module->name . '". This type of content cannot be edited directly yet.');
        }

        rebuild_course_cache($cm->course, true);

        return array('status' => 'success');
    }

    public static function update_module_content_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success'),
        ));
    }

    public static function get_module_content_parameters()
    {
        return new external_function_parameters(array(
            'cmid' => new external_value(PARAM_INT, 'Course module ID'),
        ));
    }

    public static function get_module_content($cmid)
    {
        global $DB, $CFG;

        $params = self::validate_parameters(self::get_module_content_parameters(), array(
            'cmid' => $cmid,
        ));

        // Get the course module
        $cm = $DB->get_record('course_modules', array('id' => $params['cmid']), '*', MUST_EXIST);
        $module = $DB->get_record('modules', array('id' => $cm->module), '*', MUST_EXIST);

        $content = "";

        if ($module->name === 'page') {
            $page = $DB->get_record('page', array('id' => $cm->instance), '*', MUST_EXIST);
            $content = $page->content;
        } else if ($module->name === 'label') {
            $label = $DB->get_record('label', array('id' => $cm->instance), '*', MUST_EXIST);
            $content = $label->intro;
        } else if ($module->name === 'resource') {
            $res = $DB->get_record('resource', array('id' => $cm->instance), '*', MUST_EXIST);
            $content = $res->intro;
        }

        return array('status' => 'success', 'content' => $content);
    }

    public static function get_module_content_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success'),
            'content' => new external_value(PARAM_RAW, 'HTML content of the module'),
        ));
    }

    public static function delete_section_parameters()
    {
        return new external_function_parameters(array(
            'sectionid' => new external_value(PARAM_INT, 'Section ID to delete'),
        ));
    }

    public static function delete_section($sectionid)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/course/lib.php');

        $params = self::validate_parameters(self::delete_section_parameters(), array(
            'sectionid' => $sectionid,
        ));

        // Get section details
        $section = $DB->get_record('course_sections', array('id' => $params['sectionid']), '*', MUST_EXIST);
        $course = $DB->get_record('course', array('id' => $section->course), '*', MUST_EXIST);

        // Delete the section
        course_delete_section($course, $section, true, true);

        return array('status' => 'success');
    }

    public static function delete_section_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success'),
        ));
    }

    public static function get_courses_full_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_courses_full()
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/course/lib.php');

        $courses = $DB->get_records('course', array(), 'id ASC');
        $result = array();

        foreach ($courses as $c) {
            if ($c->id == 1)
                continue; // Skip site course

            $context = context_course::instance($c->id);
            $fs = get_file_storage();

            // Get Overview Files (Cover Image) as Base64 for instant display
            $overviewfiles = array();
            $files = $fs->get_area_files($context->id, 'course', 'overviewfiles', 0, 'itemid, filepath, filename', false);
            foreach ($files as $f) {
                $content = $f->get_content();
                $base64 = base64_encode($content);
                $mimetype = $f->get_mimetype();
                $datauri = 'data:' . $mimetype . ';base64,' . $base64;

                $overviewfiles[] = array(
                    'fileurl' => $datauri,
                    'filename' => $f->get_filename()
                );
                break; // Just need the first one for the cover
            }

            // Get Summary Files (Syllabus PDF) - Keep as URL for now or build correctly
            $summaryfiles = array();
            $files = $fs->get_area_files($context->id, 'course', 'summaryfiles', 0, 'itemid, filepath, filename', false);
            foreach ($files as $f) {
                $fileurl = $CFG->wwwroot . '/webservice/pluginfile.php/' . $f->get_contextid() . '/' . $f->get_component() . '/' . $f->get_filearea() . '/' . $f->get_itemid() . $f->get_filepath() . $f->get_filename();
                $summaryfiles[] = array(
                    'fileurl' => $fileurl,
                    'filename' => $f->get_filename()
                );
            }

            $result[] = array(
                'id' => $c->id,
                'fullname' => $c->fullname,
                'shortname' => $c->shortname,
                'summary' => $c->summary,
                'visible' => (int) $c->visible,
                'numsections' => (int) $c->numsections,
                'startdate' => (int) $c->startdate,
                'categoryid' => (int) $c->category,
                'overviewfiles' => $overviewfiles,
                'summaryfiles' => $summaryfiles
            );
        }

        return $result;
    }

    public static function get_courses_full_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'ID'),
                'fullname' => new external_value(PARAM_TEXT, 'Fullname'),
                'shortname' => new external_value(PARAM_TEXT, 'Shortname'),
                'summary' => new external_value(PARAM_RAW, 'Summary'),
                'visible' => new external_value(PARAM_INT, 'Visible'),
                'numsections' => new external_value(PARAM_INT, 'Numsections'),
                'startdate' => new external_value(PARAM_INT, 'Startdate'),
                'categoryid' => new external_value(PARAM_INT, 'Category ID'),
                'overviewfiles' => new external_multiple_structure(
                    new external_single_structure(array(
                        'fileurl' => new external_value(PARAM_RAW, 'File URL'),
                        'filename' => new external_value(PARAM_TEXT, 'File name')
                    ))
                ),
                'summaryfiles' => new external_multiple_structure(
                    new external_single_structure(array(
                        'fileurl' => new external_value(PARAM_RAW, 'File URL'),
                        'filename' => new external_value(PARAM_TEXT, 'File name')
                    ))
                ),
            ))
        );
    }

    /**
     * Get all quizzes for all courses.
     */
    public static function get_exams_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_exams()
    {
        global $DB;
        $quizzes = $DB->get_records_sql("
            SELECT q.id, q.course, q.name, q.intro, c.fullname as coursename,
                   (SELECT COUNT(*) FROM {quiz_slots} WHERE quizid = q.id) as questioncount
            FROM {quiz} q
            JOIN {course} c ON c.id = q.course
            ORDER BY q.course, q.id
        ");

        $results = array();
        foreach ($quizzes as $q) {
            $results[] = array(
                'id' => $q->id,
                'courseid' => (int) $q->course,
                'coursename' => $q->coursename,
                'name' => $q->name,
                'intro' => $q->intro,
                'questioncount' => (int) $q->questioncount
            );
        }
        return $results;
    }

    public static function get_exams_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'Quiz ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'coursename' => new external_value(PARAM_TEXT, 'Course Fullname'),
                'name' => new external_value(PARAM_TEXT, 'Quiz Name'),
                'intro' => new external_value(PARAM_RAW, 'Quiz Intro'),
                'questioncount' => new external_value(PARAM_INT, 'Number of questions')
            ))
        );
    }

    /**
     * Create a multichoice question and add it to a quiz.
     */
    public static function create_question_parameters()
    {
        return new external_function_parameters(array(
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'quizid' => new external_value(PARAM_INT, 'Quiz ID to add question to'),
            'name' => new external_value(PARAM_TEXT, 'Question name'),
            'text' => new external_value(PARAM_RAW, 'Question text'),
            'answers' => new external_multiple_structure(
                new external_single_structure(array(
                    'text' => new external_value(PARAM_RAW, 'Answer text'),
                    'fraction' => new external_value(PARAM_FLOAT, 'Fraction (1.0 for correct, 0.0 for wrong)')
                ))
            ),
            'mark' => new external_value(PARAM_FLOAT, 'Question mark/weight', VALUE_DEFAULT, 1.0)
        ));
    }

    public static function create_question($courseid, $quizid, $name, $text, $answers, $mark = 1.0)
    {
        global $DB, $USER, $CFG;
        require_once($CFG->libdir . '/questionlib.php');
        require_once($CFG->dirroot . '/mod/quiz/locallib.php');

        // 1. Get or create default category for the course
        $context = context_course::instance($courseid);
        $category = question_make_default_categories(array($context));

        // 2. Filter non-empty answers
        $validanswers = array();
        foreach ($answers as $a) {
            if (!empty(trim($a['text']))) {
                $validanswers[] = $a;
            }
        }

        if (count($validanswers) < 2) {
            return array('status' => 'error', 'error' => 'A multichoice question requires at least 2 non-empty answers.');
        }

        // 3. Insert question directly into DB
        $now = time();
        $question = new stdClass();
        $question->category = $category->id;
        $question->parent = 0;
        $question->name = $name;
        $question->questiontext = $text;
        $question->questiontextformat = FORMAT_HTML;
        $question->generalfeedback = '';
        $question->generalfeedbackformat = FORMAT_HTML;
        $question->defaultmark = $mark;
        $question->penalty = 0.3333333;
        $question->qtype = 'multichoice';
        $question->length = 1;
        $question->stamp = make_unique_id_code();
        $question->version = make_unique_id_code();
        $question->hidden = 0;
        $question->timecreated = $now;
        $question->timemodified = $now;
        $question->createdby = $USER->id;
        $question->modifiedby = $USER->id;
        $question->id = $DB->insert_record('question', $question);

        // 3b. Moodle 4.x: Insert question_bank_entries and question_versions
        $qbe = new stdClass();
        $qbe->questioncategoryid = $category->id;
        $qbe->idnumber = null;
        $qbe->ownerid = $USER->id;
        $qbe->id = $DB->insert_record('question_bank_entries', $qbe);

        $qv = new stdClass();
        $qv->questionbankentryid = $qbe->id;
        $qv->version = 1;
        $qv->questionid = $question->id;
        $qv->status = 'ready';
        $DB->insert_record('question_versions', $qv);

        // 4. Insert multichoice options
        $options = new stdClass();
        $options->questionid = $question->id;
        $options->layout = 0;
        $options->answers = '';
        $options->single = 1;
        $options->shuffleanswers = 1;
        $options->correctfeedback = '';
        $options->correctfeedbackformat = FORMAT_HTML;
        $options->partiallycorrectfeedback = '';
        $options->partiallycorrectfeedbackformat = FORMAT_HTML;
        $options->incorrectfeedback = '';
        $options->incorrectfeedbackformat = FORMAT_HTML;
        $options->answernumbering = 'abc';
        $options->shownumcorrect = 0;
        $options->showstandardinstruction = 0;
        $DB->insert_record('qtype_multichoice_options', $options);

        // 5. Insert each answer
        foreach ($validanswers as $a) {
            $ans = new stdClass();
            $ans->question = $question->id;
            $ans->answer = $a['text'];
            $ans->answerformat = FORMAT_HTML;
            $ans->fraction = (float) $a['fraction'];
            $ans->feedback = '';
            $ans->feedbackformat = FORMAT_HTML;
            $DB->insert_record('question_answers', $ans);
        }

        // 6. Link to quiz
        if ($quizid) {
            $quiz = $DB->get_record('quiz', array('id' => $quizid), '*', MUST_EXIST);
            quiz_add_quiz_question($question->id, $quiz);
        }

        return array('status' => 'success', 'questionid' => $question->id);
    }

    public static function create_question_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'Status of the operation'),
            'questionid' => new external_value(PARAM_INT, 'The created question ID')
        ));
    }

    /**
     * Delete a question from a quiz (removes from slots).
     */
    public static function delete_question_parameters()
    {
        return new external_function_parameters(array(
            'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
            'questionid' => new external_value(PARAM_INT, 'Question ID')
        ));
    }

    public static function delete_question($quizid, $questionid)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/quiz/locallib.php');

        // 1. Trouver l'entrée dans la banque de questions
        $qv = $DB->get_record('question_versions', array('questionid' => $questionid));
        if (!$qv) {
            return array('status' => 'success');
        }

        // 2. Trouver le numéro de slot dans le quiz pour cette question
        $sql = "SELECT s.slot 
                FROM {quiz_slots} s
                JOIN {question_references} r ON r.itemid = s.id
                WHERE s.quizid = ? 
                  AND r.component = 'mod_quiz' 
                  AND r.questionarea = 'slot'
                  AND r.questionbankentryid = ?";
                  
        $slotnumber = $DB->get_field_sql($sql, array($quizid, $qv->questionbankentryid));
        
        if ($slotnumber) {
            // Création de l'objet de paramètres attendu par Moodle 4.x
            $quizobj = \mod_quiz\quiz_settings::create($quizid);
            $structure = \mod_quiz\structure::create_for_quiz($quizobj);
            $structure->delete_slot($slotnumber);
        }

        return array('status' => 'success');
    }

    public static function delete_question_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error')
        ));
    }

    /**
     * Initialize a new Quiz in a course.
     */
    public static function init_exam_parameters()
    {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'The course ID'),
                'name' => new external_value(PARAM_TEXT, 'The quiz name', VALUE_DEFAULT, 'Final Assessment'),
            )
        );
    }

    public static function init_exam($courseid, $name)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/quiz/lib.php');
        require_once($CFG->dirroot . '/course/lib.php');

        // On vérifie si un quiz existe déjà pour éviter les doublons
        $existing = $DB->get_record('quiz', array('course' => $courseid, 'name' => $name));
        if ($existing) {
            return array('status' => 'success', 'quizid' => $existing->id);
        }

        $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);

        // Configuration de base du quiz
        $quiz = new stdClass();
        $quiz->course = $courseid;
        $quiz->name = $name;
        $quiz->intro = 'Auto-generated quiz from IBI Dashboard';
        $quiz->introformat = FORMAT_HTML;
        $quiz->timeopen = 0;
        $quiz->timeclose = 0;
        $quiz->timelimit = 0;
        $quiz->overduehandling = 'autosubmit';
        $quiz->graceperiod = 0;
        $quiz->preferredbehaviour = 'deferredfeedback';
        $quiz->attempts = 0;
        $quiz->attemptonlast = 0;
        $quiz->grademethod = 1; // QUIZ_GRADEHIGHEST
        $quiz->decimalpoints = 2;
        $quiz->questiondecimalpoints = -1;
        $quiz->reviewattempt = 69888;
        $quiz->reviewcorrectness = 4352;
        $quiz->reviewmarks = 4352;
        $quiz->reviewspecificfeedback = 4352;
        $quiz->reviewgeneralfeedback = 4352;
        $quiz->reviewrightanswer = 4352;
        $quiz->reviewoverallfeedback = 4352;
        $quiz->questionsperpage = 1;
        $quiz->navmethod = 'free';
        $quiz->shuffleanswers = 1;
        $quiz->sumgrades = 0;
        $quiz->grade = 100;
        $quiz->timecreated = time();
        $quiz->timemodified = time();
        $quiz->password = '';
        $quiz->subnet = '';
        $quiz->browsersecurity = '-';
        $quiz->delay1 = 0;
        $quiz->delay2 = 0;
        $quiz->showuserpicture = 0;
        $quiz->showblocks = 0;
        $quiz->completionattemptsexhausted = 0;
        $quiz->completionpass = 0;

        // Insertion en base
        $quiz->id = $DB->insert_record('quiz', $quiz);

        // Ajout au module de cours (pour qu'il soit visible)
        $module = $DB->get_record('modules', array('name' => 'quiz'));

        $cm = new stdClass();
        $cm->course = $courseid;
        $cm->module = $module->id;
        $cm->instance = $quiz->id;
        $cm->section = 0; // Section 0 (Général) par défaut
        $cm->idnumber = '';
        $cm->added = time();
        $cm->visible = 1;

        $cm->id = add_course_module($cm);

        // Placer dans la section 0
        $section = $DB->get_record('course_sections', array('course' => $courseid, 'section' => 0));
        if ($section) {
            $modorder = trim($section->sequence);
            if ($modorder) {
                $modorder .= ',' . $cm->id;
            } else {
                $modorder = $cm->id;
            }
            $DB->set_field('course_sections', 'sequence', $modorder, array('id' => $section->id));
        }

        // Reconstruire le cache du cours
        rebuild_course_cache($courseid, true);

        return array('status' => 'success', 'quizid' => $quiz->id);
    }

    public static function init_exam_returns()
    {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_TEXT, 'Success or Error'),
                'quizid' => new external_value(PARAM_INT, 'The created quiz ID', VALUE_OPTIONAL),
                'error' => new external_value(PARAM_TEXT, 'Error message', VALUE_OPTIONAL)
            )
        );
    }

    /**
     * Get all questions for a specific quiz.
     */
    public static function get_quiz_questions_parameters()
    {
        return new external_function_parameters(array(
            'quizid' => new external_value(PARAM_INT, 'The quiz ID')
        ));
    }

    public static function get_quiz_questions($quizid)
    {
        global $DB;

        $slots = $DB->get_records('quiz_slots', array('quizid' => $quizid), 'slot ASC');
        $questions = array();

        foreach ($slots as $slot) {
            // Moodle 4.x uses question_references
            $ref = $DB->get_record('question_references', array(
                'component' => 'mod_quiz',
                'questionarea' => 'slot',
                'itemid' => $slot->id
            ));

            if (!$ref)
                continue;

            $qv = $DB->get_record('question_versions', array('questionbankentryid' => $ref->questionbankentryid), '*', IGNORE_MISSING);
            if (!$qv)
                continue;

            $q = $DB->get_record('question', array('id' => $qv->questionid), '*', IGNORE_MISSING);
            if (!$q || $q->qtype !== 'multichoice')
                continue;

            $answers = $DB->get_records('question_answers', array('question' => $q->id), 'id ASC');
            $options_arr = array();
            $correct_idx = 0;
            $idx = 0;
            foreach ($answers as $ans) {
                $options_arr[] = array(
                    'text' => $ans->answer,
                    'fraction' => (float) $ans->fraction
                );
                if ($ans->fraction >= 1.0) {
                    $correct_idx = $idx;
                }
                $idx++;
            }

            $questions[] = array(
                'id' => $q->id,
                'name' => $q->name,
                'questiontext' => strip_tags($q->questiontext),
                'correct' => $correct_idx,
                'answers' => $options_arr
            );
        }

        return $questions;
    }

    public static function get_quiz_questions_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'Question ID'),
                'name' => new external_value(PARAM_TEXT, 'Question name'),
                'questiontext' => new external_value(PARAM_RAW, 'Question text'),
                'correct' => new external_value(PARAM_INT, 'Index of correct answer'),
                'answers' => new external_multiple_structure(
                    new external_single_structure(array(
                        'text' => new external_value(PARAM_RAW, 'Answer text'),
                        'fraction' => new external_value(PARAM_FLOAT, 'Fraction')
                    ))
                )
            ))
        );
    }

    /**
     * Get real dashboard data for a student.
     */
    public static function get_student_dashboard_data_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'User ID'),
        ));
    }

    public static function get_student_dashboard_data($userid)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/enrol/externallib.php');
        require_once($CFG->dirroot . '/course/lib.php');

        // 1. Plan & Profile Info
        $user = $DB->get_record('user', array('id' => $userid), 'email', MUST_EXIST);
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $user->email));
        
        $plan = $app ? $app->selected_plan : 'none';
        $phone = $app ? $app->phone : '';
        $address = $app ? $app->address : '';
        $motivation = $app ? $app->motivation : '';
        $spiritual_bg = $app ? $app->spiritual_bg : '';

        // 2. Enrolled Courses
        $courses_raw = enrol_get_users_courses($userid, true, 'id,fullname,shortname,summary,visible');
        $enrolled_courses = array();

        foreach ($courses_raw as $c) {
            if ($c->id == 1)
                continue;

            $context = context_course::instance($c->id);
            $fs = get_file_storage();
            $files = $fs->get_area_files($context->id, 'course', 'overviewfiles', 0, 'itemid, filepath, filename', false);
            $image_url = '';
            if ($files) {
                $file = reset($files);
                $image_url = moodle_url::make_pluginfile_url($file->get_contextid(), $file->get_component(), $file->get_filearea(), $file->get_itemid(), $file->get_filepath(), $file->get_filename())->out(false);
            }

            $enrolled_courses[] = array(
                'id' => (int) $c->id,
                'fullname' => $fullname = $c->fullname,
                'shortname' => $c->shortname,
                'summary' => strip_tags($c->summary),
                'image_url' => $image_url,
            );
        }

        // 3. Quizzes (Exams)
        $exams = array();
        if (!empty($enrolled_courses)) {
            $course_ids = array_map(function ($c) {
                return $c['id']; }, $enrolled_courses);
            list($insql, $inparams) = $DB->get_in_or_equal($course_ids);
            $quizzes = $DB->get_records_select('quiz', "course $insql", $inparams);

            foreach ($quizzes as $q) {
                $exams[] = array(
                    'id' => (int) $q->id,
                    'courseid' => (int) $q->course,
                    'name' => $q->name,
                    'timeLimit' => (int) $q->timelimit,
                    'intro' => strip_tags($q->intro),
                );
            }
        }

        return array(
            'plan' => $plan,
            'phone' => $phone,
            'address' => $address,
            'motivation' => $motivation,
            'spiritual_bg' => $spiritual_bg,
            'courses' => $enrolled_courses,
            'exams' => $exams,
        );
    }

    public static function get_student_dashboard_data_returns()
    {
        return new external_single_structure(array(
            'plan' => new external_value(PARAM_TEXT, 'User subscription plan'),
            'phone' => new external_value(PARAM_TEXT, 'User phone'),
            'address' => new external_value(PARAM_TEXT, 'User address'),
            'motivation' => new external_value(PARAM_TEXT, 'User motivation'),
            'spiritual_bg' => new external_value(PARAM_TEXT, 'User spiritual background info'),
            'courses' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_INT, 'Course ID'),
                    'fullname' => new external_value(PARAM_TEXT, 'Full name'),
                    'shortname' => new external_value(PARAM_TEXT, 'Short name'),
                    'summary' => new external_value(PARAM_RAW, 'Summary'),
                    'image_url' => new external_value(PARAM_RAW, 'Image URL'),
                ))
            ),
            'exams' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_INT, 'Quiz ID'),
                    'courseid' => new external_value(PARAM_INT, 'Course ID'),
                    'name' => new external_value(PARAM_TEXT, 'Quiz name'),
                    'timeLimit' => new external_value(PARAM_INT, 'Time limit in seconds'),
                    'intro' => new external_value(PARAM_RAW, 'Intro text'),
                ))
            ),
        ));
    }

    // ============================================================
    // INQUIRY / STUDENT SUPPORT SYSTEM
    // ============================================================

    /**
     * Student sends an inquiry about a specific course.
     */
    public static function send_inquiry_parameters()
    {
        return new external_function_parameters(array(
            'userid'   => new external_value(PARAM_INT, 'Moodle user ID'),
            'courseid' => new external_value(PARAM_INT, 'Course this inquiry relates to'),
            'subject'  => new external_value(PARAM_TEXT, 'Short inquiry subject'),
            'message'  => new external_value(PARAM_RAW,  'Full message content'),
        ));
    }

    public static function send_inquiry($userid, $courseid, $subject, $message)
    {
        global $DB;
        $params = self::validate_parameters(self::send_inquiry_parameters(), array(
            'userid'   => $userid,
            'courseid' => $courseid,
            'subject'  => $subject,
            'message'  => $message,
        ));

        $record = new stdClass();
        $record->userid      = $params['userid'];
        $record->courseid    = $params['courseid'];
        $record->subject     = $params['subject'];
        $record->message     = $params['message'];
        $record->admin_reply = null;
        $record->status      = 'open';
        $record->timecreated = time();
        $record->timemodified = time();

        $id = $DB->insert_record('local_skillsaint_inquiries', $record);

        // Also insert into messages table for the first message
        $msg = new stdClass();
        $msg->inquiry_id  = $id;
        $msg->userid      = $params['userid'];
        $msg->message     = $params['message'];
        $msg->timecreated = time();
        $DB->insert_record('local_skillsaint_messages', $msg);

        return array('status' => 'success', 'inquiry_id' => (int)$id);
    }

    public static function send_inquiry_returns()
    {
        return new external_single_structure(array(
            'status'     => new external_value(PARAM_TEXT, 'success or error'),
            'inquiry_id' => new external_value(PARAM_INT, 'ID of created inquiry'),
        ));
    }

    /**
     * Get all inquiries (admin view) with student + course info.
     */
    public static function get_all_inquiries_parameters()
    {
        return new external_function_parameters(array(
            'status_filter' => new external_value(PARAM_TEXT, 'Filter: all, open, replied, resolved', VALUE_DEFAULT, 'all'),
        ));
    }

    public static function get_all_inquiries($status_filter = 'all')
    {
        global $DB;
        $params = self::validate_parameters(self::get_all_inquiries_parameters(), array(
            'status_filter' => $status_filter,
        ));

        $where = '';
        $sqlparams = array();
        if ($params['status_filter'] !== 'all') {
            $where = 'WHERE inq.status = ?';
            $sqlparams[] = $params['status_filter'];
        }

        $sql = "
            SELECT inq.id, inq.userid, inq.courseid, inq.subject, inq.message,
                   inq.admin_reply, inq.status, inq.timecreated, inq.timemodified,
                   u.firstname, u.lastname, u.email,
                   c.fullname as coursename
            FROM {local_skillsaint_inquiries} inq
            JOIN {user} u ON u.id = inq.userid
            LEFT JOIN {course} c ON c.id = inq.courseid
            $where
            ORDER BY inq.timecreated DESC
        ";

        $rows = $DB->get_records_sql($sql, $sqlparams);
        $result = array();
        foreach ($rows as $r) {
            // Fetch messages for this inquiry
            $messages_rows = $DB->get_records('local_skillsaint_messages', array('inquiry_id' => $r->id), 'timecreated ASC');
            $messages = array();
            foreach ($messages_rows as $m) {
                $messages[] = array(
                    'id'          => (int) $m->id,
                    'userid'      => (int) $m->userid,
                    'message'     => $m->message,
                    'timecreated' => (int) $m->timecreated,
                );
            }

            $result[] = array(
                'id'           => (int) $r->id,
                'userid'       => (int) $r->userid,
                'student_name' => trim($r->firstname . ' ' . $r->lastname),
                'student_email'=> $r->email,
                'courseid'     => (int) $r->courseid,
                'coursename'   => $r->coursename ?? 'General',
                'subject'      => $r->subject,
                'message'      => $r->message,
                'admin_reply'  => $r->admin_reply ?? '',
                'status'       => $r->status,
                'timecreated'  => (int) $r->timecreated,
                'timemodified' => (int) $r->timemodified,
                'messages'     => $messages,
            );
        }
        return $result;
    }

    public static function get_all_inquiries_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id'            => new external_value(PARAM_INT,  'Inquiry ID'),
                'userid'        => new external_value(PARAM_INT,  'Student user ID'),
                'student_name'  => new external_value(PARAM_TEXT, 'Student full name'),
                'student_email' => new external_value(PARAM_TEXT, 'Student email'),
                'courseid'      => new external_value(PARAM_INT,  'Course ID'),
                'coursename'    => new external_value(PARAM_TEXT, 'Course name'),
                'subject'       => new external_value(PARAM_TEXT, 'Inquiry subject'),
                'message'       => new external_value(PARAM_RAW,  'Student message'),
                'admin_reply'   => new external_value(PARAM_RAW,  'Admin reply if any'),
                'status'        => new external_value(PARAM_TEXT, 'open / replied / resolved'),
                'timecreated'   => new external_value(PARAM_INT,  'Unix timestamp'),
                'timemodified'  => new external_value(PARAM_INT,  'Unix timestamp'),
                'messages'      => new external_multiple_structure(
                    new external_single_structure(array(
                        'id'          => new external_value(PARAM_INT, 'Message ID'),
                        'userid'      => new external_value(PARAM_INT, 'Sender ID'),
                        'message'     => new external_value(PARAM_RAW, 'Content'),
                        'timecreated' => new external_value(PARAM_INT, 'Timestamp'),
                    ))
                ),
            ))
        );
    }

    /**
     * Admin replies to a student inquiry.
     */
    public static function reply_inquiry_parameters()
    {
        return new external_function_parameters(array(
            'inquiry_id' => new external_value(PARAM_INT,  'ID of the inquiry to reply to'),
            'reply'      => new external_value(PARAM_RAW,  'Admin reply message'),
            'status'     => new external_value(PARAM_TEXT, 'New status: replied or resolved', VALUE_DEFAULT, 'replied'),
        ));
    }

    public static function reply_inquiry($inquiry_id, $reply, $status = 'replied')
    {
        global $DB;
        $params = self::validate_parameters(self::reply_inquiry_parameters(), array(
            'inquiry_id' => $inquiry_id,
            'reply'      => $reply,
            'status'     => $status,
        ));

        $record = $DB->get_record('local_skillsaint_inquiries', array('id' => $params['inquiry_id']));
        if (!$record) {
            return array('status' => 'error', 'message' => 'Inquiry not found');
        }

        $record->admin_reply  = $params['reply'];
        $record->status       = in_array($params['status'], array('replied', 'resolved')) ? $params['status'] : 'replied';
        $record->timemodified = time();
        $DB->update_record('local_skillsaint_inquiries', $record);

        // Also insert into messages table
        $msg = new stdClass();
        $msg->inquiry_id  = $params['inquiry_id'];
        $msg->userid      = 0; // Admin (or we could pass admin ID)
        $msg->message     = $params['reply'];
        $msg->timecreated = time();
        $DB->insert_record('local_skillsaint_messages', $msg);

        return array('status' => 'success', 'message' => 'Reply saved');
    }

    public static function reply_inquiry_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Get student's own inquiries (with admin replies).
     */
    public static function get_student_inquiries_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'Student user ID'),
        ));
    }

    public static function get_student_inquiries($userid)
    {
        global $DB;
        $params = self::validate_parameters(self::get_student_inquiries_parameters(), array('userid' => $userid));

        $sql = "
            SELECT inq.id, inq.courseid, inq.subject, inq.message,
                   inq.admin_reply, inq.status, inq.timecreated, inq.timemodified,
                   c.fullname as coursename
            FROM {local_skillsaint_inquiries} inq
            LEFT JOIN {course} c ON c.id = inq.courseid
            WHERE inq.userid = ?
            ORDER BY inq.timecreated DESC
        ";
        $rows = $DB->get_records_sql($sql, array($params['userid']));

        $result = array();
        foreach ($rows as $r) {
            // Fetch messages
            $messages_rows = $DB->get_records('local_skillsaint_messages', array('inquiry_id' => $r->id), 'timecreated ASC');
            $messages = array();
            foreach ($messages_rows as $m) {
                $messages[] = array(
                    'id'          => (int) $m->id,
                    'userid'      => (int) $m->userid,
                    'message'     => $m->message,
                    'timecreated' => (int) $m->timecreated,
                );
            }

            $result[] = array(
                'id'           => (int) $r->id,
                'courseid'     => (int) $r->courseid,
                'coursename'   => $r->coursename ?? 'General',
                'subject'      => $r->subject,
                'message'      => $r->message,
                'admin_reply'  => $r->admin_reply ?? '',
                'status'       => $r->status,
                'timecreated'  => (int) $r->timecreated,
                'timemodified' => (int) $r->timemodified,
                'messages'     => $messages,
            );
        }
        return $result;
    }

    public static function get_student_inquiries_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id'           => new external_value(PARAM_INT,  'Inquiry ID'),
                'courseid'     => new external_value(PARAM_INT,  'Course ID'),
                'coursename'   => new external_value(PARAM_TEXT, 'Course name'),
                'subject'      => new external_value(PARAM_TEXT, 'Subject'),
                'message'      => new external_value(PARAM_RAW,  'Student message'),
                'admin_reply'  => new external_value(PARAM_RAW,  'Admin reply'),
                'status'       => new external_value(PARAM_TEXT, 'open / replied / resolved'),
                'timecreated'  => new external_value(PARAM_INT,  'Unix timestamp'),
                'timemodified' => new external_value(PARAM_INT,  'Unix timestamp'),
                'messages'      => new external_multiple_structure(
                    new external_single_structure(array(
                        'id'          => new external_value(PARAM_INT, 'Message ID'),
                        'userid'      => new external_value(PARAM_INT, 'Sender ID'),
                        'message'     => new external_value(PARAM_RAW, 'Content'),
                        'timecreated' => new external_value(PARAM_INT, 'Timestamp'),
                    ))
                ),
            ))
        );
    }

    // ============================================================
    // AVATAR / PROFILE PICTURE UPLOAD
    // ============================================================

    /**
     * Update user avatar from a Base64-encoded image string.
     */
    public static function update_avatar_parameters()
    {
        return new external_function_parameters(array(
            'userid'      => new external_value(PARAM_INT, 'Moodle user ID'),
            'imagebase64' => new external_value(PARAM_RAW, 'Base64-encoded image (with or without data: prefix)'),
        ));
    }

    public static function update_avatar($userid, $imagebase64)
    {
        global $DB, $CFG;
        require_once($CFG->libdir . '/gdlib.php');
        require_once($CFG->dirroot . '/user/lib.php');

        $params = self::validate_parameters(self::update_avatar_parameters(), array(
            'userid'      => $userid,
            'imagebase64' => $imagebase64,
        ));

        $user = $DB->get_record('user', array('id' => $params['userid']), '*', MUST_EXIST);

        // Strip base64 data prefix if present
        $b64 = $params['imagebase64'];
        if (strpos($b64, ',') !== false) {
            $b64 = explode(',', $b64)[1];
        }
        $imagedata = base64_decode($b64, true);
        if (!$imagedata) {
            return array('status' => 'error', 'message' => 'Invalid base64 image data');
        }

        // Write image to a temp file
        $tmpfile = tempnam(sys_get_temp_dir(), 'avatar_') . '.png';
        file_put_contents($tmpfile, $imagedata);

        // Use Moodle's native gdlib to process and save the icon
        $context = context_user::instance($user->id);
        $newpicture = process_new_icon($context, 'user', 'icon', 0, $tmpfile);
        @unlink($tmpfile);

        if ($newpicture) {
            $DB->set_field('user', 'picture', $newpicture, array('id' => $user->id));
            return array('status' => 'success', 'message' => 'Avatar updated successfully');
        }

        return array('status' => 'error', 'message' => 'Failed to process image');
    }

    public static function update_avatar_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Add a message to an existing inquiry thread (Student or Admin).
     */
    public static function add_inquiry_message_parameters()
    {
        return new external_function_parameters(array(
            'inquiry_id' => new external_value(PARAM_INT,  'ID of the inquiry'),
            'userid'     => new external_value(PARAM_INT,  'Moodle user ID of the sender'),
            'message'    => new external_value(PARAM_RAW,  'Message content'),
        ));
    }

    public static function add_inquiry_message($inquiry_id, $userid, $message)
    {
        global $DB;
        $params = self::validate_parameters(self::add_inquiry_message_parameters(), array(
            'inquiry_id' => $inquiry_id,
            'userid'     => $userid,
            'message'    => $message,
        ));

        // Insert message
        $record = new stdClass();
        $record->inquiry_id = $params['inquiry_id'];
        $record->userid     = $params['userid'];
        $record->message    = $params['message'];
        $record->timecreated = time();
        $DB->insert_record('local_skillsaint_messages', $record);

        // Update inquiry timestamp
        $DB->set_field('local_skillsaint_inquiries', 'timemodified', time(), array('id' => $params['inquiry_id']));

        // If it's a student replying, set status back to 'open' if it was 'replied'
        $inq = $DB->get_record('local_skillsaint_inquiries', array('id' => $params['inquiry_id']));
        if ($inq && $inq->status === 'replied' && $inq->userid == $params['userid']) {
            $DB->set_field('local_skillsaint_inquiries', 'status', 'open', array('id' => $params['inquiry_id']));
        }

        return array('status' => 'success', 'message' => 'Message added');
    }

    public static function add_inquiry_message_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Delete an inquiry and its messages (Student only).
     */
    public static function delete_inquiry_parameters()
    {
        return new external_function_parameters(array(
            'inquiry_id' => new external_value(PARAM_INT, 'ID of the inquiry to delete'),
            'userid'     => new external_value(PARAM_INT, 'User ID of the student requesting deletion'),
        ));
    }

    public static function delete_inquiry($inquiry_id, $userid)
    {
        global $DB;
        $params = self::validate_parameters(self::delete_inquiry_parameters(), array(
            'inquiry_id' => $inquiry_id,
            'userid'     => $userid,
        ));

        // Verify ownership
        $inquiry = $DB->get_record('local_skillsaint_inquiries', array('id' => $params['inquiry_id']));
        
        if (!$inquiry) {
            return array('status' => 'error', 'message' => 'Inquiry not found');
        }

        if ($inquiry->userid != $params['userid']) {
            return array('status' => 'error', 'message' => 'Not authorized to delete this inquiry');
        }

        // Delete all associated messages first
        $DB->delete_records('local_skillsaint_messages', array('inquiry_id' => $params['inquiry_id']));
        
        // Delete the inquiry itself
        $DB->delete_records('local_skillsaint_inquiries', array('id' => $params['inquiry_id']));

        return array('status' => 'success', 'message' => 'Inquiry deleted successfully');
    }

    public static function delete_inquiry_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Update student profile fields (synced with local_skillsaint_apps).
     */
    public static function update_student_profile_parameters()
    {
        return new external_function_parameters(array(
            'userid'     => new external_value(PARAM_INT, 'User ID'),
            'phone'      => new external_value(PARAM_TEXT, 'Phone number', VALUE_DEFAULT, ''),
            'address'    => new external_value(PARAM_TEXT, 'Mailing address', VALUE_DEFAULT, ''),
            'motivation' => new external_value(PARAM_TEXT, 'Motivation', VALUE_DEFAULT, ''),
            'spiritual_bg' => new external_value(PARAM_TEXT, 'Spiritual info', VALUE_DEFAULT, ''),
        ));
    }

    public static function update_student_profile($userid, $phone, $address, $motivation, $spiritual_bg)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/user/lib.php');

        $params = self::validate_parameters(self::update_student_profile_parameters(), array(
            'userid'     => $userid,
            'phone'      => $phone,
            'address'    => $address,
            'motivation' => $motivation,
            'spiritual_bg' => $spiritual_bg,
        ));

        $user = $DB->get_record('user', array('id' => $params['userid']), '*', MUST_EXIST);
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $user->email));

        if ($app) {
            $app->phone = $params['phone'];
            $app->address = $params['address'];
            $app->motivation = $params['motivation'];
            $app->spiritual_bg = $params['spiritual_bg'];
            $app->timemodified = time();
            $DB->update_record('local_skillsaint_apps', $app);
        }

        return array('status' => 'success', 'message' => 'Profile updated');
    }

    public static function update_student_profile_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Change student password (with old password verification).
     */
    public static function change_password_parameters()
    {
        return new external_function_parameters(array(
            'userid'           => new external_value(PARAM_INT, 'User ID'),
            'currentpassword'  => new external_value(PARAM_TEXT, 'Current password'),
            'newpassword'      => new external_value(PARAM_TEXT, 'New password'),
        ));
    }

    public static function change_password($userid, $currentpassword, $newpassword)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/user/lib.php');

        $params = self::validate_parameters(self::change_password_parameters(), array(
            'userid'           => $userid,
            'currentpassword'  => $currentpassword,
            'newpassword'      => $newpassword,
        ));

        $user = $DB->get_record('user', array('id' => $params['userid']), '*', MUST_EXIST);

        // Verify current password
        $authinstance = get_auth_plugin($user->auth);
        if (!$authinstance->user_login($user->username, $params['currentpassword'])) {
             return array('status' => 'error', 'message' => 'L\'ancien mot de passe est incorrect.');
        }

        // Update password
        $user->password = hash_internal_user_password($params['newpassword']);
        $user->timemodified = time();
        $DB->update_record('user', $user);

        return array('status' => 'success', 'message' => 'Mot de passe mis à jour avec succès.');
    }

    public static function change_password_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

}

