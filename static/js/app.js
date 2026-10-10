/**
 * FestGate split-screen auth controller.
 *
 * - Role switching (Participant / Organizer)
 * - Mode switching (Log in / Sign up)
 * - Password visibility toggle
 * - Testimonial carousel
 * - Form validation + auth requests (email/password and Google via Firebase)
 */

import { auth, googleProvider, signInWithPopup } from './firebase-config.js';

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REDIRECT_DELAY_MS = 400;
const TOAST_DURATION_MS = 4000;
const CAROUSEL_INTERVAL_MS = 6000;
const CAROUSEL_FADE_MS = 180;

const TESTIMONIALS = [
  {
    quote: 'FestGate made entry management effortless during our annual cultural fest. Over 2,500 students checked in smoothly without any gate bottlenecks!',
    name: 'Aarav Sharma',
    role: 'Lead Coordinator, Campus Fest Council',
    initials: 'AS',
  },
  {
    quote: "The instant QR pass and duplicate-email block made our 48-hour hackathon check-in the fastest we've ever conducted.",
    name: 'Tanvi Deshmukh',
    role: 'Hackathon Lead, Tech Club',
    initials: 'TD',
  },
  {
    quote: 'Having every college event under one gate saves our volunteer team hours of manual verification work every semester.',
    name: 'Rahul Verma',
    role: 'Student Council President',
    initials: 'RV',
  },
];

// All text that changes between Log in / Sign up lives here, not in the logic.
const FORM_COPY = {
  login: {
    prompt: "Don't have an account?",
    switchLabel: 'Sign up',
    divider: 'Or log in with email',
    submit: 'Log in',
    legal: 'By logging in, you agree to our Terms of Service and Privacy Policy',
    roles: {
      participant: {
        title: 'Log in to FestGate',
        subtitle: 'Log in to get your event pass',
        emailLabel: 'Email address',
        placeholder: 'you@college.edu',
      },
      organizer: {
        title: 'Log in to FestGate',
        subtitle: 'Log in to manage your campus events',
        emailLabel: 'Email address',
        placeholder: 'you@college.edu',
      },
    },
  },
  signup: {
    prompt: 'Already have an account?',
    switchLabel: 'Log in',
    divider: 'Or sign up with email',
    submit: 'Create Account',
    legal: 'By creating your account, you agree to our Terms of Service and Privacy Policy',
    roles: {
      participant: {
        title: 'Join FestGate',
        subtitle: 'Create your attendee account to get instant event passes',
        emailLabel: 'Student Email',
        placeholder: 'alex@college.edu',
      },
      organizer: {
        title: 'Create Organizer Account',
        subtitle: 'Set up your club or committee profile to host campus events',
        emailLabel: 'Official / Club Email',
        placeholder: 'club.lead@college.edu',
      },
    },
  },
};

/* ==========================================================================
   SHARED HELPERS
   ========================================================================== */

const byId = (id) => document.getElementById(id);

export function showToast(message, type = 'success') {
  const container = byId('toastContainer');
  if (!container) return;

  const icon = document.createElement('span');
  icon.textContent = type === 'success' ? '✓' : '⚠️';
  const text = document.createElement('span');
  text.textContent = message; // textContent: server messages can't inject HTML

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.append(icon, text);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.cssText += 'opacity:0;transform:translateY(10px);transition:all 0.3s ease;';
    setTimeout(() => toast.remove(), 300);
  }, TOAST_DURATION_MS);
}
window.showToast = showToast;

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function redirectAfterSuccess(data) {
  if (data.redirect_url) {
    setTimeout(() => { window.location.href = data.redirect_url; }, REDIRECT_DELAY_MS);
  }
}

const setDisplay = (el, value) => { if (el) el.style.display = value; };

