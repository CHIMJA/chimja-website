/* Services inquiry validation and guarded Web3Forms submission. */
(() => {
  'use strict';
  const form = document.getElementById('project-inquiry');
  if (!form) return;
  const fields = document.getElementById('inquiry-fields');
  const button = document.getElementById('inquiry-submit');
  const status = document.getElementById('inquiry-status');
  const error = document.getElementById('inquiry-error');
  const availability = document.getElementById('form-availability');
  const placeholder = 'CHIMJA_WEB3FORMS_ACCESS_KEY_REPLACE_ME';
  const configured = () => {
    const key = form.elements.namedItem('access_key').value.trim();
    return Boolean(key && key !== placeholder);
  };
  // Suppress native popups only after the custom validation handler is available.
  form.noValidate = true;
  const validationFields = ['full-name', 'email', 'company', 'service-interest', 'budget', 'timeline', 'description']
    .map(id => document.getElementById(id));
  const touched = new Set();
  let validationSummaryActive = false;
  const missingMessages = {
    'full-name': 'Please enter your name.',
    email: 'Please enter your email address.',
    'service-interest': 'Please select a service.',
    description: 'Please briefly describe your project.'
  };
  const validateField = field => {
    const validity = field.validity;
    let message = '';
    if (validity.valueMissing || (field.required && !field.value.trim())) message = missingMessages[field.id];
    else if (field.id === 'email' && validity.typeMismatch) message = 'Please enter a valid email address.';
    else if (validity.tooLong) message = `Please use no more than ${field.maxLength} characters.`;
    else if (!validity.valid) message = 'Please check this field.';
    const feedback = document.getElementById(field.id + '-error');
    feedback.textContent = message;
    feedback.hidden = !message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !message;
  };
  const updateSummary = () => {
    if (validationSummaryActive && validationFields.every(field =>
      field.validity.valid && (!field.required || Boolean(field.value.trim())))) {
      error.textContent = '';
      validationSummaryActive = false;
    }
  };
  validationFields.forEach(field => {
    field.addEventListener('blur', () => {
      touched.add(field);
      validateField(field);
      updateSummary();
    });
    const onCorrection = () => {
      if (touched.has(field)) validateField(field);
      updateSummary();
    };
    field.addEventListener('input', onCorrection);
    field.addEventListener('change', onCorrection);
  });
  const clearValidation = () => {
    touched.clear();
    validationSummaryActive = false;
    validationFields.forEach(field => {
      field.removeAttribute('aria-invalid');
      const feedback = document.getElementById(field.id + '-error');
      feedback.textContent = '';
      feedback.hidden = true;
    });
  };
  let pending = false;
  const failure = "We couldn't send your inquiry right now. Please try again or email hello@chimja.com.";
  // One widget exists on this page; hCaptcha defaults reset() to that widget.
  const resetCaptcha = () => {
    try {
      if (typeof window.hcaptcha?.reset !== 'function') return false;
      window.hcaptcha.reset();
      return true;
    } catch { return false; }
  };
  if (configured()) {
    availability.textContent = 'PROJECT INQUIRY';
    button.disabled = false;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    status.textContent = '';
    error.textContent = '';
    validationSummaryActive = false;
    if (!configured()) {
      error.textContent = 'Online inquiries are currently unavailable. Please email hello@chimja.com.';
      return;
    }
    const invalidFields = validationFields.filter(field => {
      touched.add(field);
      return !validateField(field);
    });
    if (invalidFields.length) {
      validationSummaryActive = true;
      error.textContent = 'Please correct the highlighted fields before sending your inquiry.';
      invalidFields[0].focus();
      return;
    }
    // Optional controls retain their native constraints as well.
    if (!form.checkValidity()) {
      error.textContent = 'Please check your entries before sending your inquiry.';
      const invalid = form.querySelector(':invalid');
      invalid?.focus();
      return;
    }
    const data = new FormData(form);
    if (data.get('botcheck')) {
      error.textContent = failure;
      return;
    }
    const token = data.get('h-captcha-response');
    if (typeof token !== 'string' || !token.trim()) {
      error.textContent = 'Please complete the CAPTCHA before sending. If it is unavailable, email hello@chimja.com.';
      return;
    }
    pending = true;
    // Capture values before disabling the fieldset, which excludes controls from FormData.
    fields.disabled = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your inquiry…';
    const controller = new AbortController();
    let timedOut = false;
    let confirmedRejection = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error'
      });
      const result = await response.json();
      confirmedRejection = result?.success === false;
      if (!response.ok || !result || result.success !== true) throw new Error('Unconfirmed inquiry');
      form.reset();
      clearValidation();
      status.textContent = "Thank you for contacting CHIMJA. Your project inquiry has been received. We'll review your requirements and get back to you.";
    } catch {
      status.textContent = '';
      error.textContent = timedOut
        ? 'The request timed out and receipt could not be confirmed. Check before retrying, or email hello@chimja.com.'
        : confirmedRejection
          ? 'Your inquiry was rejected. Please complete the CAPTCHA again and try again, or email hello@chimja.com.'
          : "We couldn't confirm receipt of your inquiry. Please check before submitting again, or email hello@chimja.com.";
    } finally {
      clearTimeout(timer);
      if (!resetCaptcha()) {
        const recovery = ' CAPTCHA could not be refreshed. Copy any entered details before reloading the page, or email hello@chimja.com.';
        error.textContent += recovery;
      }
      fields.disabled = false;
      button.disabled = !configured();
      button.textContent = 'Send inquiry';
      form.removeAttribute('aria-busy');
      pending = false;
    }
  });
})();
