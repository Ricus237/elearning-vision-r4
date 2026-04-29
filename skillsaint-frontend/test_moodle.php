<?php
define('CLI_SCRIPT', true);
require('/var/www/html/moodle/config.php');
require_once('/var/www/html/moodle/local/skillsaint/externallib.php');

$admin = $DB->get_record('user', array('username' => 'admin'));
\core\session\manager::set_user($admin);

try {
    $res = local_skillsaint_external::get_course_curriculum(7);
    external_api::clean_returnvalue(local_skillsaint_external::get_course_curriculum_returns(), $res);
    echo "SUCCESS\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    if (isset($e->debuginfo)) {
        echo "DEBUGINFO: " . $e->debuginfo . "\n";
    }
}
