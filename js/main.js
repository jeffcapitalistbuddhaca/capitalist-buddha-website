const STRIPE_PUBLISHABLE = 'pk_test_51UVYmmKLvdoBDUk6kEmkKFKv5znaZoWM4WXBB4kyGInGQoj4aYgeUsOYEXqgApfbWF7W9KizCqgEZxKKfNM34tZF00TJ1Mtwve';
const COURSE_PRICE = 199;
const ACCESS_DAYS = 180;
const WORKER_URL = 'https://capitalistbuddha.ca';

let modules = [];
let currentUser = null;
let stripe = null;
let elements = null;
let paymentElement = null;

// Initialize Stripe
document.addEventListener('DOMContentLoaded', () => {
    stripe = Stripe(STRIPE_PUBLISHABLE);
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        btn.classList.add('active');
    });
});

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

// Payment button - Redirect to Stripe Checkout (simplest, most reliable)
const payBtn = document.getElementById('pay-button');
if (payBtn) {
    payBtn.addEventListener('click', async () => {
        try {
            const email = prompt('Enter your email address:');
            if (!email) return;

            const password = prompt('Create a password:');
            if (!password) return;

            // Create checkout session
            const response = await fetch(`${WORKER_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to start payment. Please try again.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred. Please try again.');
        }
    });
}

// Contact form
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;

        try {
            // For now, just show a message. In production, create a Worker endpoint
            document.getElementById('contact-status').textContent = 'Thank you! We will contact you soon.';
            contactForm.reset();
            setTimeout(() => {
                document.getElementById('contact-status').textContent = '';
            }, 5000);
        } catch (error) {
            console.error('Contact form error:', error);
            document.getElementById('contact-status').textContent = 'Error sending message.';
        }
    });
}

// Login form - Call Worker to authenticate
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            // Call Worker to verify credentials and check expiration
            const response = await fetch(`${WORKER_URL}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                currentUser = { email, ...data };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                document.getElementById('login-form-container').style.display = 'none';
                document.getElementById('course-overview').style.display = 'block';
                await loadModules();
            } else {
                alert(data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred. Please try again.');
        }
    });
}

// Load modules with R2 signed URLs
async function loadModules() {
    const modulesList = document.getElementById('modules-list');
    if (!modulesList) return;

    if (!modules.length) {
        await loadModulesData();
    }

    if (!modules.length) return;

    modulesList.innerHTML = '';

    for (const module of modules) {
        const moduleEl = document.createElement('div');
        moduleEl.className = 'module-item';

        const header = document.createElement('div');
        header.className = 'module-header';
        header.innerHTML = `<span>Module ${module.id}. ${module.name}</span><span>▼</span>`;

        const content = document.createElement('div');
        content.className = 'module-content';

        // Get signed URLs from Worker
        let signedUrls = {};
        try {
            const videoPaths = [];
            if (module.meditation_video) videoPaths.push(module.meditation_video);
            if (module.explanation_video) videoPaths.push(module.explanation_video);

            if (videoPaths.length) {
                const urlResponse = await fetch(`${WORKER_URL}/api/get-signed-urls`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: currentUser.email,
                        videoPaths
                    })
                });

                const urlData = await urlResponse.json();
                if (urlData.success) {
                    urlData.signedUrls.forEach(item => {
                        signedUrls[item.path] = item.url;
                    });
                }
            }
        } catch (error) {
            console.error('Error getting signed URLs:', error);
        }

        let videosHtml = '';
        if (module.explanation_video) {
            const url = signedUrls[module.explanation_video] || '';
            const type = module.explanation_video.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
            videosHtml += `
                <div class="video-container">
                    <h4>Explanation</h4>
                    <video controls preload="metadata" width="100%">
                        <source src="${url}" type="${type}">
                        Your browser does not support this video format.
                    </video>
                </div>
            `;
        }
        if (module.meditation_video) {
            const url = signedUrls[module.meditation_video] || '';
            const type = module.meditation_video.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
            videosHtml += `
                <div class="video-container">
                    <h4>Meditation</h4>
                    <video controls preload="metadata" width="100%">
                        <source src="${url}" type="${type}">
                        Your browser does not support this video format.
                    </video>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="module-text">${(module.text || 'Module content loading...').split(/[\r\n]{2,}/).filter(p => p.trim()).map(p => `<p>${p.trim().replace(/[\r\n]+/g, ' ')}</p>`).join('')}</div>
            ${videosHtml ? `<div class="module-videos">${videosHtml}</div>` : ''}
        `;

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
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        const loginContainer = document.getElementById('login-form-container');
        const courseOverview = document.getElementById('course-overview');
        if (loginContainer && courseOverview) {
            loginContainer.style.display = 'none';
            courseOverview.style.display = 'block';
            loadModules();
        }
    }
});

console.log('Capitalist Buddha Course Site - Ready');
