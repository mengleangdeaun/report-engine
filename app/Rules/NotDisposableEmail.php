<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NotDisposableEmail implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    $disposableDomains = ['tempmail.com', 'yopmail.com', 'mailinator.com', 'guerrillamail.com']; 
    // In production, you might fetch a larger list from a config file or API

    $domain = substr(strrchr($value, "@"), 1);

    if (in_array($domain, $disposableDomains)) {
        $fail("Temporary email addresses are not allowed.");
    }
}
}