/* ==========================================================================
   MAIN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Elements ---------- */
  const el = {
    form: byId('authForm'),
    topPrompt: byId('topPromptText'),
    topSwitchBtn: byId('topSwitchBtn'),
    title: byId('formTitle'),
    subtitle: byId('formSubtitle'),
    divider: byId('dividerLabel'),
    emailLabel: byId('emailLabel'),
    legal: byId('legalText'),
    submitBtn: byId('submitBtn'),
    submitLabel: byId('submitBtnLabel'),
    googleBtn: byId('googleSignInBtn'),
    forgotLink: byId('forgotPassLink'),
    nameGroup: byId('nameGroup'),
    clubGroup: byId('clubGroup'),
    confirmGroup: byId('confirmPasswordGroup'),
    pwdToggleBtn: byId('pwdToggleBtn'),
    eyeShow: document.querySelector('.eye-show'),
    eyeHide: document.querySelector('.eye-hide'),
    tabs: { participant: byId('tabParticipant'), organizer: byId('tabOrganizer') },
  };

  // Each field = its input + its error message span.
  const fields = {
    name: { input: byId('fullName'), error: byId('nameError') },
    club: { input: byId('clubName'), error: byId('clubError') },
    email: { input: byId('email'), error: byId('emailError') },
    password: { input: byId('password'), error: byId('passwordError') },
    confirmPassword: { input: byId('confirmPassword'), error: byId('confirmPasswordError') },
  };

  const state = { mode: 'login', role: 'participant' };

  /* ---------- Field errors ---------- */
  function showFieldError(fieldName, message) {
    const field = fields[fieldName];
    if (!field) return false;
    if (field.error) field.error.textContent = message;
    field.input?.classList.add('is-invalid');
    return true;
  }

  function clearErrors() {
    Object.values(fields).forEach(({ error }) => { if (error) error.textContent = ''; });
    document.querySelectorAll('.form-input').forEach((input) => input.classList.remove('is-invalid'));
  }

  /* ---------- 1. Form view (mode + role) ---------- */
  function updateFormView() {
    clearErrors();

    const isSignup = state.mode === 'signup';
    const copy = FORM_COPY[state.mode];
    const roleCopy = copy.roles[state.role];

    el.topPrompt.textContent = copy.prompt;
    el.topSwitchBtn.textContent = copy.switchLabel;
    el.divider.textContent = copy.divider;
    el.submitLabel.textContent = copy.submit;
    el.legal.textContent = copy.legal;
    el.title.textContent = roleCopy.title;
    el.subtitle.textContent = roleCopy.subtitle;
    el.emailLabel.textContent = roleCopy.emailLabel;
    fields.email.input.placeholder = roleCopy.placeholder;

    setDisplay(el.nameGroup, isSignup ? 'flex' : 'none');
    setDisplay(el.confirmGroup, isSignup ? 'flex' : 'none');
    setDisplay(el.forgotLink, isSignup ? 'none' : 'inline');
    setDisplay(el.clubGroup, 'none'); // club details are collected later, in profile completion

    fields.name.input.required = isSignup;
    if (fields.confirmPassword.input) fields.confirmPassword.input.required = isSignup;
    if (fields.club.input) fields.club.input.required = false;
  }

  el.topSwitchBtn.addEventListener('click', () => {
    state.mode = state.mode === 'login' ? 'signup' : 'login';
    updateFormView();
  });

  /* ---------- 2. Role tabs ---------- */
  const TAB_LABELS = { participant: 'Participant', organizer: 'Organizer' };

  function setActiveRole(role) {
    state.role = role;

    Object.entries(el.tabs).forEach(([tabRole, tab]) => {
      const isActive = tabRole === role;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.innerHTML = isActive
        ? `${TAB_LABELS[tabRole]} <span class="active-indicator"></span>`
        : TAB_LABELS[tabRole];
    });

    updateFormView();
  }

  el.tabs.participant.addEventListener('click', () => setActiveRole('participant'));
  el.tabs.organizer.addEventListener('click', () => setActiveRole('organizer'));

  /* ---------- 3. Password visibility ---------- */
  el.pwdToggleBtn.addEventListener('click', () => {
    const passwordInput = fields.password.input;
    const willShow = passwordInput.type === 'password';

    passwordInput.type = willShow ? 'text' : 'password';
    setDisplay(el.eyeShow, willShow ? 'none' : 'inline');
    setDisplay(el.eyeHide, willShow ? 'inline' : 'none');
  });

  /* ---------- 4. Google sign-in (Firebase) ---------- */
  el.googleBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    clearErrors();

    el.googleBtn.disabled = true;
    el.googleBtn.style.opacity = '0.7';

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const { ok, data } = await postJson('/api/auth/google', {
        id_token: idToken,
        role: state.role,
      });

      if (!ok) {
        showToast(data.message || 'Google sign-in failed.', 'error');
        return;
      }
      showToast(data.message || 'Signed in successfully!', 'success');
      redirectAfterSuccess(data);
    } catch (err) {
      console.error('Google sign-in error:', err);
      showToast(err.message || 'Google sign-in was canceled or failed.', 'error');
    } finally {
      el.googleBtn.disabled = false;
      el.googleBtn.style.opacity = '1';
    }
  });

  /* ---------- 5. Testimonial carousel ---------- */
  const quote = {
    text: byId('quoteText'),
    avatar: byId('authorAvatarInitials'),
    name: byId('authorName'),
    role: byId('authorRole'),
    dots: document.querySelectorAll('.dot-btn'),
    card: byId('testimonialCard'),
  };

  let currentSlide = 0;
  let autoplayTimer = null;

  function showSlide(index) {
    currentSlide = index;
    const slide = TESTIMONIALS[index];

    quote.text.style.opacity = '0';
    quote.text.style.transform = 'translateY(6px)';

    setTimeout(() => {
      quote.text.textContent = `"${slide.quote}"`;
      quote.name.textContent = slide.name;
      quote.role.textContent = slide.role;
      if (quote.avatar) quote.avatar.textContent = slide.initials;

      quote.text.style.opacity = '1';
      quote.text.style.transform = 'translateY(0)';
    }, CAROUSEL_FADE_MS);

    quote.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(
      () => showSlide((currentSlide + 1) % TESTIMONIALS.length),
      CAROUSEL_INTERVAL_MS,
    );
  }

  quote.dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.index));
      startAutoplay();
    });
  });

  quote.card?.addEventListener('mouseenter', stopAutoplay);
  quote.card?.addEventListener('mouseleave', startAutoplay);
  startAutoplay();

  /* ---------- 6. Validation & submit ---------- */
  /** Returns a list of { field, message } problems (empty list = valid). */
  function validate({ name, email, password, confirmPassword }) {
    const problems = [];

    if (state.mode === 'signup') {
      if (!name) {
        problems.push({ field: 'name', message: 'Please enter your full name.' });
      }
      if (!confirmPassword) {
        problems.push({ field: 'confirmPassword', message: 'Please confirm your password.' });
      } else if (password !== confirmPassword) {
        problems.push({ field: 'confirmPassword', message: 'Passwords do not match.' });
      }
    }

    if (!email) {
      problems.push({ field: 'email', message: 'Please enter your email.' });
    } else if (!EMAIL_PATTERN.test(email)) {
      problems.push({ field: 'email', message: 'Please enter a valid email address.' });
    }

    if (!password) {
      problems.push({ field: 'password', message: 'Please enter your password.' });
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      problems.push({
        field: 'password',
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    return problems;
  }

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const values = {
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      password: fields.password.input.value,
      confirmPassword: fields.confirmPassword.input?.value ?? '',
    };

    const problems = validate(values);
    if (problems.length) {
      problems.forEach(({ field, message }) => showFieldError(field, message));
      return;
    }

    el.submitBtn.classList.add('is-loading');
    el.submitBtn.disabled = true;

    try {
      const isSignup = state.mode === 'signup';
      const payload = { email: values.email, password: values.password, role: state.role };
      if (isSignup) {
        payload.full_name = values.name;
        payload.confirm_password = values.confirmPassword;
      }

      const { ok, data } = await postJson(
        isSignup ? '/api/auth/signup' : '/api/auth/login',
        payload,
      );

      if (!ok) {
        // Show the error under the right field if the server says which one.
        const shown = showFieldError(data.field, data.message);
        if (!shown) showToast(data.message || 'Authentication error', 'error');
        return;
      }

      showToast(data.message || 'Success!', 'success');
      redirectAfterSuccess(data);
    } catch (err) {
      console.error('Auth submit error:', err);
      showToast('Network error while connecting to server.', 'error');
    } finally {
      el.submitBtn.classList.remove('is-loading');
      el.submitBtn.disabled = false;
    }
  });

  /* ---------- Initial render ---------- */
  updateFormView();
});
