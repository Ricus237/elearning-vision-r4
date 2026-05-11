<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_skillsaint', 'Skillsaint Plugin Settings');
    $ADMIN->add('localplugins', $settings);

    $settings->add(new admin_setting_configtext('local_skillsaint/vision_title', 'Vision Title', '', 'Vision Statement'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/vision_content', 'Vision Content', '', 'To cultivate believers who transform every sphere of society.'));

    $settings->add(new admin_setting_configtext('local_skillsaint/highlight_curriculum_title', 'Highlight 1: Curriculum Title', '', 'Curriculum Overview'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/highlight_curriculum_desc', 'Highlight 1: Curriculum Description', '', 'Discover our Kingdom Foundations program, subjects, and study schedule.'));

    $settings->add(new admin_setting_configtext('local_skillsaint/highlight_apply_title', 'Highlight 2: Application Title', '', 'Application Form'));
    $settings->add(new admin_setting_configtextarea('local_skillsaint/highlight_apply_desc', 'Highlight 2: Application Description', '', 'Ready to join? Start your application process here and join our global community.'));

    $settings->add(new admin_setting_configtextarea('local_skillsaint/footer_description', 'Footer Description', '', 'A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God'));

    // Floating Badges Home
    $settings->add(new admin_setting_configtext('local_skillsaint/home_floating_badge_1', 'Home: Card 1 Title', '', 'Global Leadership Community'));
    $settings->add(new admin_setting_configtext('local_skillsaint/home_floating_subtitle_1', 'Home: Card 1 Subtitle', '', 'Join the Vision'));
    $settings->add(new admin_setting_configtext('local_skillsaint/home_floating_badge_2', 'Home: Card 2 Title', '', 'Accredited Programs'));

    // Floating Badges Programs
    $settings->add(new admin_setting_configtext('local_skillsaint/programs_floating_badge_1', 'Programs: Card 1 Title', '', 'Academic Excellence'));
    $settings->add(new admin_setting_configtext('local_skillsaint/programs_floating_subtitle_1', 'Programs: Card 1 Subtitle', '', 'Rigorous Study'));
    $settings->add(new admin_setting_configtext('local_skillsaint/programs_floating_badge_2', 'Programs: Card 2 Title', '', 'Certified Curriculum'));

    // Stripe & Billing Settings
    $settings->add(new admin_setting_heading('local_skillsaint/billing_header', 'Billing & Stripe Settings', 'Configure autopay and pricing'));
    $settings->add(new admin_setting_configtext('local_skillsaint/stripe_secret_key', 'Stripe Secret Key', 'Your sk_live_... or sk_test_... key', '', PARAM_RAW));
    $settings->add(new admin_setting_configtext('local_skillsaint/price_standard', 'Standard Plan Price', 'Total amount in USD', '299'));
    $settings->add(new admin_setting_configtext('local_skillsaint/price_premium', 'Premium Plan Price', 'Total amount in USD', '499'));
    $settings->add(new admin_setting_configtext('local_skillsaint/price_executive', 'Executive Plan Price', 'Total amount in USD', '999'));
}
