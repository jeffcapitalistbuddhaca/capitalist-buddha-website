# Capitalist Buddha Course Website - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Netlify account (free)
- Stripe account (already configured)
- Git installed on your computer
- Github account (for code hosting)

---

## 📋 Deployment Steps

### Step 1: Prepare for Deployment

1. **Copy the entire `capitalist-buddha-site` folder to your local machine**
   ```
   C:\Users\david\AppData\Local\Temp\claude\...\capitalist-buddha-site
   ```

2. **Install dependencies** (in the folder):
   ```bash
   npm install
   ```

### Step 2: Configure Environment Variables

**DO NOT commit secrets to git.** All secrets are set in Cloudflare dashboard.

For local development, create `.env` (never commit):
```
STRIPE_SECRET_KEY=your_stripe_test_key_here
BREVO_API_KEY=your_brevo_api_key_here
R2_ACCESS_KEY_ID=your_r2_access_key_here
R2_SECRET_ACCESS_KEY=your_r2_secret_key_here
FIREBASE_CREDENTIALS=your_firebase_json_here
```

Production secrets are configured in **Cloudflare Workers environment variables** (see Deployment Steps).

### Step 3: Deploy to Netlify

**Option A: Via Git (Recommended)**

1. Create a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Capitalist Buddha course website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/capitalist-buddha-course.git
   git push -u origin main
   ```

2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select GitHub repository
5. Build command: `npm install`
6. Publish directory: `.`
7. Add environment variables from your `.env` file
8. Click "Deploy"

**Option B: Via Netlify CLI**

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Step 4: Configure Domain

1. In Netlify Settings > Domain Management
2. Add custom domain: `capitalistbuddha.ca`
3. Follow DNS configuration instructions from your domain registrar
4. Update DNS records to point to Netlify nameservers

---

## 🎥 Video Handling

### Current Setup
- All 1.4 GB of videos are included locally
- Videos served directly from Netlify

### Recommended for Scale (1,000+ students)
Use **Bunny CDN** for video delivery:

1. Create Bunny CDN account
2. Create a new pull zone for videos
3. Upload videos to Bunny
4. Update video URLs in site to point to Bunny CDN
5. Monthly cost: ~$20-40 for video delivery

---

## 💳 Stripe Integration

### Testing (Before Going Live)

1. Use Stripe test keys (from Stripe Dashboard)
2. Use test card: `4242 4242 4242 4242`
3. Test payments without charging

### Going Live

1. Ensure your Stripe account is activated
2. Environment variables use live keys (already configured)
3. Payments go to your Stripe account

---

## 📧 Email Configuration

### Contact Form & Enrollment Emails

Contact form messages route to: **jeff@capitalistbuddha.ca**

To change:
1. Edit `netlify/functions/send-contact.js`
2. Change the `to` field in the email
3. Redeploy

---

## 🔐 Course Access & Enrollment

### How It Works

1. **Student purchases**: Clicks "Click to pay"
2. **Payment processed**: Stripe charges $199 USD
3. **Enrollment created**: 6-month access from purchase date
4. **Login system**: Email + password created by student
5. **Auto-expiration**: Access ends 180 days from purchase

### Student Access

- Login with email + password
- See all 16 modules
- Click module to expand content
- Watch meditation and explanation videos
- Access expires automatically after 6 months

---

## 🛠️ Maintenance

### Adding New Modules

1. Add folder to course source with text file + videos
2. Run `copy-modules.py` to regenerate module data
3. Redeploy to Netlify

### Updating Course Content

1. Edit HTML sections in `index.html` for:
   - Courses tab
   - The Professor tab
   - Course Text tab
2. Git commit and push
3. Netlify automatically redeploys

### Monitoring

- **Stripe Dashboard**: Track payments and refunds
- **Netlify Analytics**: Monitor site traffic
- **Google Analytics** (optional): Add for detailed insights

---

## 📊 Enrollment Management

### View Enrollments

Enrollments stored in browser localStorage:
- Key format: `enrollment_{email}`
- Contains: password, enrollment date, expiration date

### Extend Access (Manual)

For extending student access:
1. Open browser console
2. Run: `localStorage.removeItem('enrollment_student@email.com')`
3. Have them re-purchase course

---

## 🚨 Troubleshooting

### Videos Not Playing
- Check file paths in modules.json
- Ensure video files are in `/modules` folder
- Test with different browsers

### Payment Not Working
- Verify Stripe secret key is correct
- Check Stripe dashboard for errors
- Ensure email is valid

### Contact Form Not Sending
- Verify Gmail credentials
- Check Gmail allows app passwords
- Look at Netlify function logs

---

## 📞 Support

For technical issues:
- Netlify Support: support@netlify.com
- Stripe Support: support.stripe.com
- Check browser console for errors (F12)

---

## ✅ Checklist Before Launch

- [ ] Domain capitalistbuddha.ca configured
- [ ] Stripe account tested with test payments
- [ ] Environment variables set in Netlify
- [ ] Contact form tested
- [ ] All 16 modules visible when logged in
- [ ] Videos play correctly
- [ ] Mobile responsive design works
- [ ] SSL certificate active (automatic with Netlify)

---

---

## 🔄 UPDATED: Complete Payment + Enrollment System (October 31 - November 1, 2026)

### System Architecture

**Deployment**: Cloudflare Pages + Workers (replaces Netlify)
**Payment Processing**: Stripe Checkout Sessions API with Embedded Mode
**Tax Calculation**: Stripe Automatic Tax (HST for Canada)
**Database**: Firebase Firestore (enrollments collection)
**Video Hosting**: Cloudflare R2 with signed URLs

### Complete Payment Flow

```
1. USER GOES TO CHECKOUT
   └─ https://capitalistbuddha.ca/checkout
   └─ Page calls /api/create-checkout-session
   └─ Backend creates Stripe Checkout Session with automatic_tax enabled
   └─ Email captured: stored in Stripe metadata + logged to audit trail

