<?php
namespace local_skillsaint\task;

defined('MOODLE_INTERNAL') || die();

class autopay_task extends \core\task\scheduled_task {
    
    public function get_name() {
        return get_string('autopay_task', 'local_skillsaint');
    }

    public function execute() {
        global $DB, $CFG;

        $today = (int) date('j');
        // Stripe Secret Key from Moodle config or fallback to env-like constant
        $stripe_key = get_config('local_skillsaint', 'stripe_secret_key') ?: ''; 
        
        if (empty($stripe_key)) {
            mtrace("Autopay: No Stripe Secret Key found in local_skillsaint config.");
            return;
        }

        // Find users due today for autopay
        $records = $DB->get_records('local_skillsaint_apps', array('autopay_day' => $today));
        
        foreach ($records as $app) {
            // Security: Check if the Moodle user still exists and is active
            if (!$DB->record_exists('user', array('id' => $app->userid, 'deleted' => 0, 'suspended' => 0))) {
                mtrace("Autopay: Skipping User ID {$app->userid} (User not found, deleted, or suspended).");
                continue;
            }

            if (empty($app->stripe_customer_id) || empty($app->stripe_payment_method)) {
                continue;
            }

            // Calculate balance
            $paid = $DB->get_field_sql("SELECT SUM(amount) FROM {local_skillsaint_payments} WHERE app_id = ?", array($app->id)) ?: 0;
            $plan = strtolower($app->selected_plan);
            $total = (float) get_config('local_skillsaint', 'price_' . $plan);
            if ($total <= 0) {
                 if ($plan === 'executive') $total = 999.00;
                 else if ($plan === 'premium') $total = 499.00;
                 else $total = 199.00;
            }

            $balance = $total - $paid;
            if ($balance <= 0) {
                // Auto-disable if paid off
                $app->autopay_day = 0;
                $DB->update_record('local_skillsaint_apps', $app);
                continue;
            }

            $amount_to_charge = min($balance, (float) $app->autopay_amount);
            if ($amount_to_charge <= 0) continue;

            mtrace("Autopay: Attempting to charge $amount_to_charge USD for User ID {$app->userid}...");

            // Call Stripe Payment Intent (Off-session)
            $result = $this->stripe_charge($stripe_key, $app->stripe_customer_id, $app->stripe_payment_method, $amount_to_charge);

            if ($result && isset($result['status']) && ($result['status'] === 'succeeded' || $result['status'] === 'processing')) {
                // Success! Record payment
                $payment = new \stdClass();
                $payment->userid = $app->userid;
                $payment->app_id = $app->id;
                $payment->amount = $amount_to_charge;
                $payment->method = 'stripe_autopay';
                $payment->transaction_id = $result['id'] ?? 'auto_' . time();
                $payment->currency = 'USD';
                $payment->timecreated = time();
                $DB->insert_record('local_skillsaint_payments', $payment);
                mtrace("Autopay: ✅ Success for User ID {$app->userid}. TXN: {$payment->transaction_id}");
            } else {
                mtrace("Autopay: ❌ Failed for User ID {$app->userid}. Error: " . ($result['error']['message'] ?? 'Unknown error'));
            }
        }
    }

    private function stripe_charge($key, $customer_id, $payment_method, $amount) {
        $url = "https://api.stripe.com/v1/payment_intents";
        $data = array(
            'amount' => (int) ($amount * 100),
            'currency' => 'usd',
            'customer' => $customer_id,
            'payment_method' => $payment_method,
            'off_session' => 'true',
            'confirm' => 'true',
            'description' => 'Autopay Installment',
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_USERPWD, $key . ':');

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}
