<?php
/**
 * Plugin Name: Elementor & WPForms WhatsApp Redirect
 * Plugin URI: https://github.com/imusmantayyab/elementor-whatsapp-redirect
 * Description: Redirects Elementor Forms and WPForms submissions to WhatsApp with collected field values using a configurable phone number.
 * Version: 1.1.1
 * Author: Usman Tayyab
 * Author URI: https://www.linkedin.com/in/imusmantayyab/
 * License: GPL2
 */
if (!defined('ABSPATH')) exit;
define('EWR_PHONE_OPTION', 'ewr_whatsapp_phone');

register_activation_hook(__FILE__, function () {
    if (get_option(EWR_PHONE_OPTION, false) === false) {
        add_option(EWR_PHONE_OPTION, '');
    }
});

add_action('admin_menu', function () {
    add_options_page(
        'WhatsApp Form Redirect',
        'WhatsApp Redirect',
        'manage_options',
        'elementor-whatsapp-redirect',
        'ewr_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting('ewr_settings', EWR_PHONE_OPTION, [
        'type' => 'string',
        'sanitize_callback' => function ($value) {
            return preg_replace('/\D+/', '', (string) $value);
        },
        'default' => ''
    ]);
});

function ewr_settings_page() {
    if (!current_user_can('manage_options')) return;
    $phone = get_option(EWR_PHONE_OPTION, '');
    ?>
    <div class="wrap">
      <h1>WhatsApp Form Redirect</h1>
      <p>Enter the WhatsApp number that should receive inquiries from Elementor Forms and WPForms.</p>
      <form method="post" action="options.php">
        <?php settings_fields('ewr_settings'); ?>
        <table class="form-table"><tr>
          <th><label for="ewr-phone">WhatsApp Number</label></th>
          <td>
            <input id="ewr-phone" class="regular-text" type="tel" name="<?php echo esc_attr(EWR_PHONE_OPTION); ?>" value="<?php echo esc_attr($phone); ?>" placeholder="971501234567">
            <p class="description">Include full international number with country code. Digits only; no +, spaces, or dashes (e.g., 971501234567).</p>
          </td>
        </tr></table>
        <?php submit_button('Save WhatsApp Number'); ?>
      </form>
    </div>
    <?php
}

add_action('admin_notices', function () {
    if (!current_user_can('manage_options') || get_option(EWR_PHONE_OPTION, '') !== '') return;
    $url = admin_url('options-general.php?page=elementor-whatsapp-redirect');
    echo '<div class="notice notice-warning"><p><strong>WhatsApp Form Redirect:</strong> Please add your WhatsApp number to enable redirects for Elementor Forms and WPForms. <a href="' . esc_url($url) . '">Add your WhatsApp number</a>. This notice disappears after saving a number.</p></div>';
});

add_action('wp_enqueue_scripts', function () {
    $phone = get_option(EWR_PHONE_OPTION, '');
    if (!$phone) return;
    wp_enqueue_script('ewr-script', plugin_dir_url(__FILE__) . 'assets/js/redirect.js', [], '1.1.1', true);
    wp_localize_script('ewr-script', 'elementorWhatsAppRedirect', [
        'phone' => $phone
    ]);
});
