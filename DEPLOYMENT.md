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

**Site Status**: Ready for deployment
**Build Date**: October 28, 2026
**Total Modules**: 16
**Video Files**: 44 (meditation + explanation versions)
**Storage Required**: ~1.4 GB locally (recommend CDN for production)
