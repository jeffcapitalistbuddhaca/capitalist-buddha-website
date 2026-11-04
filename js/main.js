const STRIPE_PUBLISHABLE = 'pk_live_51UVYmmKLvdoBDUk6JSd85hTepxVDpzTYg9e7P7nutr3pKHzjo5Sd3f8NtaRCwChD5ybqmDIFaYwm8RnJFG7vk9wV00YTCDLGpQ';
const COURSE_PRICE = 199;
const ACCESS_DAYS = 180;
const WORKER_URL = 'https://capitalistbuddha.ca';

let modules = [];
let stripe = null;

// Initialize Stripe
document.addEventListener('DOMContentLoaded', async () => {
    stripe = Stripe(STRIPE_PUBLISHABLE);

    // Handle payment success redirect from Stripe Checkout Session
    const params = new URLSearchParams(window.location.search);
    if (params.has('session_id')) {
        const sessionId = params.get('session_id');
        console.log('Payment returned with session_id:', sessionId);

        // Check session status
        try {
            const response = await fetch(`${WORKER_URL}/api/session-status?session_id=${encodeURIComponent(sessionId)}`);
            const data = await response.json();
            console.log('Session status:', data);

            if (data.status === 'complete') {
                // Payment succeeded, go to account creation
                console.log('Payment complete, redirecting to account setup');
                window.location.href = `/confirmation?session_id=${encodeURIComponent(sessionId)}&email=${encodeURIComponent(data.customer_email || '')}`;
                return;
            } else if (data.status === 'open') {
                // Payment not completed, show error
                console.log('Payment not completed');
                alert('Payment was not completed. Please try again.');
            }
        } catch (err) {
            console.error('Error checking session status:', err);
        }

        // Remove the session_id from URL so we don't keep redirecting
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Tab switching
function activateTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tabEl = document.getElementById(tabName);
    if (tabEl) {
        tabEl.classList.add('active');
    }
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) {
        btn.classList.add('active');
    }
}

// Load modules from JSON
async function loadModulesData() {
    try {
        const response = await fetch('/modules.json');
        modules = await response.json();
        console.log(`Loaded ${modules.length} modules`);
    } catch (error) {
        console.error('Error loading modules:', error);
    }
}

// Payment button - Navigate to checkout page
const payBtn = document.getElementById('pay-button');
if (payBtn) {
    payBtn.addEventListener('click', () => {
        window.location.href = '/checkout';
    });
}

// Contact form - sends the message to Jeff through /api/contact (Brevo)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('contact-status');
        const button = contactForm.querySelector('button[type="submit"]');
        const trap = document.getElementById('contact-website');

        const payload = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-message').value,
            website: trap ? trap.value : ''
        };

        if (button) button.disabled = true;
        status.textContent = 'Sending...';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.ok) {
                status.textContent = 'Thank you! Your message has been sent. We will contact you soon.';
                contactForm.reset();
            } else {
                status.textContent = (data.error || 'Sorry, your message could not be sent.') +
                    ' You can also email jeff@capitalistbuddha.ca directly.';
            }
        } catch (error) {
            console.error('Contact form error:', error);
            status.textContent = 'Sorry, your message could not be sent. You can also email jeff@capitalistbuddha.ca directly.';
        } finally {
            if (button) button.disabled = false;
        }
    });
}

// Login and logout are handled in js/auth.js (Firebase Authentication).

// ---- Protected video addresses ----
// Each video plays from our own site: /api/video/<file name in R2>?token=<Firebase ID token>
function videoUrl(path, token) {
    // Each part of the R2 file name is encoded so names with spaces etc. work unchanged.
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `/api/video/${encodedPath}?token=${encodeURIComponent(token)}`;
}

// One video player. The file name goes in data-video; the address is added later.
function videoBlock(title, path) {
    return `
        <div class="video-container">
            <h4>${title}</h4>
            <video controls preload="none" width="100%" data-video="${path}"></video>
            <p class="video-error" style="display:none;"></p>
        </div>
    `;
}