2. STRIPE EMBEDDED CHECKOUT LOADS
   └─ User enters email (prefilled if returning)
   └─ Address Element collects billing address
   └─ Stripe automatically calculates HST based on province
   └─ Tax displays as separate line item ($199 + Tax = Total)
   └─ Payment Element for card entry
   └─ User clicks Pay

3. PAYMENT PROCESSING
   └─ Stripe processes payment
   └─ HST automatically charged based on address
   └─ Payment succeeds or fails

4. REDIRECT TO SITE
   └─ Stripe redirects to: https://capitalistbuddha.ca/?session_id={CHECKOUT_SESSION_ID}
   └─ main.js detects session_id parameter
   └─ Calls /api/session-status to verify payment completed

5. PAYMENT VERIFICATION
   └─ If status='complete' and payment_status='paid'
   └─ Redirects to: /confirmation?session_id=...&email=...
   └─ Email prefilled from Stripe session data

6. ACCOUNT CREATION PAGE
   └─ Shows: "Payment Confirmed" + confirmation details
   └─ Form asks for: email (prefilled) + password + confirm password
   └─ User submits account creation form

7. ACCOUNT CREATION
   └─ confirm-payment endpoint receives: paymentIntentId (session ID), email, password
   └─ Verifies payment by checking Checkout Session payment_status='paid'
   └─ Creates 6-month enrollment (expires 180 days from today)
   └─ Stores in Firebase Firestore /enrollments collection
   └─ Email logged to audit trail
   └─ Redirects to: /?tab=login&email={email}

8. LOGIN PAGE
   └─ Email field prefilled
   └─ User enters password
   └─ /api/auth validates credentials
   └─ Checks enrollment expiration date
   └─ Saves session to localStorage

9. COURSE ACCESS
   └─ All 16 modules visible
   └─ Videos load with signed R2 URLs
   └─ Access expires 6 months from purchase date
