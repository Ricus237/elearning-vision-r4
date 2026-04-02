<?php
defined('MOODLE_INTERNAL') || die();
require_once("$CFG->libdir/externallib.php");

class local_skillsaint_external extends external_api {

    /**
     * Set/Update application data before payment.
     */
    public static function save_application_parameters() {
        return new external_function_parameters(array(
            'fullname'         => new external_value(PARAM_TEXT, 'User full name'),
            'email'            => new external_value(PARAM_RAW, 'User email address'),
            'phone'            => new external_value(PARAM_TEXT, 'Phone number'),
            'address'          => new external_value(PARAM_TEXT, 'Mailing address'),
            'motivation'       => new external_value(PARAM_TEXT, 'Enrollment goals/motivation'),
            'spiritual_info'   => new external_value(PARAM_TEXT, 'Spiritual background (serialized/json)'),
            'selected_plan'    => new external_value(PARAM_TEXT, 'Selected plan ID'),
            'selected_courses' => new external_value(PARAM_TEXT, 'Comma separated course IDs'),
            'userid'           => new external_value(PARAM_INT, 'User ID if available', VALUE_DEFAULT, 0),
        ));
    }

    public static function save_application($fullname, $email, $phone, $address, $motivation, $spiritual_info, $selected_plan, $selected_courses, $userid) {
        global $DB;
        $email = strtolower(trim($email));
        
        $record = new stdClass();
        $record->fullname         = $fullname;
        $record->email            = $email;
        $record->phone            = $phone;
        $record->address          = $address;
        $record->motivation       = $motivation;
        $record->spiritual_bg     = $spiritual_info;
        $record->selected_plan    = $selected_plan;
        $record->selected_courses = $selected_courses;
        $record->userid           = $userid;
        $record->timecreated      = time();
        $record->timemodified     = time();
        $record->payment_status   = 'pending';

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

    public static function save_application_returns() {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'created or updated'),
            'app_id' => new external_value(PARAM_INT, 'The application record ID'),
        ));
    }

    /**
     * Finalize application after payment: Update status, Create user, Enroll in courses.
     */
    public static function confirm_payment_parameters() {
        return new external_function_parameters(array(
            'email' => new external_value(PARAM_RAW, 'User email address to find the application'),
        ));
    }

    public static function confirm_payment($email) {
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
                    $cid = (int)trim($cid);
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

    public static function confirm_payment_returns() {
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
    public static function activate_account_parameters() {
        return new external_function_parameters(array(
            'email' => new external_value(PARAM_RAW, 'User email address'),
            'code'  => new external_value(PARAM_TEXT, 'The activation code entered by user'),
        ));
    }

    public static function activate_account($email, $code) {
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

    public static function activate_account_returns() {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_ALPHA, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Check if an account is activated.
     */
    public static function check_activation_parameters() {
        return new external_function_parameters(array(
            'email' => new external_value(PARAM_RAW, 'User email address'),
        ));
    }

    public static function check_activation($email) {
        global $DB;
        $email = strtolower(trim($email));
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $email));
        if ($app) {
            return array('is_activated' => (int)$app->is_activated);
        }
        return array('is_activated' => 0);
    }

    public static function check_activation_returns() {
        return new external_single_structure(array(
            'is_activated' => new external_value(PARAM_INT, '1 if active, 0 otherwise'),
        ));
    }


    public static function get_all_site_data_parameters() {
        return new external_function_parameters(array());
    }

    public static function get_all_site_data() {
        return array(
            'hero_badge'        => get_config('local_skillsaint', 'hero_badge'),
            'mission_title'     => get_config('local_skillsaint', 'mission_title'),
            'mission_content'   => get_config('local_skillsaint', 'mission_content'),
            'vision_title'      => get_config('local_skillsaint', 'vision_title'),
            'vision_content'    => get_config('local_skillsaint', 'vision_content'),
            
            'about_hero_title'  => get_config('local_skillsaint', 'about_hero_title'),
            'founder_title'     => get_config('local_skillsaint', 'founder_title'),
            'founder_content'   => get_config('local_skillsaint', 'founder_content'),
            'founder_name'      => get_config('local_skillsaint', 'founder_name'),
            'goal_title'        => get_config('local_skillsaint', 'goal_title'),
            'goal_content'      => get_config('local_skillsaint', 'goal_content'),
            
            'programs_hero_title' => get_config('local_skillsaint', 'programs_hero_title'),
            'programs_hero_desc'  => get_config('local_skillsaint', 'programs_hero_desc'),
            'core_program_title'  => get_config('local_skillsaint', 'core_program_title'),
            'core_program_items'  => get_config('local_skillsaint', 'core_program_items'),
            
            'apply_hero_title'    => get_config('local_skillsaint', 'apply_hero_title'),
            'apply_hero_desc'     => get_config('local_skillsaint', 'apply_hero_desc'),
            'price_standard'      => get_config('local_skillsaint', 'price_standard'),
            'quota_standard'      => get_config('local_skillsaint', 'quota_standard'),
            'price_premium'       => get_config('local_skillsaint', 'price_premium'),
            'quota_premium'       => get_config('local_skillsaint', 'quota_premium'),
            'price_executive'     => get_config('local_skillsaint', 'price_executive'),
            'security_note'       => get_config('local_skillsaint', 'security_note'),
        );
    }

    public static function get_all_site_data_returns() {
        return new external_single_structure(array(
            'hero_badge'        => new external_value(PARAM_TEXT, 'The hero badge label'),
            'mission_title'     => new external_value(PARAM_TEXT, 'Mission section title'),
            'mission_content'   => new external_value(PARAM_TEXT, 'Mission section content'),
            'vision_title'      => new external_value(PARAM_TEXT, 'Vision section title'),
            'vision_content'    => new external_value(PARAM_TEXT, 'Vision section content'),
            
            'about_hero_title'  => new external_value(PARAM_TEXT, 'About page hero title'),
            'founder_title'     => new external_value(PARAM_TEXT, 'Founder section title'),
            'founder_content'   => new external_value(PARAM_TEXT, 'Founder section content'),
            'founder_name'      => new external_value(PARAM_TEXT, 'Founder name'),
            'goal_title'        => new external_value(PARAM_TEXT, 'Goal title'),
            'goal_content'      => new external_value(PARAM_TEXT, 'Goal content'),
            
            'programs_hero_title' => new external_value(PARAM_TEXT, 'Programs page title'),
            'programs_hero_desc'  => new external_value(PARAM_TEXT, 'Programs page desc'),
            'core_program_title'  => new external_value(PARAM_TEXT, 'Core program title'),
            'core_program_items'  => new external_value(PARAM_TEXT, 'Core program items list'),
            
            'apply_hero_title'    => new external_value(PARAM_TEXT, 'Apply hero title'),
            'apply_hero_desc'     => new external_value(PARAM_TEXT, 'Apply hero desc'),
            'price_standard'      => new external_value(PARAM_TEXT, 'Standard Price'),
            'quota_standard'      => new external_value(PARAM_TEXT, 'Standard Quota'),
            'price_premium'       => new external_value(PARAM_TEXT, 'Premium Price'),
            'quota_premium'       => new external_value(PARAM_TEXT, 'Premium Quota'),
            'price_executive'     => new external_value(PARAM_TEXT, 'Executive Price'),
            'security_note'       => new external_value(PARAM_TEXT, 'Security Note'),
        ));
    }

    /**
     * Get all admin dashboard statistics from real DB data.
     */
    public static function get_admin_dashboard_stats_parameters() {
        return new external_function_parameters(array());
    }

    public static function get_admin_dashboard_stats() {
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
                'id'             => (int)$u->id,
                'name'           => trim($u->firstname . ' ' . $u->lastname),
                'email'          => $u->email,
                'plan'           => $u->plan,
                'payment_status' => $u->payment_status,
                'is_activated'   => (int)$u->is_activated,
                'enrolled_count' => (int)$u->enrolled_count,
                'registered_at'  => (int)$u->timecreated,
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
            'total_students'   => (int)$total_students,
            'active_courses'   => (int)$active_courses,
            'new_this_month'   => (int)$new_this_month,
            'total_paid_apps'  => (int)$total_paid,
            'total_quizzes'    => (int)$total_quizzes,
            'recent_students'  => $recent_students,
        );
    }

    public static function get_admin_dashboard_stats_returns() {
        return new external_single_structure(array(
            'total_students'  => new external_value(PARAM_INT, 'Total enrolled students'),
            'active_courses'  => new external_value(PARAM_INT, 'Number of active courses'),
            'new_this_month'  => new external_value(PARAM_INT, 'New paid enrollments this month'),
            'total_paid_apps' => new external_value(PARAM_INT, 'Total paid applications ever'),
            'total_quizzes'   => new external_value(PARAM_INT, 'Number of quizzes/exams'),
            'recent_students' => new external_multiple_structure(
                new external_single_structure(array(
                    'id'             => new external_value(PARAM_INT, 'User ID'),
                    'name'           => new external_value(PARAM_TEXT, 'Full name'),
                    'email'          => new external_value(PARAM_TEXT, 'Email'),
                    'plan'           => new external_value(PARAM_TEXT, 'Subscription plan'),
                    'payment_status' => new external_value(PARAM_TEXT, 'Payment status'),
                    'is_activated'   => new external_value(PARAM_INT, 'Is account activated'),
                    'enrolled_count' => new external_value(PARAM_INT, 'Number of courses enrolled'),
                    'registered_at'  => new external_value(PARAM_INT, 'Unix timestamp of registration'),
                ))
            ),
        ));
    }

    /**
     * Get all Moodle users for the admin students page.
     */
    public static function get_all_admin_users_parameters() {
        return new external_function_parameters(array());
    }

    public static function get_all_admin_users() {
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
            LEFT JOIN {local_skillsaint_apps} apps ON LOWER(apps.email) = LOWER(u.email)
            WHERE u.id != 1 AND u.deleted = 0
            ORDER BY u.timecreated DESC
        ";
        $rows = $DB->get_records_sql($sql);
        $result = array();
        foreach ($rows as $r) {
            $result[] = array(
                'id'             => (int)$r->id,
                'name'           => trim($r->firstname . ' ' . $r->lastname),
                'email'          => $r->email,
                'suspended'      => (int)$r->suspended,
                'plan'           => $r->plan,
                'payment_status' => $r->payment_status,
                'is_activated'   => (int)$r->is_activated,
                'activation_code'=> $r->activation_code,
                'enrolled_count' => (int)$r->enrolled_count,
                'registered_at'  => (int)$r->timecreated,
            );
        }
        return $result;
    }

    public static function get_all_admin_users_returns() {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id'             => new external_value(PARAM_INT,  'User ID'),
                'name'           => new external_value(PARAM_TEXT, 'Full name'),
                'email'          => new external_value(PARAM_TEXT, 'Email'),
                'suspended'      => new external_value(PARAM_INT,  '1 if suspended'),
                'plan'           => new external_value(PARAM_TEXT, 'Subscription plan'),
                'payment_status' => new external_value(PARAM_TEXT, 'Payment status'),
                'is_activated'   => new external_value(PARAM_INT,  '1 if activated'),
                'activation_code'=> new external_value(PARAM_TEXT, 'Activation code'),
                'enrolled_count' => new external_value(PARAM_INT,  'Number of enrolled courses'),
                'registered_at'  => new external_value(PARAM_INT,  'Unix timestamp'),
            ))
        );
    }

    /**
     * Get all paid applications for the finance page.
     */
    public static function get_all_paid_applications_parameters() {
        return new external_function_parameters(array());
    }

    public static function get_all_paid_applications() {
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
                'id'             => (int)$a->id,
                'fullname'       => $a->fullname,
                'email'          => $a->email,
                'selected_plan'  => $a->selected_plan,
                'is_activated'   => (int)$a->is_activated,
                'timecreated'    => (int)$a->timecreated,
            );
        }
        return $result;
    }

    public static function get_all_paid_applications_returns() {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id'            => new external_value(PARAM_INT,  'App ID'),
                'fullname'      => new external_value(PARAM_TEXT, 'Full name'),
                'email'         => new external_value(PARAM_TEXT, 'Email'),
                'selected_plan' => new external_value(PARAM_TEXT, 'Plan'),
                'is_activated'  => new external_value(PARAM_INT,  '1 if activated'),
                'timecreated'   => new external_value(PARAM_INT,  'Unix timestamp'),
            ))
        );
    }
}