// Give every video in `container` its protected address.
// ID tokens last one hour. If a video stops loading later, get a fresh
// token once and continue from the same spot.
function attachVideoSources(container, token) {
    container.querySelectorAll('video[data-video]').forEach((video) => {
        const errorText = video.parentElement.querySelector('.video-error');
        video.src = videoUrl(video.dataset.video, token);
        let retried = false;
        video.addEventListener('error', async () => {
            if (retried) {
                if (errorText) {
                    errorText.textContent = 'This video could not be loaded. If you just created your account, click the link in the verification email we sent you, then refresh this page.';
                    errorText.style.display = 'block';
                }
                return;
            }
            retried = true;
            const resumeAt = video.currentTime;
            const freshToken = await window.cbGetIdToken(true);
            if (!freshToken) return;
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = resumeAt;
                retried = false;
                if (errorText) errorText.style.display = 'none';
            }, { once: true });
            video.src = videoUrl(video.dataset.video, freshToken);
            video.play().catch(() => {});
        });
    });
}

// Build the module list. Called by js/auth.js after a successful login.
// Graphic novel panels (stored in R2 next to the videos, behind the login).
// modules.json: "graphic_novel_panels": 6  -> "<video folder>/Panel 1.png" ... "Panel 6.png"
function novelHtml(module) {
    const count = Number(module.graphic_novel_panels) || 0;
    const ref = module.explanation_video || module.meditation_video || '';
    if (!count || !ref.includes('/')) return '';
    const folder = ref.slice(0, ref.lastIndexOf('/'));
    const ext = module.graphic_novel_ext || 'png';
    let imgs = '';
    for (let n = 1; n <= count; n++) {
        const path = `${folder}/Panel ${n}.${ext}`;
        imgs += `<img data-panel="${path}" alt="Module ${module.id} graphic novel, panel ${n} of ${count}" class="module-panel" loading="lazy">`;
    }
    return `<div class="module-novel"><h4>Graphic novel</h4>${imgs}</div>`;
}

// Tap a panel to see it full screen; tap again (or Esc) to close
function openPanel(img) {
    const box = document.createElement('div');
    box.className = 'panel-lightbox';
    box.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    const close = () => { box.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    box.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    document.body.appendChild(box);
}

async function loadModules() {
    const modulesList = document.getElementById('modules-list');
    if (!modulesList) return;

    if (!modules.length) {
        await loadModulesData();
    }

    if (!modules.length) return;

    const token = await window.cbGetIdToken();
    if (!token) return; // nobody is logged in

    modulesList.innerHTML = '';

    for (const module of modules) {
        const moduleEl = document.createElement('div');
        moduleEl.className = 'module-item';

        const header = document.createElement('div');
        header.className = 'module-header';
        header.innerHTML = `<span>Module ${module.id}. ${module.name}</span><span>▼</span>`;

        const content = document.createElement('div');
        content.className = 'module-content';

        let videosHtml = '';
        if (module.explanation_video) {
            videosHtml += videoBlock('Explanation', module.explanation_video);
        }
        if (module.meditation_video) {
            videosHtml += videoBlock('Meditation', module.meditation_video);
        }

        content.innerHTML = `
            <div class="module-text">${(module.text || 'Module content loading...').split(/[\r\n]{2,}/).filter(p => p.trim()).map(p => `<p>${p.trim().replace(/[\r\n]+/g, ' ')}</p>`).join('')}</div>
            ${videosHtml ? `<div class="module-videos">${videosHtml}</div>` : ''}
            ${novelHtml(module)}
        `;

        attachVideoSources(content, token);
        content.querySelectorAll('img[data-panel]').forEach((img) => {
            img.src = videoUrl(img.dataset.panel, token);
            img.addEventListener('click', () => openPanel(img));
        });

        header.addEventListener('click', () => {
            content.classList.toggle('active');
            const arrow = header.querySelector('span:last-child');
            arrow.textContent = content.classList.contains('active') ? '▲' : '▼';
        });

        moduleEl.appendChild(header);
        moduleEl.appendChild(content);
        modulesList.appendChild(moduleEl);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadModulesData();

    // Tab button click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            activateTab(tabName);
        });
    });

    // Check if URL requests specific tab (from account creation redirect)
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab');

    // If tab parameter is set, activate that tab
    if (requestedTab) {
        activateTab(requestedTab);
    }
});

console.log('Capitalist Buddha Course Site - Ready');
