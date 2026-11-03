(function () {
    'use strict';

    if (typeof elementorWhatsAppRedirect === 'undefined' || !elementorWhatsAppRedirect.phone) {
        return;
    }

    function tidy(s) {
        return String(s || '').replace(/\s+/g, ' ').trim();
    }

    function cleanLabelText(element) {
        if (!element) return '';
        var clone = element.cloneNode(true);
        // Remove required asterisks, screen-reader text, and decorative markers
        var unwanted = clone.querySelectorAll('.wpforms-required-label, .elementor-mark-required, .screen-reader-text, [aria-hidden="true"]');
        for (var i = 0; i < unwanted.length; i++) {
            if (unwanted[i].parentNode) {
                unwanted[i].parentNode.removeChild(unwanted[i]);
            }
        }
        var text = tidy(clone.textContent);
        // Strip trailing asterisks and punctuation
        return text.replace(/\s*\*+\s*$/, '').trim();
    }

    function findOptionText(field, form) {
        // Find label specifically associated with this single choice/option
        if (field.id) {
            var idEscaped = field.id.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, '\\$1');
            var labelEl = form.querySelector('label[for="' + idEscaped + '"]');
            if (labelEl && !labelEl.classList.contains('wpforms-field-label') && !labelEl.classList.contains('elementor-field-label')) {
                var txt = cleanLabelText(labelEl);
                if (txt) return txt;
            }
        }
        var parentItem = field.closest('.wpforms-image-choices-item, .elementor-field-option, li, label');
        if (parentItem) {
            var inlineLabel = parentItem.querySelector('.wpforms-field-label-inline, label');
            if (inlineLabel) {
                var txt2 = cleanLabelText(inlineLabel);
                if (txt2) return txt2;
            }
            if (parentItem.tagName === 'LABEL') {
                var txt3 = cleanLabelText(parentItem);
                if (txt3) return txt3;
            }
        }
        return '';
    }

    function getFieldLabel(field, form) {
        var labelText = '';

        // Check for field container in WPForms
        var wpformsContainer = field.closest('.wpforms-field');
        if (wpformsContainer) {
            var mainLabelEl = wpformsContainer.querySelector('.wpforms-field-label');
            var mainLabel = cleanLabelText(mainLabelEl);

            // Check if there is a sublabel (e.g. First Name / Last Name)
            var subLabelEl = null;
            if (field.id) {
                var idEscapedSub = field.id.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, '\\$1');
                subLabelEl = wpformsContainer.querySelector('label[for="' + idEscapedSub + '"].wpforms-field-sublabel');
            }
            if (!subLabelEl) {
                var rowBlock = field.closest('.wpforms-field-row-block');
                if (rowBlock) {
                    subLabelEl = rowBlock.querySelector('.wpforms-field-sublabel');
                }
            }

            if (subLabelEl) {
                var subText = cleanLabelText(subLabelEl);
                if (mainLabel && subText && mainLabel.toLowerCase() !== subText.toLowerCase()) {
                    labelText = mainLabel + ' (' + subText + ')';
                } else if (subText) {
                    labelText = subText;
                }
            } else if (mainLabel) {
                labelText = mainLabel;
            }
        }

        // Elementor field group label
        if (!labelText) {
            var elemGroup = field.closest('.elementor-field-group');
            if (elemGroup) {
                var elemLabel = elemGroup.querySelector('.elementor-field-label');
                if (elemLabel) {
                    labelText = cleanLabelText(elemLabel);
                }
            }
        }

        // Label matching field.id
        if (!labelText && field.id) {
            var idEscapedDirect = field.id.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, '\\$1');
            var directLabel = form.querySelector('label[for="' + idEscapedDirect + '"]');
            if (directLabel) {
                labelText = cleanLabelText(directLabel);
            }
        }

        // Parent label tag
        if (!labelText) {
            var parentLabel = field.closest('label');
            if (parentLabel) {
                labelText = cleanLabelText(parentLabel);
            }
        }

        // ARIA label
        if (!labelText && field.getAttribute('aria-label')) {
            labelText = tidy(field.getAttribute('aria-label'));
        }

        // Placeholder
        if (!labelText && field.placeholder) {
            labelText = tidy(field.placeholder);
        }

        // Fallback to parsed field name
        if (!labelText && field.name) {
            var raw = field.name
                .replace(/^form_fields\[/, '')
                .replace(/\]$/, '')
                .replace(/^wpforms\[fields\]\[\d+\](\[)?/, '')
                .replace(/\]$/, '')
                .replace(/[_-]+/g, ' ');
            raw = tidy(raw);
            if (raw && isNaN(Number(raw))) {
                labelText = raw.charAt(0).toUpperCase() + raw.slice(1);
            }
        }

        return labelText || 'Field';
    }

    function getTargetForm(element) {
        if (!element || element.nodeType !== 1) return null;
        var form = element.tagName === 'FORM' ? element : element.closest('form');
        if (!form) return null;

        var isElementor = form.classList.contains('elementor-form') || !!form.closest('.elementor-form');
        var isWPForms = form.classList.contains('wpforms-form') ||
                        (form.id && form.id.indexOf('wpforms-form-') === 0) ||
                        !!form.closest('.wpforms-form, .wpforms-container');

        if (isElementor || isWPForms) {
            return form;
        }
        return null;
    }

    document.addEventListener('submit', function (event) {
        var form = getTargetForm(event.target);
        if (!form) return;

        // Perform validation check if available
        try {
            if (window.jQuery && typeof window.jQuery.fn.validate === 'function') {
                var $form = window.jQuery(form);
                if ($form.data('validator') && typeof $form.valid === 'function') {
                    if (!$form.valid()) {
                        return;
                    }
                }
            } else if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
                if (typeof form.reportValidity === 'function') {
                    form.reportValidity();
                }
                return;
            }
        } catch (err) {
            // Proceed if validation inspection errors out
        }

        // Prevent standard form submission & other AJAX listeners
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }

        // Avoid double trigger
        if (form.dataset.ewrSubmitting === 'true') {
            return;
        }
        form.dataset.ewrSubmitting = 'true';
        setTimeout(function () {
            delete form.dataset.ewrSubmitting;
        }, 3000);

        var entries = [];
        var checkboxGroups = {};

        var fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(function (field) {
            var type = (field.type || '').toLowerCase();
            var tagName = field.tagName.toLowerCase();

            // Skip disabled, buttons, submits, resets, files, images
            if (field.disabled || ['hidden', 'submit', 'button', 'reset', 'file', 'image'].indexOf(type) !== -1) {
                return;
            }

            // Skip honeypots
            if (field.name && /wpforms\[hp\]/i.test(field.name)) return;
            if (field.closest('.wpforms-field-hp, .elementor-field-type-honeypot')) return;

            // Skip reCAPTCHA / hCaptcha / Cloudflare Turnstile
            if (field.name && /recaptcha|turnstile|hcaptcha/i.test(field.name)) return;
            if (field.className && /recaptcha|turnstile|hcaptcha/i.test(field.className)) return;
            if (field.closest('.wpforms-recaptcha-container, .elementor-g-recaptcha')) return;

            // Radio buttons
            if (type === 'radio') {
                if (!field.checked) return;
                var radioLabel = getFieldLabel(field, form);
                var radioVal = findOptionText(field, form) || tidy(field.value);
                if (radioVal) {
                    entries.push({ label: radioLabel, value: radioVal });
                }
                return;
            }

            // Checkboxes
            if (type === 'checkbox') {
                if (!field.checked) return;
                var groupKey = field.name || (field.closest('.wpforms-field, .elementor-field-group') ? field.closest('.wpforms-field, .elementor-field-group').id : '') || field.id;
                var cbLabel = getFieldLabel(field, form);
                var cbVal = findOptionText(field, form) || (field.value && field.value !== 'on' ? tidy(field.value) : 'Yes');

                if (!checkboxGroups[groupKey]) {
                    checkboxGroups[groupKey] = {
                        label: cbLabel,
                        values: [cbVal]
                    };
                    entries.push(checkboxGroups[groupKey]);
                } else {
                    checkboxGroups[groupKey].values.push(cbVal);
                }
                return;
            }

            // Dropdowns (<select>)
            if (tagName === 'select') {
                var selectLabel = getFieldLabel(field, form);
                if (field.multiple) {
                    var selected = Array.from(field.selectedOptions || [])
                        .map(function (opt) { return tidy(opt.text || opt.value); })
                        .filter(Boolean);
                    if (selected.length > 0) {
                        entries.push({ label: selectLabel, value: selected.join(', ') });
                    }
                } else {
                    if (field.selectedIndex >= 0) {
                        var opt = field.options[field.selectedIndex];
                        if (opt && (opt.value || field.selectedIndex > 0)) {
                            var optVal = tidy(opt.text || opt.value);
                            if (optVal) {
                                entries.push({ label: selectLabel, value: optVal });
                            }
                        }
                    }
                }
                return;
            }

            // Text inputs, email, tel, number, textarea, date, time
            var val = tidy(field.value);
            if (!val) return;

            var label = getFieldLabel(field, form);
            entries.push({ label: label, value: val });
        });

        if (entries.length === 0) {
            return;
        }

        var lines = [];
        entries.forEach(function (entry) {
            var valStr = Array.isArray(entry.values) ? entry.values.join(', ') : entry.value;
            if (valStr) {
                lines.push('*' + entry.label + ':* ' + valStr);
            }
        });

        if (lines.length === 0) {
            return;
        }

        var rawPhone = String(elementorWhatsAppRedirect.phone || '').replace(/\D+/g, '');
        if (!rawPhone) return;

        var message = '*New Website Inquiry*\n\n' + lines.join('\n');
        // Ensure all escaped \n sequences are converted to actual line breaks
        message = message.replace(/\\r\\n|\\n|\\r/g, '\n');
        var waUrl = 'https://wa.me/' + encodeURIComponent(rawPhone) + '?text=' + encodeURIComponent(message);

        var popup = window.open(waUrl, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            window.location.href = waUrl;
        } else if (popup) {
            popup.opener = null;
        }
    }, true);
})();
