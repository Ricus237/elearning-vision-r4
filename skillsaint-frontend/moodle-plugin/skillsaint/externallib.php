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
            'email'            => new external_value(PARAM_EMAIL, 'User email address'),
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
            'email' => new external_value(PARAM_EMAIL, 'User email address to find the application'),
        ));
    }

    public static function confirm_payment($email) {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/user/lib.php');
        require_once($CFG->dirroot . '/enrol/externallib.php');

        // 1. Find the pending application
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $email, 'payment_status' => 'pending'));
        if (!$app) {
            throw new invalid_parameter_exception('No pending application found for this email.');
        }

        // 2. Mark as paid
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

        // 4. Enroll in selected courses
        if (!empty($app->selected_courses)) {
            $course_ids = explode(',', $app->selected_courses);
            $enrol = enrol_get_plugin('manual');
            foreach ($course_ids as $cid) {
                $cid = (int)trim($cid);
                $course = $DB->get_record('course', array('id' => $cid));
                if ($course) {
                    $instance = $DB->get_record('enrol', array('courseid' => $cid, 'enrol' => 'manual'), '*', MUST_EXIST);
                    $enrol->enrol_user($instance, $user->id, 5); // 5 is the student role ID
                }
            }
        }

        // 5. Generate activation code
        $activation_code = 'IBI-' . rand(1000, 9999) . '-' . strtoupper(substr(md5(time()), 0, 4));
        $app->activation_code = $activation_code;
        $app->is_activated = 0;
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
            'email' => new external_value(PARAM_EMAIL, 'User email address'),
            'code'  => new external_value(PARAM_TEXT, 'The activation code entered by user'),
        ));
    }

    public static function activate_account($email, $code) {
        global $DB;
        $app = $DB->get_record('local_skillsaint_apps', array('email' => $email, 'activation_code' => $code));
        if ($app) {
            $app->is_activated = 1;
            $app->timemodified = time();
            $DB->update_record('local_skillsaint_apps', $app);
            return array('status' => 'success', 'message' => 'Account unlocked!');
        }
        return array('status' => 'error', 'message' => 'Invalid activation code.');
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
            'email' => new external_value(PARAM_EMAIL, 'User email address'),
        ));
    }

    public static function check_activation($email) {
        global $DB;
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
}
