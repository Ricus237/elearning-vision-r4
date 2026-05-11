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
            'amount' => new external_value(PARAM_FLOAT, 'Paid amount', VALUE_DEFAULT, 0.0),
            'method' => new external_value(PARAM_TEXT, 'Payment method', VALUE_DEFAULT, ''),
            'transaction_id' => new external_value(PARAM_TEXT, 'External transaction ID', VALUE_DEFAULT, ''),
            'userid' => new external_value(PARAM_INT, 'Optional Moodle User ID', VALUE_DEFAULT, 0),
            'stripe_customer_id' => new external_value(PARAM_TEXT, 'Stripe Customer ID', VALUE_DEFAULT, ''),
            'stripe_payment_method' => new external_value(PARAM_TEXT, 'Stripe Payment Method', VALUE_DEFAULT, ''),
        ));
    }

    public static function confirm_payment($email, $amount = 0, $method = '', $transaction_id = '', $userid = 0, $stripe_customer_id = '', $stripe_payment_method = '')
    {
        global $DB, $CFG;
        $email = strtolower(trim($email));
        require_once($CFG->dirroot . '/user/lib.php');
        require_once($CFG->dirroot . '/enrol/externallib.php');

        // 1. Find the application (Try by ID first, then by Email)
        $app = null;
        if ($userid > 0) {
            $app = $DB->get_record('local_skillsaint_apps', array('userid' => $userid));
        }
        
        if (!$app) {
            $app = $DB->get_record('local_skillsaint_apps', array('email' => $email));
        }

        if (!$app) {
            throw new invalid_parameter_exception('No application found for this identifier.');
        }

        // Save Stripe info if provided (for autopay)
        if (!empty($stripe_customer_id)) {
            $app->stripe_customer_id = $stripe_customer_id;
        }
        if (!empty($stripe_payment_method)) {
            $app->stripe_payment_method = $stripe_payment_method;
        }

        // 2. Record the payment if provided
        if ($amount > 0) {
            $payment = new stdClass();
            $payment->userid = $app->userid;
            $payment->app_id = $app->id;
            $payment->amount = $amount;
            $payment->method = $method ?: 'unknown';
            $payment->transaction_id = $transaction_id;
            $payment->currency = 'USD';
            $payment->timecreated = time();
            $DB->insert_record('local_skillsaint_payments', $payment);
        }

        // 3. If already activated, we are done (subsequent payment)
        if ($app->is_activated == 1) {
            return array(
                'status' => 'success',
                'user_id' => (int) $app->userid,
                'courses_enrolled' => 0,
                'activation_code' => $app->activation_code
            );
        }

        // 4. First payment: Mark as paid and setup account
        $app->payment_status = 'paid'; // Keep 'paid' to mean 'started paying/enrolled'
        $app->timemodified = time();
        $DB->update_record('local_skillsaint_apps', $app);

        // 5. Find or Create the Moodle user
        $user = $DB->get_record('user', array('email' => $email, 'mnethostid' => $CFG->mnet_localhost_id));
        if ($user) {
            $user->username = $email;
            $user->confirmed = 1;
            $user->suspended = 0;
            $DB->update_record('user', $user);
            update_internal_user_password($user, 'Gbi2026@');
        } else {
            $usernew = new stdClass();
            $usernew->username    = $email;
            $usernew->email       = $email;
            $usernew->auth        = 'manual';
            $usernew->confirmed   = 1;
            $usernew->suspended   = 0;
            $usernew->mnethostid  = $CFG->mnet_localhost_id;
            $usernew->lang        = $CFG->lang ?? 'en';
            $usernew->calendartype = 'gregorian';
            $usernew->timezone    = '99';
            
            $parts = explode(' ', trim($app->fullname));
            $usernew->firstname = $parts[0] ?: 'Student';
            $usernew->lastname  = (count($parts) > 1) ? implode(' ', array_slice($parts, 1)) : 'User';

            $user_id = user_create_user($usernew);
            $user = $DB->get_record('user', array('id' => $user_id));
            update_internal_user_password($user, 'Gbi2026@');
        }

        // Update app with userid
        $app->userid = $user->id;
        
        // 6. Enroll in courses
        $course_ids = array();
        if ($app->selected_plan === 'executive') {
            $all_courses = $DB->get_records('course', array('visible' => 1));
            foreach ($all_courses as $c) {
                if ($c->id != 1) {
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
                            $enrol->enrol_user($instance, $user->id, 5);
                        }
                    }
                }
            }
        }

        // 7. Auto-activate
        $activation_code = 'IBI-' . rand(1000, 9999) . '-' . strtoupper(substr(md5(time()), 0, 4));
        $app->activation_code = $activation_code;
        $app->is_activated = 1;
        $DB->update_record('local_skillsaint_apps', $app);

        // Update user ID in payments if we just created it
        $DB->execute("UPDATE {local_skillsaint_payments} SET userid = ? WHERE app_id = ? AND userid = 0", array($user->id, $app->id));

        return array(
            'status' => 'success',
            'user_id' => (int) $user->id,
            'courses_enrolled' => count($course_ids),
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
            'auth_login_title' => get_config('local_skillsaint', 'auth_login_title'),
            'auth_login_subtitle' => get_config('local_skillsaint', 'auth_login_subtitle'),
            'auth_login_bg' => get_config('local_skillsaint', 'auth_login_bg'),
            'auth_login_image' => get_config('local_skillsaint', 'auth_login_image'),
            'auth_forgot_title' => get_config('local_skillsaint', 'auth_forgot_title'),
            'auth_forgot_subtitle' => get_config('local_skillsaint', 'auth_forgot_subtitle'),
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
            'auth_login_title' => new external_value(PARAM_TEXT, 'Auth login title', VALUE_DEFAULT, ''),
            'auth_login_subtitle' => new external_value(PARAM_RAW, 'Auth login subtitle', VALUE_DEFAULT, ''),
            'auth_login_bg' => new external_value(PARAM_RAW, 'Auth login bg', VALUE_DEFAULT, ''),
            'auth_login_image' => new external_value(PARAM_RAW, 'Auth login image', VALUE_DEFAULT, ''),
            'auth_forgot_title' => new external_value(PARAM_TEXT, 'Auth forgot title', VALUE_DEFAULT, ''),
            'auth_forgot_subtitle' => new external_value(PARAM_RAW, 'Auth forgot subtitle', VALUE_DEFAULT, ''),
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
            'auth_login_title' => new external_value(PARAM_TEXT, 'Auth login title', VALUE_DEFAULT, ''),
            'auth_login_subtitle' => new external_value(PARAM_RAW, 'Auth login subtitle', VALUE_DEFAULT, ''),
            'auth_login_bg' => new external_value(PARAM_RAW, 'Auth login bg', VALUE_DEFAULT, ''),
            'auth_login_image' => new external_value(PARAM_RAW, 'Auth login image', VALUE_DEFAULT, ''),
            'auth_forgot_title' => new external_value(PARAM_TEXT, 'Auth forgot title', VALUE_DEFAULT, ''),
            'auth_forgot_subtitle' => new external_value(PARAM_RAW, 'Auth forgot subtitle', VALUE_DEFAULT, ''),
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
        $programs_floating_badge_2 = '',
        $auth_login_title = '',
        $auth_login_subtitle = '',
        $auth_login_bg = '',
        $auth_login_image = '',
        $auth_forgot_title = '',
        $auth_forgot_subtitle = ''
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
            'auth_login_title' => $auth_login_title,
            'auth_login_subtitle' => $auth_login_subtitle,
            'auth_login_bg' => $auth_login_bg,
            'auth_login_image' => $auth_login_image,
            'auth_forgot_title' => $auth_forgot_title,
            'auth_forgot_subtitle' => $auth_forgot_subtitle,
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
                self::save_syllabus_files($cdata['syllabus_pdf'], $context->id);
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
                self::save_syllabus_files($cdata['syllabus_pdf'], $context->id);
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

    /**
     * Save a single base64 file WITHOUT clearing the area first.
     */
    private static function save_base64_file_append($base64data, $contextid, $component, $filearea, $filename)
    {
        $fs = get_file_storage();
        if (strpos($base64data, ',') !== false) {
            $base64data = explode(',', $base64data)[1];
        }
        $content = base64_decode($base64data, true);
        if (!$content)
            return false;
        // Check if file with same name already exists, delete it first
        $existing = $fs->get_file($contextid, $component, $filearea, 0, '/', $filename);
        if ($existing) {
            $existing->delete();
        }
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

    /**
     * Handle syllabus files: supports both single base64 and JSON array of {name, data}.
     * Smart reconciliation: keeps existing files, removes deleted ones, adds new uploads.
     */
    private static function save_syllabus_files($syllabus_data, $contextid)
    {
        $fs = get_file_storage();
        
        // Try to decode as JSON array
        $decoded = json_decode($syllabus_data, true);
        
        if (is_array($decoded)) {
            // Build lists: files to keep (existing) and files to add (new uploads)
            $keep_names = array();
            $new_files = array();
            
            foreach ($decoded as $file) {
                if (empty($file['name'])) continue;
                
                if (!empty($file['data']) && strpos($file['data'], 'data:') === 0) {
                    // New upload (base64 data URI)
                    $new_files[] = $file;
                } else {
                    // Existing server file to keep
                    $keep_names[] = $file['name'];
                }
            }
            
            // Get all current files in both old (course) and new (local_skillsaint) areas
            $existing_old = $fs->get_area_files($contextid, 'course', 'summaryfiles', 0, 'itemid, filepath, filename', false);
            $existing_new = $fs->get_area_files($contextid, 'local_skillsaint', 'summaryfiles', 0, 'itemid, filepath, filename', false);
            $existing_files = array_merge($existing_old, $existing_new);
            
            // Delete files that the user removed (not in keep list and not being replaced by new upload)
            $new_names = array_map(function($f) { return $f['name']; }, $new_files);
            foreach ($existing_files as $ef) {
                $efname = $ef->get_filename();
                if (!in_array($efname, $keep_names) && !in_array($efname, $new_names)) {
                    $ef->delete();
                }
            }
            
            // Save new uploads
            foreach ($new_files as $file) {
                self::save_base64_file_append($file['data'], $contextid, 'local_skillsaint', 'summaryfiles', $file['name']);
            }
        } else {
            // Legacy: single base64 string
            self::save_base64_file($syllabus_data, $contextid, 'local_skillsaint', 'summaryfiles', 'syllabus_' . time() . '.pdf');
        }
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
            SELECT q.id, q.course, q.name, q.intro, q.timelimit, c.fullname as coursename,
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
                'timelimit' => (int) $q->timelimit,
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
                'timelimit' => new external_value(PARAM_INT, 'Time limit in seconds'),
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
            require_once($CFG->dirroot . '/mod/quiz/locallib.php');
            $quiz = $DB->get_record('quiz', array('id' => $quizid), '*', MUST_EXIST);
            quiz_add_quiz_question($question->id, $quiz);
            quiz_update_sumgrades($quiz);
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

            // Update sumgrades
            $quiz = $DB->get_record('quiz', array('id' => $quizid));
            if ($quiz) {
                require_once($CFG->dirroot . '/mod/quiz/locallib.php');
                quiz_update_sumgrades($quiz);
            }
        }

        return array('status' => 'success');
    }

    public static function delete_question_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'Status of the operation')
        ));
    }

    /**
     * Reorder questions in a quiz.
     */
    public static function reorder_questions_parameters()
    {
        return new external_function_parameters(array(
            'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
            'questionids' => new external_multiple_structure(new external_value(PARAM_INT, 'Question ID'))
        ));
    }

    public static function reorder_questions($quizid, $questionids)
    {
        global $DB;
        self::validate_parameters(self::reorder_questions_parameters(), array('quizid' => $quizid, 'questionids' => $questionids));
        self::validate_context(context_system::instance());

        $quizobj = \mod_quiz\quiz_settings::create($quizid);
        $structure = \mod_quiz\structure::create_for_quiz($quizobj);
        
        $current_slots = $structure->get_slots();
        
        foreach ($questionids as $index => $questionid) {
            $newslot = $index + 1;
            
            // Find current slot for this question
            foreach ($current_slots as $slot) {
                if ($slot->questionid == $questionid) {
                    if ($slot->slot != $newslot) {
                        $structure->move_slot($slot->slot, $newslot);
                    }
                    break;
                }
            }
        }

        return array('status' => 'success');
    }

    public static function reorder_questions_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'Status of the operation')
        ));
    }

    /**
     * Update an existing multichoice question.
     */
    public static function update_question_parameters()
    {
        return new external_function_parameters(array(
            'questionid' => new external_value(PARAM_INT, 'Question ID'),
            'name' => new external_value(PARAM_TEXT, 'Question name'),
            'text' => new external_value(PARAM_RAW, 'Question text (HTML)'),
            'answers' => new external_multiple_structure(
                new external_single_structure(array(
                    'text' => new external_value(PARAM_RAW, 'Answer text'),
                    'fraction' => new external_value(PARAM_FLOAT, 'Grade fraction (1.0 for correct, 0.0 for wrong)')
                ))
            )
        ));
    }

    public static function update_question($questionid, $name, $text, $answers)
    {
        global $DB;
        self::validate_parameters(self::update_question_parameters(), array(
            'questionid' => $questionid, 
            'name' => $name, 
            'text' => $text, 
            'answers' => $answers
        ));
        self::validate_context(context_system::instance());

        // 1. Update question record
        $question = $DB->get_record('question', array('id' => $questionid), '*', MUST_EXIST);
        $question->name = $name;
        $question->questiontext = $text;
        $DB->update_record('question', $question);

        // 2. Clear old answers
        $DB->delete_records('question_answers', array('question' => $questionid));

        // 3. Insert new answers
        foreach ($answers as $a) {
            $ans = new stdClass();
            $ans->question = $questionid;
            $ans->answer = $a['text'];
            $ans->answerformat = FORMAT_HTML;
            $ans->fraction = (float) $a['fraction'];
            $ans->feedback = '';
            $ans->feedbackformat = FORMAT_HTML;
            $DB->insert_record('question_answers', $ans);
        }

        return array('status' => 'success');
    }

    public static function update_question_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'Status of the operation')
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
                'sectionid' => new external_value(PARAM_INT, 'The section ID to place the quiz in', VALUE_DEFAULT, 0),
                'timelimit' => new external_value(PARAM_INT, 'The time limit in seconds', VALUE_DEFAULT, 0),
            )
        );
    }

    public static function init_exam($courseid, $name, $sectionid = 0, $timelimit = 0)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/quiz/lib.php');
        require_once($CFG->dirroot . '/course/lib.php');

        // Allow multiple quizzes by not checking just by name/course if section is specified
        // or just let it create a new one if it doesn't exist in that specific section.
        
        $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);

        // Configuration de base du quiz
        $quiz = new stdClass();
        $quiz->course = $courseid;
        $quiz->name = $name;
        $quiz->intro = 'Auto-generated quiz from IBI Dashboard';
        $quiz->introformat = FORMAT_HTML;
        $quiz->timeopen = 0;
        $quiz->timeclose = 0;
        $quiz->timelimit = $timelimit;
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

        // Placer dans la section souhaitée
        $section = null;
        if ($sectionid > 0) {
            $section = $DB->get_record('course_sections', array('id' => $sectionid));
        } else {
            $section = $DB->get_record('course_sections', array('course' => $courseid, 'section' => 0));
        }

        if ($section) {
            $modorder = trim($section->sequence);
            if ($modorder) {
                $modorder .= ',' . $cm->id;
            } else {
                $modorder = $cm->id;
            }
            $DB->set_field('course_sections', 'sequence', $modorder, array('id' => $section->id));
            
            // Update the CM's section field to match reality
            $DB->set_field('course_modules', 'section', $section->id, array('id' => $cm->id));
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
        global $DB, $USER;
        $params = self::validate_parameters(self::get_quiz_questions_parameters(), array('quizid' => $quizid));
        $quizid = $params['quizid'];

        // Validation du contexte système (minimum requis pour WS)
        self::validate_context(context_system::instance());

        // Si l'ID est un CMID, on récupère l'instance du quiz
        $cm = $DB->get_record('course_modules', array('id' => $quizid, 'module' => $DB->get_field('modules', 'id', array('name' => 'quiz'))));
        if ($cm) {
            $quizid = (int)$cm->instance;
        }

        // --- Security Check: Verify authorization ---
        // Admins bypass authorization check
        $isadmin = is_siteadmin($USER->id);
        if (!$isadmin) {
            $auth = $DB->get_record('local_skillsaint_exam_auth', array('userid' => $USER->id, 'quizid' => $quizid));
            if (!$auth || $auth->authorized != 1) {
                 throw new moodle_exception('error_not_authorized', 'local_skillsaint', '', null, 'Vous n\'êtes pas autorisé à passer cet examen. Veuillez contacter l\'administration.');
            }
        }
        // ------------------------------------------

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
        $user = $DB->get_record('user', array('id' => $userid), '*', MUST_EXIST);
        $app = $DB->get_record('local_skillsaint_apps', array('userid' => $userid));
        if (!$app) {
            $app = $DB->get_record('local_skillsaint_apps', array('email' => $user->email));
            if ($app && empty($app->userid)) {
                // Link the application to the user ID if found by email but userid is empty
                $app->userid = $userid;
                $DB->update_record('local_skillsaint_apps', $app);
            }
        }
        
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

            // Calculate progress for this course using unified logic
            $progress_data = self::calculate_course_progress($userid, $c->id);
            $percentage = $progress_data['percentage'];

            $enrolled_courses[] = array(
                'id' => (int) $c->id,
                'fullname' => $fullname = $c->fullname,
                'shortname' => $c->shortname,
                'summary' => strip_tags($c->summary),
                'image_url' => $image_url,
                'progress' => (int) min($percentage, 100),
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
                $auth = $DB->get_record('local_skillsaint_exam_auth', array('userid' => $userid, 'quizid' => $q->id));
                $exams[] = array(
                    'id' => (int) $q->id,
                    'courseid' => (int) $q->course,
                    'name' => $q->name,
                    'timeLimit' => (int) $q->timelimit,
                    'intro' => strip_tags($q->intro),
                    'is_authorized' => $auth ? (int) $auth->authorized : 0,
                );
            }
        }

        // 4. User Results
        $results_raw = $DB->get_records('local_skillsaint_exam_results', array('userid' => $userid), 'timecreated DESC');
        $results = array();
        foreach ($results_raw as $r) {
            $results[] = array(
                'id' => (int) $r->id,
                'quizid' => (int) $r->quizid,
                'score' => (float) $r->score,
                'attempt' => (int) $r->attempt_number,
                'date' => (int) $r->timecreated,
            );
        }

        // Check if user still has the default temporary password
        $needs_password_setup = 0;
        if (function_exists('validate_internal_user_password')) {
            if (validate_internal_user_password($user, 'Gbi2026@') || validate_internal_user_password($user, 'GBI2026@') || validate_internal_user_password($user, 'Skillsaint2024!')) {
                $needs_password_setup = 1;
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
            'results' => $results,
            'needs_password_setup' => $needs_password_setup,
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
                    'progress' => new external_value(PARAM_INT, 'Completion percentage 0-100'),
                ))
            ),
            'exams' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_INT, 'Quiz ID'),
                    'courseid' => new external_value(PARAM_INT, 'Course ID'),
                    'name' => new external_value(PARAM_TEXT, 'Quiz name'),
                    'timeLimit' => new external_value(PARAM_INT, 'Time limit in seconds'),
                    'intro' => new external_value(PARAM_RAW, 'Intro text'),
                    'is_authorized' => new external_value(PARAM_INT, '1 if authorized, 0 otherwise'),
                ))
            ),
            'results' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_INT, 'Record ID'),
                    'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
                    'score' => new external_value(PARAM_FLOAT, 'Score'),
                    'attempt' => new external_value(PARAM_INT, 'Attempt number'),
                    'date' => new external_value(PARAM_INT, 'Timestamp'),
                ))
            ),
            'needs_password_setup' => new external_value(PARAM_INT, '1 if user needs to set initial password, 0 otherwise'),
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

    /**
     * Save an exam attempt result.
     */
    public static function save_exam_result_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
            'score' => new external_value(PARAM_FLOAT, 'Calculated score (percentage)'),
            'total_questions' => new external_value(PARAM_INT, 'Total number of questions'),
            'correct_count' => new external_value(PARAM_INT, 'Number of correct answers'),
        ));
    }

    public static function save_exam_result($userid, $quizid, $score, $total_questions, $correct_count)
    {
        global $DB;

        // Calculate attempt number
        $attempt_count = $DB->count_records('local_skillsaint_exam_results', array('userid' => $userid, 'quizid' => $quizid));
        
        $record = new stdClass();
        $record->userid = $userid;
        $record->quizid = $quizid;
        $record->score = $score;
        $record->total_questions = $total_questions;
        $record->correct_count = $correct_count;
        $record->attempt_number = $attempt_count + 1;
        $record->timecreated = time();

        $id = $DB->insert_record('local_skillsaint_exam_results', $record);

        // Automatically revoke authorization so they cannot retake infinitely without admin permission
        $DB->set_field('local_skillsaint_exam_auth', 'authorized', 0, array('userid' => $userid, 'quizid' => $quizid));

        return array('status' => 'success', 'attempt_id' => $id);
    }

    public static function save_exam_result_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_TEXT, 'success or error'),
            'attempt_id' => new external_value(PARAM_INT, 'The record ID'),
        ));
    }

    /**
     * Get all exam results for admin view.
     */
    public static function get_all_results_parameters()
    {
        return new external_function_parameters(array());
    }

    public static function get_all_results()
    {
        global $DB;
        $sql = "
            SELECT r.*, u.firstname, u.lastname, u.email, q.name as quizname, c.fullname as coursename
            FROM {local_skillsaint_exam_results} r
            JOIN {user} u ON u.id = r.userid
            JOIN {quiz} q ON q.id = r.quizid
            JOIN {course} c ON c.id = q.course
            ORDER BY r.timecreated DESC
        ";
        $records = $DB->get_records_sql($sql);

        $results = array();
        foreach ($records as $r) {
            $results[] = array(
                'id' => (int) $r->id,
                'userid' => (int) $r->userid,
                'username' => trim($r->firstname . ' ' . $r->lastname),
                'useremail' => $r->email,
                'quizid' => (int) $r->quizid,
                'quizname' => $r->quizname,
                'coursename' => $r->coursename,
                'score' => (float) $r->score,
                'correct_count' => (int) $r->correct_count,
                'total_questions' => (int) $r->total_questions,
                'attempt_number' => (int) $r->attempt_number,
                'timecreated' => (int) $r->timecreated,
            );
        }
        return $results;
    }

    public static function get_all_results_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'Record ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'username' => new external_value(PARAM_TEXT, 'Student name'),
                'useremail' => new external_value(PARAM_TEXT, 'Student email'),
                'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
                'quizname' => new external_value(PARAM_TEXT, 'Quiz name'),
                'coursename' => new external_value(PARAM_TEXT, 'Course name'),
                'score' => new external_value(PARAM_FLOAT, 'Score'),
                'correct_count' => new external_value(PARAM_INT, 'Correct count'),
                'total_questions' => new external_value(PARAM_INT, 'Total questions'),
                'attempt_number' => new external_value(PARAM_INT, 'Attempt number'),
                'timecreated' => new external_value(PARAM_INT, 'Unix timestamp'),
            ))
        );
    }


    // ============================================================
    // INITIAL PASSWORD SETUP (First-time login after payment)
    // ============================================================

    /**
     * Set initial password for users who still have the default temporary password.
     * This does NOT require the old password — it only works if the current password
     * is still the system default ('Gbi2026@').
     */
    public static function setup_initial_password_parameters()
    {
        return new external_function_parameters(array(
            'userid'      => new external_value(PARAM_INT, 'User ID'),
            'newpassword' => new external_value(PARAM_TEXT, 'New password chosen by user'),
        ));
    }

    public static function setup_initial_password($userid, $newpassword)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/user/lib.php');

        $params = self::validate_parameters(self::setup_initial_password_parameters(), array(
            'userid'      => $userid,
            'newpassword' => $newpassword,
        ));

        $user = $DB->get_record('user', array('id' => $params['userid']), '*', MUST_EXIST);

        // Security: Only allow this if the user still has the default password
        if (!validate_internal_user_password($user, 'Gbi2026@') && !validate_internal_user_password($user, 'GBI2026@')) {
            return array('status' => 'error', 'message' => 'Password has already been changed. Use the regular change password flow.');
        }

        // Validate minimum password strength
        if (strlen($params['newpassword']) < 8) {
            return array('status' => 'error', 'message' => 'Password must be at least 8 characters long.');
        }

        // Update password
        $user->password = hash_internal_user_password($params['newpassword']);
        $user->timemodified = time();
        $DB->update_record('user', $user);

        return array('status' => 'success', 'message' => 'Password set successfully. You can now use it to log in.');
    }

    public static function setup_initial_password_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Authorize or revoke exam access for a student.
     */
    public static function authorize_exam_parameters()
    {
        return new external_function_parameters(array(
            'userid'     => new external_value(PARAM_INT, 'User ID of the student'),
            'quizid'     => new external_value(PARAM_INT, 'Quiz ID to authorize'),
            'authorized' => new external_value(PARAM_INT, '1 to authorize, 0 to revoke'),
        ));
    }

    public static function authorize_exam($userid, $quizid, $authorized)
    {
        global $DB;

        $params = self::validate_parameters(self::authorize_exam_parameters(), array(
            'userid'     => $userid,
            'quizid'     => $quizid,
            'authorized' => $authorized,
        ));

        $record = $DB->get_record('local_skillsaint_exam_auth', array('userid' => $params['userid'], 'quizid' => $params['quizid']));

        if ($record) {
            $record->authorized = $params['authorized'];
            $record->timecreated = time();
            $DB->update_record('local_skillsaint_exam_auth', $record);
        } else {
            $record = new stdClass();
            $record->userid = $params['userid'];
            $record->quizid = $params['quizid'];
            $record->authorized = $params['authorized'];
            $record->timecreated = time();
            $DB->insert_record('local_skillsaint_exam_auth', $record);
        }

        return array('status' => 'success', 'message' => 'Exam authorization updated.');
    }

    public static function authorize_exam_returns()
    {
        return new external_single_structure(array(
            'status'  => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Get course curriculum with exam authorization status.
     */
    public static function get_course_curriculum_parameters()
    {
        return new external_function_parameters(array(
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
        ));
    }

    public static function get_course_curriculum($courseid)
    {
        global $DB, $USER, $CFG;
        $params = self::validate_parameters(self::get_course_curriculum_parameters(), array('courseid' => $courseid));
        
        // Ensure the external class is loaded
        require_once($CFG->dirroot . '/course/externallib.php');
        
        // Use the class directly
        $contents = core_course_external::get_course_contents($params['courseid'], array());
        
        // Enrich with exam authorization
        foreach ($contents as &$section) {
            if (!isset($section['modules'])) continue;
            foreach ($section['modules'] as &$module) {
                if ($module['modname'] === 'quiz') {
                    $auth = $DB->get_record('local_skillsaint_exam_auth', array('userid' => $USER->id, 'quizid' => $module['instance']));
                    $module['is_authorized'] = $auth ? (int) $auth->authorized : 0;
                } else {
                    $module['is_authorized'] = 1;
                }
            }
        }

        // Inject Course Summary Files (Syllabus) as a virtual module in Section 0
        $context = context_course::instance($params['courseid']);
        $fs = get_file_storage();
        $summaryfiles = array();
        
        // Fetch from both old area (course) and new area (local_skillsaint) for backward compatibility
        $files_old = $fs->get_area_files($context->id, 'course', 'summaryfiles', 0, 'itemid, filepath, filename', false);
        $files_new = $fs->get_area_files($context->id, 'local_skillsaint', 'summaryfiles', 0, 'itemid, filepath, filename', false);
        $files = array_merge($files_old, $files_new);
        
        foreach ($files as $f) {
            if ($f->is_directory()) continue;
            
            $fileurl = \moodle_url::make_webservice_pluginfile_url(
                $f->get_contextid(),
                $f->get_component(),
                $f->get_filearea(),
                $f->get_itemid(),
                $f->get_filepath(),
                $f->get_filename()
            )->out(false);
            $summaryfiles[] = array(
                'type' => 'file',
                'filename' => $f->get_filename(),
                'filepath' => $f->get_filepath(),
                'filesize' => $f->get_filesize(),
                'fileurl' => $fileurl,
                'timecreated' => $f->get_timecreated(),
                'timemodified' => $f->get_timemodified(),
                'sortorder' => 1,
                'mimetype' => $f->get_mimetype(),
                'isexternalfile' => false,
                'userid' => $f->get_userid(),
                'author' => $f->get_author(),
                'license' => $f->get_license()
            );
        }

        if (!empty($summaryfiles)) {
            $syllabus_module = array(
                'id' => 999999, // Pseudo ID
                'name' => 'Syllabus & Course Documents',
                'instance' => 0,
                'contextid' => $context->id,
                'visible' => 1,
                'uservisible' => 1,
                'visibleoncoursepage' => 1,
                'modicon' => $CFG->wwwroot . '/theme/image.php/boost/core/1/f/pdf',
                'modname' => 'resource',
                'purpose' => 'content',
                'modplural' => 'Files',
                'indent' => 0,
                'noviewlink' => false,
                'completion' => 0,
                'is_authorized' => 1,
                'description' => '<p>These documents provide an overview of the course, its syllabus, and supplementary materials.</p>',
                'contents' => $summaryfiles
            );

            if (isset($contents[0])) {
                if (!isset($contents[0]['modules'])) {
                    $contents[0]['modules'] = array();
                }
                array_unshift($contents[0]['modules'], $syllabus_module);
            }
        }

        return $contents;
    }

    public static function get_course_curriculum_returns()
    {
        global $CFG;
        require_once($CFG->dirroot . '/course/externallib.php');
        return core_course_external::get_course_contents_returns();
    }

    // ==========================================
    // COURSE PROGRESS TRACKING
    // ==========================================

    /**
     * Mark a course module as viewed by the current user.
     */
    public static function mark_module_viewed_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'cmid' => new external_value(PARAM_INT, 'Course Module ID'),
        ));
    }

    public static function mark_module_viewed($userid, $courseid, $cmid)
    {
        global $DB;

        // Check if already recorded (UNIQUE index on userid+cmid)
        $existing = $DB->get_record('local_skillsaint_progress', array(
            'userid' => $userid,
            'cmid' => $cmid,
        ));

        if (!$existing) {
            $record = new stdClass();
            $record->userid = $userid;
            $record->courseid = $courseid;
            $record->cmid = $cmid;
            $record->timecreated = time();

            try {
                $DB->insert_record('local_skillsaint_progress', $record);
            } catch (\dml_exception $e) {
                // Race condition: another request inserted it first — that's fine
            }
        }

        // Return updated progress for this course
        $progress_data = self::calculate_course_progress($userid, $courseid);

        return array(
            'status' => 'success',
            'viewed' => (int) $progress_data['viewed'],
            'total' => (int) $progress_data['total'],
            'percentage' => (int) $progress_data['percentage'],
        );
    }

    public static function mark_module_viewed_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success'),
            'viewed' => new external_value(PARAM_INT, 'Number of modules viewed'),
            'total' => new external_value(PARAM_INT, 'Total modules in course'),
            'percentage' => new external_value(PARAM_INT, 'Completion percentage 0-100'),
        ));
    }

    /**
     * Get course progress for a specific user and course.
     */
    public static function get_course_progress_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
        ));
    }

    public static function get_course_progress($userid, $courseid)
    {
        $progress_data = self::calculate_course_progress($userid, $courseid);

        return array(
            'viewed' => (int) $progress_data['viewed'],
            'total' => (int) $progress_data['total'],
            'percentage' => (int) $progress_data['percentage'],
            'viewed_cmids' => $progress_data['viewed_cmids'],
        );
    }

    /**
     * Unified calculation logic for course progress.
     */
    protected static function calculate_course_progress($userid, $courseid)
    {
        global $DB;

        $userid = (int) $userid;
        $courseid = (int) $courseid;

        // Find the first module ID to exclude (généralités)
        $first_module_cmid = $DB->get_field_sql(
            "SELECT cm.id
             FROM {course_modules} cm
             JOIN {modules} m ON m.id = cm.module
             WHERE cm.course = ? AND cm.deletioninprogress = 0 AND m.name NOT IN ('forum', 'label')
             ORDER BY cm.section ASC, cm.id ASC",
            array($courseid),
            IGNORE_MULTIPLE
        );

        $viewed_params = array($userid, $courseid);
        $viewed_sql = "SELECT COUNT(id) FROM {local_skillsaint_progress} WHERE userid = ? AND courseid = ?";
        if ($first_module_cmid) {
            $viewed_sql .= " AND cmid != ?";
            $viewed_params[] = $first_module_cmid;
        }
        $viewed_count = $DB->count_records_sql($viewed_sql, $viewed_params);

        $total_params = array($courseid);
        $total_sql = "SELECT COUNT(cm.id)
                      FROM {course_modules} cm
                      JOIN {modules} m ON m.id = cm.module
                      WHERE cm.course = ? AND cm.deletioninprogress = 0 AND m.name NOT IN ('forum', 'label', 'quiz')";
        if ($first_module_cmid) {
            $total_sql .= " AND cm.id != ?";
            $total_params[] = $first_module_cmid;
        }
        $total_modules = $DB->count_records_sql($total_sql, $total_params);

        $viewed_records = $DB->get_records('local_skillsaint_progress', array(
            'userid' => $userid,
            'courseid' => $courseid,
        ), '', 'cmid');
        
        $viewed_cmids_arr = array();
        if ($viewed_records) {
            foreach ($viewed_records as $r) {
                $viewed_cmids_arr[] = (int) $r->cmid;
            }
        }

        $percentage = ($total_modules > 0) ? round(($viewed_count / $total_modules) * 100) : 0;
        $percentage = (int) min($percentage, 100);

        return array(
            'viewed' => $viewed_count,
            'total' => $total_modules,
            'percentage' => $percentage,
            'viewed_cmids' => implode(',', $viewed_cmids_arr),
        );
    }

    public static function get_course_progress_returns()
    {
        return new external_single_structure(array(
            'viewed' => new external_value(PARAM_INT, 'Number of modules viewed'),
            'total' => new external_value(PARAM_INT, 'Total modules in course'),
            'percentage' => new external_value(PARAM_INT, 'Completion percentage 0-100'),
            'viewed_cmids' => new external_value(PARAM_TEXT, 'Comma-separated list of viewed module IDs'),
        ));
    }

    /**
     * Get user billing info.
     */
    public static function get_user_billing_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'Moodle user ID'),
        ));
    }

    public static function get_user_billing($userid)
    {
        global $DB;
        
        $app = $DB->get_record('local_skillsaint_apps', array('userid' => $userid));
        if (!$app) {
            return array('error' => 'No application found');
        }

        $plan = strtolower($app->selected_plan);
        $total_price = (float) get_config('local_skillsaint', 'price_' . $plan);
        
        // Default prices if config is empty
        if ($total_price <= 0) {
            if ($plan === 'executive') $total_price = 999.00;
            else if ($plan === 'premium') $total_price = 499.00;
            else $total_price = 199.00;
        }

        $payments = $DB->get_records('local_skillsaint_payments', array('userid' => $userid), 'timecreated DESC');
        $amount_paid = 0;
        $transactions = array();

        foreach ($payments as $p) {
            $amount_paid += (float) $p->amount;
            $transactions[] = array(
                'id' => $p->transaction_id ?: 'TXN-'.$p->id,
                'amount' => (float) $p->amount,
                'date' => date('Y-m-d', $p->timecreated),
                'method' => $p->method,
                'status' => 'Succeeded'
            );
        }

        return array(
            'plan_name' => ucfirst($plan) . ' Plan',
            'total_price' => $total_price,
            'amount_paid' => $amount_paid,
            'remaining_balance' => max(0, $total_price - $amount_paid),
            'transactions' => $transactions,
            'autopay_day' => (int) $app->autopay_day,
            'autopay_amount' => (float) $app->autopay_amount,
            'has_payment_method' => !empty($app->stripe_payment_method) ? 1 : 0,
        );
    }

    public static function get_user_billing_returns()
    {
        return new external_single_structure(array(
            'plan_name' => new external_value(PARAM_TEXT, 'Plan name'),
            'total_price' => new external_value(PARAM_FLOAT, 'Total price'),
            'amount_paid' => new external_value(PARAM_FLOAT, 'Total paid'),
            'remaining_balance' => new external_value(PARAM_FLOAT, 'Remaining balance'),
            'transactions' => new external_multiple_structure(
                new external_single_structure(array(
                    'id' => new external_value(PARAM_TEXT, 'TXN ID'),
                    'amount' => new external_value(PARAM_FLOAT, 'Amount'),
                    'date' => new external_value(PARAM_TEXT, 'Date string'),
                    'method' => new external_value(PARAM_TEXT, 'Method'),
                    'status' => new external_value(PARAM_TEXT, 'Status'),
                ))
            ),
            'autopay_day' => new external_value(PARAM_INT, 'Autopay day'),
            'autopay_amount' => new external_value(PARAM_FLOAT, 'Autopay amount'),
            'has_payment_method' => new external_value(PARAM_INT, '1 if saved'),
        ));
    }

    /**
     * Save autopay settings.
     */
    public static function save_autopay_settings_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'The Moodle user ID'),
            'day' => new external_value(PARAM_INT, 'Day of month (0 to disable, 1-28 to enable)'),
            'amount' => new external_value(PARAM_FLOAT, 'Monthly amount'),
        ));
    }

    public static function save_autopay_settings($userid, $day, $amount)
    {
        global $DB;
        $app = $DB->get_record('local_skillsaint_apps', array('userid' => $userid));
        if (!$app) {
            return array('status' => 'error', 'message' => 'No application found');
        }

        $app->autopay_day = $day;
        $app->autopay_amount = $amount;
        $app->timemodified = time();
        $DB->update_record('local_skillsaint_apps', $app);

        return array('status' => 'success');
    }

    public static function save_autopay_settings_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_TEXT, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message', VALUE_DEFAULT, ''),
        ));
    }

    /**
     * Student adds a course to their selection (respects plan quota).
     */
    public static function add_course_to_selection_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'The Moodle user ID'),
            'courseid' => new external_value(PARAM_INT, 'The course ID to add'),
        ));
    }

    public static function add_course_to_selection($userid, $courseid)
    {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/lib/enrollib.php');

        // 1. Validate user exists
        $user = $DB->get_record('user', array('id' => $userid, 'deleted' => 0));
        if (!$user) {
            return array('status' => 'error', 'message' => 'User not found.');
        }

        // 2. Validate course exists
        $course = $DB->get_record('course', array('id' => $courseid, 'visible' => 1));
        if (!$course || $courseid == 1) {
            return array('status' => 'error', 'message' => 'Course not found or not available.');
        }

        // 3. Check if already enrolled
        $already = $DB->record_exists_sql(
            "SELECT 1 FROM {user_enrolments} ue
             JOIN {enrol} e ON e.id = ue.enrolid
             WHERE ue.userid = ? AND e.courseid = ?",
            array($userid, $courseid)
        );
        if ($already) {
            return array('status' => 'error', 'message' => 'Already enrolled in this course.');
        }

        // 4. Check plan quota
        $app = $DB->get_record('local_skillsaint_apps', array('userid' => $userid));
        if (!$app) {
            // Try by email
            $app = $DB->get_record('local_skillsaint_apps', array('email' => $user->email));
        }

        $plan = $app ? $app->selected_plan : 'none';

        // Get quotas from config or use defaults
        $quota_standard = (int) get_config('local_skillsaint', 'quota_standard') ?: 3;
        $quota_premium = (int) get_config('local_skillsaint', 'quota_premium') ?: 6;

        $quota = 0;
        if ($plan === 'executive') {
            $quota = 999; // Unlimited
        } else if ($plan === 'premium') {
            $quota = $quota_premium;
        } else if ($plan === 'standard') {
            $quota = $quota_standard;
        }

        // Count current enrollments
        $current_count = $DB->count_records_sql(
            "SELECT COUNT(*) FROM {user_enrolments} ue
             JOIN {enrol} e ON e.id = ue.enrolid
             WHERE ue.userid = ? AND e.courseid != 1",
            array($userid)
        );

        if ($current_count >= $quota) {
            return array('status' => 'error', 'message' => 'Course quota reached for your plan. Please upgrade.');
        }

        // 5. Enroll the user using manual enrolment plugin
        $enrol = enrol_get_plugin('manual');
        if (!$enrol) {
            return array('status' => 'error', 'message' => 'Manual enrolment plugin not available.');
        }

        $instance = $DB->get_record('enrol', array('courseid' => $courseid, 'enrol' => 'manual'), '*', IGNORE_MISSING);
        if (!$instance) {
            // Create manual enrolment instance if it doesn't exist
            $enrolid = $enrol->add_instance($course);
            $instance = $DB->get_record('enrol', array('id' => $enrolid));
        }

        $enrol->enrol_user($instance, $userid, 5); // roleid 5 = Student

        // 6. Update selected_courses in the application record
        if ($app) {
            $existing_courses = !empty($app->selected_courses) ? explode(',', $app->selected_courses) : array();
            if (!in_array((string) $courseid, $existing_courses)) {
                $existing_courses[] = (string) $courseid;
                $app->selected_courses = implode(',', $existing_courses);
                $app->timemodified = time();
                $DB->update_record('local_skillsaint_apps', $app);
            }
        }

        return array('status' => 'success', 'message' => 'Course added to your selection successfully.');
    }

    public static function add_course_to_selection_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    // ========================================================================
    //  PLAN UPGRADE REQUEST SYSTEM
    // ========================================================================

    /**
     * Student requests a plan upgrade.
     */
    public static function request_plan_upgrade_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'Moodle user ID'),
            'target_plan' => new external_value(PARAM_TEXT, 'Target plan id (e.g. premium, executive)'),
        ));
    }

    public static function request_plan_upgrade($userid, $target_plan)
    {
        global $DB;

        // 1. Find the user's application
        $app = $DB->get_record('local_skillsaint_apps', array('userid' => $userid));
        if (!$app) {
            return array('status' => 'error', 'message' => 'No application found for this user.', 'request_id' => 0);
        }

        $current_plan = $app->selected_plan;

        // 2. Validate: can't upgrade to same or lower plan
        $plan_order = array('standard' => 1, 'premium' => 2, 'executive' => 3);
        $current_rank = isset($plan_order[$current_plan]) ? $plan_order[$current_plan] : 0;
        $target_rank = isset($plan_order[$target_plan]) ? $plan_order[$target_plan] : 0;

        if ($target_rank <= $current_rank) {
            return array('status' => 'error', 'message' => 'You can only upgrade to a higher plan.', 'request_id' => 0);
        }

        // 3. Check if there's already a pending request
        $existing = $DB->get_record('local_skillsaint_upgrades', array(
            'userid' => $userid,
            'status' => 'pending'
        ));
        if ($existing) {
            return array('status' => 'error', 'message' => 'You already have a pending upgrade request.', 'request_id' => (int) $existing->id);
        }

        // 4. Calculate price difference from site config
        $price_map = array(
            'standard' => (float) get_config('local_skillsaint', 'price_standard') ?: 299,
            'premium'  => (float) get_config('local_skillsaint', 'price_premium') ?: 499,
            'executive'=> (float) get_config('local_skillsaint', 'price_executive') ?: 999,
        );

        $current_price = isset($price_map[$current_plan]) ? $price_map[$current_plan] : 0;
        $target_price  = isset($price_map[$target_plan]) ? $price_map[$target_plan] : 0;
        $price_diff    = $target_price - $current_price;

        // 5. Create the request
        $record = new stdClass();
        $record->userid = $userid;
        $record->app_id = $app->id;
        $record->current_plan = $current_plan;
        $record->target_plan = $target_plan;
        $record->price_difference = $price_diff;
        $record->status = 'pending';
        $record->timecreated = time();
        $record->timemodified = time();

        $id = $DB->insert_record('local_skillsaint_upgrades', $record);

        return array('status' => 'success', 'message' => 'Upgrade request submitted. Awaiting admin approval.', 'request_id' => (int) $id);
    }

    public static function request_plan_upgrade_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
            'request_id' => new external_value(PARAM_INT, 'The upgrade request ID'),
        ));
    }

    /**
     * Admin: get all upgrade requests (optionally filtered by status).
     */
    public static function get_pending_upgrades_parameters()
    {
        return new external_function_parameters(array(
            'status' => new external_value(PARAM_TEXT, 'Filter by status (pending, approved, rejected, all)', VALUE_DEFAULT, 'all'),
        ));
    }

    public static function get_pending_upgrades($status = 'all')
    {
        global $DB;

        if ($status === 'all') {
            $records = $DB->get_records('local_skillsaint_upgrades', null, 'timecreated DESC');
        } else {
            $records = $DB->get_records('local_skillsaint_upgrades', array('status' => $status), 'timecreated DESC');
        }

        $results = array();
        foreach ($records as $r) {
            // Get user info
            $user = $DB->get_record('user', array('id' => $r->userid), 'id, firstname, lastname, email');
            $fullname = $user ? $user->firstname . ' ' . $user->lastname : 'Unknown';
            $email = $user ? $user->email : '';

            $results[] = array(
                'id' => (int) $r->id,
                'userid' => (int) $r->userid,
                'app_id' => (int) $r->app_id,
                'fullname' => $fullname,
                'email' => $email,
                'current_plan' => $r->current_plan,
                'target_plan' => $r->target_plan,
                'price_difference' => (float) $r->price_difference,
                'status' => $r->status,
                'admin_note' => $r->admin_note ?: '',
                'timecreated' => (int) $r->timecreated,
                'timemodified' => (int) $r->timemodified,
            );
        }

        return $results;
    }

    public static function get_pending_upgrades_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(array(
                'id' => new external_value(PARAM_INT, 'Request ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'app_id' => new external_value(PARAM_INT, 'Application ID'),
                'fullname' => new external_value(PARAM_TEXT, 'Student full name'),
                'email' => new external_value(PARAM_TEXT, 'Student email'),
                'current_plan' => new external_value(PARAM_TEXT, 'Current plan'),
                'target_plan' => new external_value(PARAM_TEXT, 'Target plan'),
                'price_difference' => new external_value(PARAM_FLOAT, 'Price difference'),
                'status' => new external_value(PARAM_TEXT, 'Request status'),
                'admin_note' => new external_value(PARAM_TEXT, 'Admin note'),
                'timecreated' => new external_value(PARAM_INT, 'Created timestamp'),
                'timemodified' => new external_value(PARAM_INT, 'Modified timestamp'),
            ))
        );
    }

    /**
     * Admin: approve an upgrade request.
     * Updates the application plan and recalculates the remaining balance.
     */
    public static function approve_upgrade_parameters()
    {
        return new external_function_parameters(array(
            'request_id' => new external_value(PARAM_INT, 'Upgrade request ID'),
            'admin_note' => new external_value(PARAM_TEXT, 'Optional admin note', VALUE_DEFAULT, ''),
        ));
    }

    public static function approve_upgrade($request_id, $admin_note = '')
    {
        global $DB;

        $request = $DB->get_record('local_skillsaint_upgrades', array('id' => $request_id));
        if (!$request) {
            return array('status' => 'error', 'message' => 'Upgrade request not found.');
        }
        if ($request->status !== 'pending') {
            return array('status' => 'error', 'message' => 'This request has already been processed.');
        }

        // 1. Update the application record
        $app = $DB->get_record('local_skillsaint_apps', array('id' => $request->app_id));
        if ($app) {
            $app->selected_plan = $request->target_plan;
            $app->timemodified = time();
            $DB->update_record('local_skillsaint_apps', $app);

            // 2. If executive, enroll in ALL courses
            if ($request->target_plan === 'executive') {
                $enrol = enrol_get_plugin('manual');
                if ($enrol) {
                    $all_courses = $DB->get_records('course', array('visible' => 1));
                    foreach ($all_courses as $c) {
                        if ($c->id != 1) {
                            $instance = $DB->get_record('enrol', array('courseid' => $c->id, 'enrol' => 'manual'), '*', IGNORE_MISSING);
                            if ($instance) {
                                $enrol->enrol_user($instance, $request->userid, 5);
                            }
                        }
                    }
                }
            }
        }

        // 3. Mark request as approved
        $request->status = 'approved';
        $request->admin_note = $admin_note;
        $request->timemodified = time();
        $DB->update_record('local_skillsaint_upgrades', $request);

        return array('status' => 'success', 'message' => 'Upgrade approved. Student plan has been updated.');
    }

    public static function approve_upgrade_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Admin: reject an upgrade request.
     */
    public static function reject_upgrade_parameters()
    {
        return new external_function_parameters(array(
            'request_id' => new external_value(PARAM_INT, 'Upgrade request ID'),
            'admin_note' => new external_value(PARAM_TEXT, 'Reason for rejection', VALUE_DEFAULT, ''),
        ));
    }

    public static function reject_upgrade($request_id, $admin_note = '')
    {
        global $DB;

        $request = $DB->get_record('local_skillsaint_upgrades', array('id' => $request_id));
        if (!$request) {
            return array('status' => 'error', 'message' => 'Upgrade request not found.');
        }
        if ($request->status !== 'pending') {
            return array('status' => 'error', 'message' => 'This request has already been processed.');
        }

        $request->status = 'rejected';
        $request->admin_note = $admin_note;
        $request->timemodified = time();
        $DB->update_record('local_skillsaint_upgrades', $request);

        return array('status' => 'success', 'message' => 'Upgrade request rejected.');
    }

    public static function reject_upgrade_returns()
    {
        return new external_single_structure(array(
            'status' => new external_value(PARAM_ALPHA, 'success or error'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ));
    }

    /**
     * Student: get own upgrade request status.
     */
    public static function get_my_upgrade_status_parameters()
    {
        return new external_function_parameters(array(
            'userid' => new external_value(PARAM_INT, 'Moodle user ID'),
        ));
    }

    public static function get_my_upgrade_status($userid)
    {
        global $DB;

        $request = $DB->get_record('local_skillsaint_upgrades', array('userid' => $userid, 'status' => 'pending'));
        if (!$request) {
            // Also check the most recent resolved one
            $records = $DB->get_records('local_skillsaint_upgrades', array('userid' => $userid), 'timemodified DESC', '*', 0, 1);
            $request = !empty($records) ? reset($records) : null;
        }

        if (!$request) {
            return array(
                'has_request' => 0,
                'request_id' => 0,
                'current_plan' => '',
                'target_plan' => '',
                'price_difference' => 0.0,
                'status' => 'none',
                'admin_note' => '',
            );
        }

        return array(
            'has_request' => 1,
            'request_id' => (int) $request->id,
            'current_plan' => $request->current_plan,
            'target_plan' => $request->target_plan,
            'price_difference' => (float) $request->price_difference,
            'status' => $request->status,
            'admin_note' => $request->admin_note ?: '',
        );
    }

    public static function get_my_upgrade_status_returns()
    {
        return new external_single_structure(array(
            'has_request' => new external_value(PARAM_INT, '1 if request exists, 0 otherwise'),
            'request_id' => new external_value(PARAM_INT, 'Request ID'),
            'current_plan' => new external_value(PARAM_TEXT, 'Current plan at time of request'),
            'target_plan' => new external_value(PARAM_TEXT, 'Target plan'),
            'price_difference' => new external_value(PARAM_FLOAT, 'Price difference'),
            'status' => new external_value(PARAM_TEXT, 'pending, approved, rejected, or none'),
            'admin_note' => new external_value(PARAM_TEXT, 'Admin note if any'),
        ));
    }
}
