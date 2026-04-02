<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_skillsaint';
$plugin->version   = 2024040118; // Bumped: Forced direct DB get_records for users
$plugin->requires  = 2020061500;
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = '1.16';
