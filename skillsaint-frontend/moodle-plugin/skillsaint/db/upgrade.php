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

    return true;
}
