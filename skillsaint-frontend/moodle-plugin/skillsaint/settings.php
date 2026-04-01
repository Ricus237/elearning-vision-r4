<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_skillsaint', 'Skillsaint Site CMS');

    // --- SECTION: HOME PAGE ---
    $settings->add(new admin_setting_heading('local_skillsaint_homepage_heading', 'HOME PAGE', ''));
    $settings->add(new admin_setting_configtext('local_skillsaint/hero_badge', 'Hero Badge', '', 'Empowering Spiritual Leaders'));
    $settings->add(new admin_setting_configtext('local_skillsaint/mission_title', 'Mission Title', '', 'Mission Statement'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/mission_content', 'Mission Content', '', 'To form mature believers...'));
    $settings->add(new admin_setting_configtext('local_skillsaint/vision_title', 'Vision Title', '', 'Vision Statement'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/vision_content', 'Vision Content', '', 'To cultivate believers...'));

    // --- SECTION: ABOUT PAGE ---
    $settings->add(new admin_setting_heading('local_skillsaint_aboutpage_heading', 'ABOUT PAGE', ''));
    $settings->add(new admin_setting_configtext('local_skillsaint/about_hero_title', 'Hero Title', '', 'Our Identity & Vision'));
    $settings->add(new admin_setting_configtext('local_skillsaint/founder_title', 'Founder Section Title', '', 'Welcome Letter from Founder'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/founder_content', 'Founder Letter', '', 'Welcome to the International Bible Institute...'));
    $settings->add(new admin_setting_configtext('local_skillsaint/founder_name', 'Founder Name', '', 'In Christ, Our Founder'));
    $settings->add(new admin_setting_configtext('local_skillsaint/goal_title', 'Goal Title', '', 'Our Goal'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/goal_content', 'Goal Statement', '', 'Raising a generation of leaders...'));

    // --- SECTION: PROGRAMS PAGE ---
    $settings->add(new admin_setting_heading('local_skillsaint_programspage_heading', 'PROGRAMS PAGE', ''));
    $settings->add(new admin_setting_configtext('local_skillsaint/programs_hero_title', 'Hero Title', '', 'Academic Programs'));
    $settings->add(new admin_setting_configtext('local_skillsaint/programs_hero_desc', 'Hero Description', '', 'Equipping the next generation of spiritual and global leaders.'));
    $settings->add(new admin_setting_configtext('local_skillsaint/core_program_title', 'Core Program Name', '', 'Kingdom Foundations'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/core_program_items', 'Lesson Format Items (one per line)', '', "40-minute pre-recorded lessons\nDaily journaling\nPractical assignments"));

    // --- SECTION: ENROLLMENT (APPLY) PAGE ---
    $settings->add(new admin_setting_heading('local_skillsaint_applypage_heading', 'ENROLLMENT PAGE', ''));
    $settings->add(new admin_setting_configtext('local_skillsaint/apply_hero_title', 'Hero Title', '', 'Apply to IBI'));
    $settings->add(new admin_setting_configtext('local_skillsaint/apply_hero_desc', 'Hero Description', '', 'Complete your application form and choose your program.'));
    
    // Plans settings
    $settings->add(new admin_setting_configtext('local_skillsaint/price_standard', 'Standard Price ($)', '', '299'));
    $settings->add(new admin_setting_configtext('local_skillsaint/quota_standard', 'Standard Quota (courses)', '', '3'));
    
    $settings->add(new admin_setting_configtext('local_skillsaint/price_premium', 'Premium Price ($)', '', '499'));
    $settings->add(new admin_setting_configtext('local_skillsaint/quota_premium', 'Premium Quota (courses)', '', '6'));
    
    $settings->add(new admin_setting_configtext('local_skillsaint/price_executive', 'Executive Price ($)', '', '999'));
    
    $settings->add(new admin_setting_configtext('local_skillsaint/security_note', 'Security Note', '', 'Your data is secured by 256-bit encryption. Safe enrollment process.'));

    $ADMIN->add('localplugins', $settings);
}
