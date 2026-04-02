<?php
defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_skillsaint_get_all_site_data' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'get_all_site_data',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Get all site-wide configuration (Home, About, Programs)',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_save_application' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'save_application',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Save or update a student application before payment',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_confirm_payment' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'confirm_payment',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Finalize payment and enroll user',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_activate_account' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'activate_account',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Activate account using code',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_check_activation' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'check_activation',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Check if account is activated',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_get_admin_dashboard_stats' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'get_admin_dashboard_stats',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Get live admin dashboard statistics from Moodle DB',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_get_all_admin_users' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'get_all_admin_users',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Get all Moodle users for admin management',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> '',
    ),
    'local_skillsaint_get_all_paid_applications' => array(
        'classname'   => 'local_skillsaint_external',
        'methodname'  => 'get_all_paid_applications',
        'classpath'   => 'local/skillsaint/externallib.php',
        'description' => 'Get all paid applications for finance page',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> '',
    ),
);

$services = array(
    'Skillsaint Site Service' => array(
        'functions' => array(
            'local_skillsaint_get_all_site_data',
            'local_skillsaint_save_application',
            'local_skillsaint_confirm_payment',
            'local_skillsaint_activate_account',
            'local_skillsaint_check_activation',
            'local_skillsaint_get_admin_dashboard_stats',
            'local_skillsaint_get_all_admin_users',
            'local_skillsaint_get_all_paid_applications',
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
    )
);
