<?php
require_once(__DIR__ . '/../../config.php');

require_login();
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/skillsaint/test_users.php'));
$PAGE->set_title("Test Users Output");

echo $OUTPUT->header();

global $DB;
$users = $DB->get_records('user', array('deleted' => 0));

echo "<h3>Total normal users in mdl_user: " . count($users) . "</h3>";
echo "<ul>";
foreach ($users as $u) {
    if ($u->id == 1) continue;
    echo "<li>" . s($u->id) . " - " . s($u->firstname) . " " . s($u->lastname) . " (" . s($u->email) . ")</li>";
}
echo "</ul>";

$sql_all = "SELECT * FROM {user}";
$all_raw = $DB->get_records_sql($sql_all);
echo "<h3>Total ALL ROWS in {user}: " . count($all_raw) . "</h3>";
echo "<ul>";
foreach ($all_raw as $r) {
    echo "<li>" . s($r->id) . " - " . s($r->email) . " - deleted=" . s($r->deleted) . " suspended=" . s($r->suspended) . "</li>";
}
echo "</ul>";

echo $OUTPUT->footer();
