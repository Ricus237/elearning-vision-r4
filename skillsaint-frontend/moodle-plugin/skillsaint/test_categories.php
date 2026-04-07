<?php
require_once(__DIR__ . '/../../config.php');
require_login();
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/skillsaint/test_categories.php'));

echo "Available Course Categories:\n";
global $DB;
$categories = $DB->get_records('course_categories', array());
foreach ($categories as $cat) {
    echo "ID: " . $cat->id . " | Name: " . $cat->name . "\n";
}
