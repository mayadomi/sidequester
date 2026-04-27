<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class ValidGpxFile implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The :attribute must be a valid GPX file.');

            return;
        }

        if (strtolower($value->getClientOriginalExtension()) !== 'gpx') {
            $fail('The :attribute must have a .gpx extension.');

            return;
        }

        $content = file_get_contents($value->getRealPath());

        if ($content === false || trim($content) === '') {
            $fail('The :attribute cannot be empty.');

            return;
        }

        // LIBXML_NONET prevents network access for external DTDs/entities,
        // guarding against server-side request forgery via malicious XML.
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($content, 'SimpleXMLElement', LIBXML_NONET);
        $errors = libxml_get_errors();
        libxml_clear_errors();
        libxml_use_internal_errors(false);

        if ($xml === false || ! empty($errors)) {
            $fail('The :attribute is not a valid XML file.');

            return;
        }

        if ($xml->getName() !== 'gpx') {
            $fail('The :attribute must be a valid GPX file.');

            return;
        }
    }
}
