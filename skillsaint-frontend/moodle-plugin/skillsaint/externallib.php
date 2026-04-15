<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

class local_skillsaint_external extends external_api {

    /**
     * Returns parameters for get_all_site_data
     */
    public static function get_all_site_data_parameters() {
        return new external_function_parameters([]);
    }

    /**
     * Get all custom site data from config
     */
    public static function get_all_site_data() {
        global $SITE;

        return [
            'sitename' => $SITE->fullname,
            'summary' => $SITE->summary,
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
        ];
    }

    /**
     * Returns structure for get_all_site_data
     */
    public static function get_all_site_data_returns() {
        return new external_single_structure([
            'sitename' => new external_value(PARAM_TEXT, 'Site name'),
            'summary' => new external_value(PARAM_RAW, 'Site summary'),
            'hero_badge' => new external_value(PARAM_TEXT, 'Badge', VALUE_OPTIONAL),
            'mission_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'mission_content' => new external_value(PARAM_RAW, 'Content', VALUE_OPTIONAL),
            'vision_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'vision_content' => new external_value(PARAM_RAW, 'Content', VALUE_OPTIONAL),
            'about_hero_title' => new external_value(PARAM_TEXT, 'About title', VALUE_OPTIONAL),
            'founder_title' => new external_value(PARAM_TEXT, 'Founder title', VALUE_OPTIONAL),
            'founder_content' => new external_value(PARAM_RAW, 'Founder content', VALUE_OPTIONAL),
            'founder_name' => new external_value(PARAM_TEXT, 'Founder name', VALUE_OPTIONAL),
            'goal_title' => new external_value(PARAM_TEXT, 'Goal title', VALUE_OPTIONAL),
            'goal_content' => new external_value(PARAM_RAW, 'Goal content', VALUE_OPTIONAL),
            'programs_hero_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'programs_hero_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'core_program_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'core_program_items' => new external_value(PARAM_RAW, 'Items', VALUE_OPTIONAL),
            'apply_hero_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'apply_hero_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'price_standard' => new external_value(PARAM_TEXT, 'Price', VALUE_OPTIONAL),
            'quota_standard' => new external_value(PARAM_TEXT, 'Quota', VALUE_OPTIONAL),
            'price_premium' => new external_value(PARAM_TEXT, 'Price', VALUE_OPTIONAL),
            'quota_premium' => new external_value(PARAM_TEXT, 'Quota', VALUE_OPTIONAL),
            'price_executive' => new external_value(PARAM_TEXT, 'Price', VALUE_OPTIONAL),
            'security_note' => new external_value(PARAM_TEXT, 'Note', VALUE_OPTIONAL),
            'highlight_curriculum_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'highlight_curriculum_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'highlight_apply_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'highlight_apply_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'footer_description' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'home_hero_image' => new external_value(PARAM_RAW, 'Hero Image URL', VALUE_OPTIONAL),
            'programs_hero_image' => new external_value(PARAM_RAW, 'Hero Image URL', VALUE_OPTIONAL),
            'home_floating_badge_1' => new external_value(PARAM_TEXT, 'Badge 1', VALUE_OPTIONAL),
            'home_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Subtitle 1', VALUE_OPTIONAL),
            'home_floating_badge_2' => new external_value(PARAM_TEXT, 'Badge 2', VALUE_OPTIONAL),
            'programs_floating_badge_1' => new external_value(PARAM_TEXT, 'Badge 1', VALUE_OPTIONAL),
            'programs_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Subtitle 1', VALUE_OPTIONAL),
            'programs_floating_badge_2' => new external_value(PARAM_TEXT, 'Badge 2', VALUE_OPTIONAL),
        ]);
    }

    /**
     * Returns parameters for save_site_data
     */
    public static function save_site_data_parameters() {
        return new external_function_parameters([
            'sitename' => new external_value(PARAM_TEXT, 'Site name', VALUE_OPTIONAL),
            'summary' => new external_value(PARAM_RAW, 'Summary', VALUE_OPTIONAL),
            'hero_badge' => new external_value(PARAM_TEXT, 'Badge', VALUE_OPTIONAL),
            'mission_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'mission_content' => new external_value(PARAM_RAW, 'Content', VALUE_OPTIONAL),
            'vision_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'vision_content' => new external_value(PARAM_RAW, 'Content', VALUE_OPTIONAL),
            'about_hero_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'founder_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'founder_content' => new external_value(PARAM_RAW, 'Content', VALUE_OPTIONAL),
            'founder_name' => new external_value(PARAM_TEXT, 'Name', VALUE_OPTIONAL),
            'goal_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'goal_content' => new external_value(PARAM_RAW, 'Content', VALUE_OPTIONAL),
            'programs_hero_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'programs_hero_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'core_program_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'core_program_items' => new external_value(PARAM_RAW, 'Items', VALUE_OPTIONAL),
            'apply_hero_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'apply_hero_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'price_standard' => new external_value(PARAM_TEXT, 'Price', VALUE_OPTIONAL),
            'quota_standard' => new external_value(PARAM_TEXT, 'Quota', VALUE_OPTIONAL),
            'price_premium' => new external_value(PARAM_TEXT, 'Price', VALUE_OPTIONAL),
            'quota_premium' => new external_value(PARAM_TEXT, 'Quota', VALUE_OPTIONAL),
            'price_executive' => new external_value(PARAM_TEXT, 'Price', VALUE_OPTIONAL),
            'security_note' => new external_value(PARAM_TEXT, 'Note', VALUE_OPTIONAL),
            'highlight_curriculum_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'highlight_curriculum_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'highlight_apply_title' => new external_value(PARAM_TEXT, 'Title', VALUE_OPTIONAL),
            'highlight_apply_desc' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'footer_description' => new external_value(PARAM_RAW, 'Desc', VALUE_OPTIONAL),
            'home_hero_image' => new external_value(PARAM_RAW, 'Hero Image URL', VALUE_OPTIONAL),
            'programs_hero_image' => new external_value(PARAM_RAW, 'Hero Image URL', VALUE_OPTIONAL),
            'home_floating_badge_1' => new external_value(PARAM_TEXT, 'Badge 1', VALUE_OPTIONAL),
            'home_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Subtitle 1', VALUE_OPTIONAL),
            'home_floating_badge_2' => new external_value(PARAM_TEXT, 'Badge 2', VALUE_OPTIONAL),
            'programs_floating_badge_1' => new external_value(PARAM_TEXT, 'Badge 1', VALUE_OPTIONAL),
            'programs_floating_subtitle_1' => new external_value(PARAM_TEXT, 'Subtitle 1', VALUE_OPTIONAL),
            'programs_floating_badge_2' => new external_value(PARAM_TEXT, 'Badge 2', VALUE_OPTIONAL),
        ]);
    }

    /**
     * Save site data to config
     */
    public static function save_site_data($sitename, $summary, $hero_badge = null, $mission_title = null, $mission_content = null, $vision_title = null, $vision_content = null, $about_hero_title = null, $founder_title = null, $founder_content = null, $founder_name = null, $goal_title = null, $goal_content = null, $programs_hero_title = null, $programs_hero_desc = null, $core_program_title = null, $core_program_items = null, $apply_hero_title = null, $apply_hero_desc = null, $price_standard = null, $quota_standard = null, $price_premium = null, $quota_premium = null, $price_executive = null, $security_note = null, $highlight_curriculum_title = null, $highlight_curriculum_desc = null, $highlight_apply_title = null, $highlight_apply_desc = null, $footer_description = null, $home_floating_badge_1 = null, $home_floating_subtitle_1 = null, $home_floating_badge_2 = null, $programs_floating_badge_1 = null, $programs_floating_subtitle_1 = null, $programs_floating_badge_2 = null, $home_hero_image = null, $programs_hero_image = null) {
        global $SITE, $DB;

        if ($sitename !== null) {
            $SITE->fullname = $sitename;
            $DB->update_record('course', $SITE);
        }
        if ($summary !== null) {
            $SITE->summary = $summary;
            $DB->update_record('course', $SITE);
        }

        $fields = [
            'hero_badge', 'mission_title', 'mission_content', 'vision_title', 'vision_content',
            'about_hero_title', 'founder_title', 'founder_content', 'founder_name', 'goal_title', 'goal_content',
            'programs_hero_title', 'programs_hero_desc', 'core_program_title', 'core_program_items',
            'apply_hero_title', 'apply_hero_desc', 'price_standard', 'quota_standard', 'price_premium', 'quota_premium', 'price_executive', 'security_note',
            'highlight_curriculum_title', 'highlight_curriculum_desc', 'highlight_apply_title', 'highlight_apply_desc', 'footer_description',
            'home_floating_badge_1', 'home_floating_subtitle_1', 'home_floating_badge_2',
            'programs_floating_badge_1', 'programs_floating_subtitle_1', 'programs_floating_badge_2',
            'home_hero_image', 'programs_hero_image'
        ];

        foreach ($fields as $field) {
            if ($$field !== null) {
                set_config($field, $$field, 'local_skillsaint');
            }
        }

        return true;
    }

    /**
     * Returns structure for save_site_data
     */
    public static function save_site_data_returns() {
        return new external_value(PARAM_BOOL, 'True on success');
    }
}
