<?php
defined('MOODLE_INTERNAL') || die();

function xmldb_local_skillsaint_upgrade($oldversion) {
    global $CFG, $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2024040114) {
        $table = new xmldb_table('local_skillsaint_apps');

        if (!$dbman->table_exists($table)) {
            // 🚨 EMERGENCY FIX: Re-create the entire table if it went completely missing!
            $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
            $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('fullname', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
            $table->add_field('email', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
            $table->add_field('phone', XMLDB_TYPE_CHAR, '50', null, null, null, null);
            $table->add_field('address', XMLDB_TYPE_TEXT, null, null, null, null, null);
            $table->add_field('motivation', XMLDB_TYPE_TEXT, null, null, null, null, null);
            $table->add_field('spiritual_bg', XMLDB_TYPE_TEXT, null, null, null, null, null);
            $table->add_field('selected_plan', XMLDB_TYPE_CHAR, '50', null, XMLDB_NOTNULL, null, null);
            $table->add_field('selected_courses', XMLDB_TYPE_TEXT, null, null, null, null, null);
            $table->add_field('payment_status', XMLDB_TYPE_CHAR, '20', null, XMLDB_NOTNULL, null, 'pending');
            $table->add_field('activation_code', XMLDB_TYPE_CHAR, '20', null, null, null, null);
            $table->add_field('is_activated', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

            $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
            $table->add_index('email_idx', XMLDB_INDEX_NOTUNIQUE, array('email'));

            $dbman->create_table($table);
        } else {
            // The table exists, we just upgrade it
            $field = new xmldb_field('activation_code', XMLDB_TYPE_CHAR, '20', null, null, null, null, 'payment_status');
            if (!$dbman->field_exists($table, $field)) {
                $dbman->add_field($table, $field);
            }

            $field = new xmldb_field('is_activated', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0', 'activation_code');
            if (!$dbman->field_exists($table, $field)) {
                $dbman->add_field($table, $field);
            }
        }

        upgrade_plugin_savepoint(true, 2024040114, 'local', 'skillsaint');
    }

    if ($oldversion < 2024041050) {
        $table = new xmldb_table('local_skillsaint_inquiries');

        if (!$dbman->table_exists($table)) {
            $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
            $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('courseid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('subject', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
            $table->add_field('message', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
            $table->add_field('admin_reply', XMLDB_TYPE_TEXT, null, null, null, null, null);
            $table->add_field('status', XMLDB_TYPE_CHAR, '20', null, XMLDB_NOTNULL, null, 'open');
            $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

            $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
            $table->add_index('userid_idx', XMLDB_INDEX_NOTUNIQUE, array('userid'));
            $table->add_index('courseid_idx', XMLDB_INDEX_NOTUNIQUE, array('courseid'));

            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2024041050, 'local', 'skillsaint');
    }

    if ($oldversion < 2024041060) {
        $table = new xmldb_table('local_skillsaint_messages');

        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('inquiry_id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('message', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_key('inquiry_fk', XMLDB_KEY_FOREIGN, array('inquiry_id'), 'local_skillsaint_inquiries', array('id'));

        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2024041060, 'local', 'skillsaint');
    }

    if ($oldversion < 2024041085) {
        $table = new xmldb_table('local_skillsaint_exam_results');

        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('quizid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('score', XMLDB_TYPE_NUMBER, '10, 2', null, XMLDB_NOTNULL, null, '0.00');
        $table->add_field('correct_count', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('total_questions', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('attempt_number', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '1');
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_index('user_quiz_idx', XMLDB_INDEX_NOTUNIQUE, array('userid', 'quizid'));

        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2024041085, 'local', 'skillsaint');
    }

    return true;
}
