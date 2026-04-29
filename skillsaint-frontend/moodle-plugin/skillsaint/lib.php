<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Serves files for the local_skillsaint plugin.
 *
 * @param stdClass $course course object
 * @param stdClass $cm course module object
 * @param stdClass $context context object
 * @param string $filearea file area
 * @param array $args extra arguments
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 * @return bool false if file not found, does not return if found - justsend the file
 */
function local_skillsaint_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = array()) {
    if ($filearea !== 'summaryfiles') {
        return false;
    }

    // Require course context for summaryfiles
    if ($context->contextlevel != CONTEXT_COURSE) {
        return false;
    }

    require_login($course, false, $cm);

    $fs = get_file_storage();

    $itemid = array_shift($args);
    $filename = array_pop($args);
    if (!$args) {
        $filepath = '/';
    } else {
        $filepath = '/'.implode('/', $args).'/';
    }

    $file = $fs->get_file($context->id, 'local_skillsaint', $filearea, $itemid, $filepath, $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }

    // Serve the file
    send_stored_file($file, 86400, 0, $forcedownload, $options);
}
