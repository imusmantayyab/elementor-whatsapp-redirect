(function () {
'use strict';
if (typeof elementorWhatsAppRedirect === 'undefined' || !elementorWhatsAppRedirect.phone) return;

function tidy(s) { return String(s || '').replace(/\\s+/g, ' ').trim(); }
function labelFor(field, form) {
    if (field.id) {
        var labels = form.querySelectorAll('label[for]');
        for (var i = 0; i < labels.length; i++) {
            if (labels[i].htmlFor === field.id && tidy(labels[i].textContent)) return tidy(labels[i].textContent);
        }
    }
    var group = field.closest('.elementor-field-group');
    var label = group && group.querySelector('.elementor-field-label');
    if (label && tidy(label.textContent)) return tidy(label.textContent);
    if (field.placeholder) return tidy(field.placeholder);
    return tidy((field.name || 'Field').replace(/^form_fields\\[/, '').replace(/\\]$/, '').replace(/[_-]+/g, ' '));
}
document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.matches || !form.matches('form.elementor-form')) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    var lines = [];
    form.querySelectorAll('input, textarea, select').forEach(function (field) {
        var type = (field.type || '').toLowerCase();
        if (field.disabled || ['hidden','submit','button','reset','file'].indexOf(type) !== -1 ||
            field.name === 'g-recaptcha-response' || field.classList.contains('g-recaptcha-response')) return;
        if ((type === 'checkbox' || type === 'radio') && !field.checked) return;

        var value = field.value || '';
        if (field.tagName === 'SELECT' && field.multiple) {
            value = Array.from(field.selectedOptions).map(function (o) { return o.text; }).join(', ');
        }
        if (type === 'checkbox' && !value) value = 'Yes';
        value = String(value).trim();
        if (value) lines.push('*' + labelFor(field, form) + ':* ' + value);
    });

    var message = '*New Website Inquiry*\\n\\n' + lines.join('\\n');
    var url = 'https://wa.me/' + encodeURIComponent(elementorWhatsAppRedirect.phone) + '?text=' + encodeURIComponent(message);
    var popup = window.open(url, '_blank');
    if (popup) popup.opener = null;
}, true);
})();