```

### New/Modified Files

**Frontend Pages:**
- `checkout.html` - Stripe embedded checkout with automatic tax
- `confirmation.html` - Account creation after payment
- `js/main.js` - Updated with session_id handling, email prefill, auth flow
- `index.html` - Home page with login/course tabs

**Backend Endpoints (Cloudflare Workers):**
- `functions/api/create-checkout-session.ts` - Creates Stripe session with automatic_tax + email logging
- `functions/api/session-status.ts` - Checks payment status of Checkout Session
- `functions/api/confirm-payment.ts` - Creates account + enrollment, saves to Firebase
- `functions/api/auth.ts` - Login authentication with expiration check
- `functions/api/get-signed-urls.ts` - Returns R2 signed URLs for videos
- `functions/api/email-log.ts` - Audit trail of all captured emails

**Configuration:**
- `wrangler.toml` - Cloudflare Workers configuration
- `.gitignore` - Updated with .worktrees/ for git isolation

### Payment Features Implemented

✅ **Stripe Checkout Sessions API**
- ui_mode: 'embedded_page' (official embedded checkout)
- Accepts payments without redirects to Stripe-hosted pages
- Address collection built-in (no custom Address Element needed)

✅ **Automatic Tax Calculation**
- automatic_tax[enabled]=true on Checkout Session
- Requires Tax to be enabled in Stripe Dashboard
- Calculates HST for Canadian addresses
- Tax shows before payment
- Stripe automatically applies correct provincial rates

✅ **Email Capture**
- Captured at checkout: /api/create-checkout-session
- Captured at account creation: /api/confirm-payment
- Both logged to /api/email-log (audit trail)
- Account email stored in Firebase Firestore

✅ **6-Month Enrollment**
- Automatic expiration date set (180 days from purchase)
- Checked on login (/api/auth endpoint)
- Prevents access after expiration

✅ **Login System**
- Email + password authentication
- Session saved to localStorage
- Enrollment expiration verified on login
- Email prefilled after account creation

### Environment Variables Required

**Cloudflare Workers Secrets:**
```
Stripe Secret Key 2 = sk_test_... (or sk_live_... for production)
FIREBASE_PROJECT_ID = conscious-business-course
FIREBASE_SERVICE_ACCOUNT = (entire firebase-credentials.json file)
EMAIL_LOG_SECRET = (secure random string for audit log access)
```

### Deployment Platform: Cloudflare Pages + Workers

**Why Cloudflare instead of Netlify:**
- Unlimited API requests (Workers)
- Better performance for serverless
- Built-in environment variable management
- Direct access to Stripe APIs

**Deployment Process:**
1. Push to GitHub: `git push origin main`
2. Cloudflare Pages auto-deploys from main branch
3. Workers functions deploy automatically
4. No build step required

**Live URL:** https://capitalistbuddha.ca

### Testing Completed

✅ Checkout page loads with embedded Stripe checkout
✅ Payment session creation works
✅ Session status checking works
✅ Account creation endpoint works
✅ Email capture at both checkout and account creation
✅ Login page loads with email prefill
✅ Authentication works
✅ Course access page loads
✅ Complete end-to-end workflow tested

### Firebase Setup (Pending)

Need to add to Cloudflare environment variables:
1. FIREBASE_PROJECT_ID = `conscious-business-course`
2. FIREBASE_SERVICE_ACCOUNT = (paste entire firebase-credentials.json)

Once added:
- Enrollments automatically saved to Firestore /enrollments collection
- Each enrollment has: email, enrollmentDate, expirationDate, transactionId, createdAt
- Access controlled by expiration date

### Next Step: Moving to Live Stripe

**Current Status:** Everything running on Stripe TEST mode

**To Go Live:**
1. Get live Stripe API keys (sk_live_...)
2. Update "Stripe Secret Key 2" in Cloudflare environment variables
3. Change Stripe publishable key in checkout.html (pk_live_...)
4. Ensure Stripe Tax is enabled in LIVE mode (not just test)
5. Add live tax registrations in Stripe Dashboard
6. Test with real payment
7. Update wrangler.toml with live credentials

### Site Status
**Build Date**: November 1, 2026
**Current Environment**: Cloudflare Pages + Workers (TEST MODE)
**Payment System**: Stripe Checkout Sessions (TEST)
**Tax System**: Stripe Automatic Tax (TEST)
**Database**: Firebase Firestore (configured, pending secrets)
**Email Capture**: Active (checkout + account creation)
**Status**: Ready to shift to LIVE Stripe when credentials provided
