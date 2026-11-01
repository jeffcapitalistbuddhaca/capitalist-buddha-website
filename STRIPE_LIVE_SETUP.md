# Stripe Live Setup Guide for Capitalist Buddha

**Reference**: Official Stripe documentation (Nov 1, 2026) provided by Claude

---

## Part A: Switch to Live Mode

### A1. ☐ Recreate course product and price in live mode

**Current Sandbox Product:**
- Name: Capitalist Buddha Course
- Price: $199.00 CAD
- Type: One-off (not recurring)
- Tax Code: Educational Services
- Tax Behavior: Exclusive (tax added on top)

**Steps:**
1. Go to Stripe Dashboard → Switch to LIVE mode
2. Create product:
   - Name: `Capitalist Buddha Course`
   - Type: Standard
3. Add price:
   - Amount: 199.00 CAD
   - Tax behavior: Exclusive
   - Tax code: Educational Services (same as sandbox)
4. **COPY the live price ID** (starts with `price_live_...`)
   - This is different from sandbox price ID
   - Save it for step A6

**⚠️ Critical**: Tax behavior cannot be changed after setting. Must be "Exclusive" to match sandbox behavior.

---

### A2. ☐ Set up Stripe Tax in live mode

Sandbox tax settings are separate from live settings. Must recreate in live.

**Steps:**
1. Stripe Dashboard → LIVE mode
2. Settings → Tax
3. Verify/set these values (same as sandbox):
   - **Origin Address**: Ontario (where business is located)
   - **Preset product tax code**: Educational Services
   - **Default tax behavior**: Automatic (USD/CAD = Exclusive)
   - **Shipping taxes**: Determine automatically
   - **Include tax in prices**: No (prices exclude tax)

4. Go to **Tax → Registrations**
5. Add registration:
   - **Authority**: CRA (Canada Revenue Agency)
   - **Registration Type**: GST/HST (normal regime)
   - **Registration ID**: (your GST/HST number from CRA)
   - **Countries/Regions**: Canada

**⚠️ Critical**: Without a live registration, Stripe will NOT calculate tax on live payments. Tax will show as $0.

---

### A3. ☐ Turn on customer receipts

**Steps:**
1. Stripe Dashboard → LIVE mode
2. Settings → Emails
3. Find "Customer emails"
4. Toggle ON: **Successful payments**

**Result**: Customers will receive email receipts after successful payment (not before, not on failed payments).

---

### A4. ☐ Create live webhook endpoint

**For our Cloudflare setup**, the webhook already exists in the code.

**Steps:**
1. Stripe Dashboard → LIVE mode
2. Workbench → Webhooks
3. Add destination:
   - **Endpoint URL**: `https://capitalistbuddha.ca/api/webhook` (same URL as sandbox)
   - **Events to listen for**: 
     - `checkout.session.completed` (required for order fulfillment)
     - `customer.subscription.updated` (if using subscriptions)
   - **API version**: (use default)
4. Click "Create destination"
5. **COPY the signing secret** (starts with `whsec_live_...`)
   - Different from sandbox secret
   - Save for step A6

---

### A5. ☐ Apple Pay / Google Pay

**Current setup**: Not implemented yet.

**Skip this step** (unless we add one-click wallets in future).

---

### A6. ☐ Swap the keys on the server

**Update Cloudflare environment variables:**

| Setting | Current (Sandbox) | Change To (Live) |
|---------|-------------------|------------------|
| **STRIPE_SECRET_KEY** | `sk_test_...` | `sk_live_...` (from Stripe Dashboard) |
| **STRIPE_PUBLISHABLE_KEY** | `pk_test_...` | `pk_live_...` (from Stripe Dashboard) |
| **COURSE_PRICE_ID** | `price_1UVYmm...` (sandbox) | `price_live_...` (from step A1) |
| **WEBHOOK_SIGNING_SECRET** | `whsec_test_...` | `whsec_live_...` (from step A4) |

**Steps:**
1. Go to Stripe Dashboard → LIVE mode
2. Developers → API keys
3. Copy **Publishable key** (pk_live_...)
4. Copy **Secret key** (sk_live_...)
   - Click "Reveal test data" if needed
   - Only shown once if you create a new key
   - Save immediately

5. Go to Cloudflare Dashboard
6. Workers & Pages → Capitalist Buddha
7. Settings → Variables → Secrets
8. Update all four values above

**⚠️ Do NOT mix test and live values**. All four must be live, or payments will fail.

---

### A7. ☐ Security before going public

**Steps:**
1. ☐ In Stripe Dashboard → API keys → Rotate keys
   - Old and new keys work for 7 days
   - After rotation, only use the new key
2. ☐ Verify no API keys are hard-coded in:
   - `checkout.html` (only has publishable key, OK)
   - `confirmation.html` (only has publishable key, OK)
   - Backend code uses environment variables ✓
3. ☐ Check logs don't store sensitive data (card numbers, etc.)
   - Cloudflare Workers logs don't store card data ✓
4. ☐ Redeploy site after key updates

---

## Part B: Verify Live with $1.00 Purchase

### B1. ☐ Create $1.00 test product in live mode

**Why**: Real payment tests the complete flow without spending $199.

**Steps:**
1. Stripe Dashboard → LIVE mode
2. Products → Create product
   - Name: `Live Test - $1`
   - Type: Standard
3. Add price:
   - Amount: **1.00 CAD** (minimum is $0.50)
   - Tax behavior: **Exclusive** (same as course)
   - Tax code: **Educational Services** (same as course)
4. **COPY the test price ID** (price_live_...)
   - Save temporarily for step B2

---

### B2. ☐ Point checkout at test price

**Temporary change:**
1. Go to Cloudflare
2. Workers & Pages → Capitalist Buddha
3. Settings → Variables
4. Temporarily change **COURSE_PRICE_ID** to the $1 test price ID
5. Redeploy

**Or**: Modify `functions/api/create-checkout-session.ts` to use test price temporarily.

---

### B3. ☐ Buy it with a real card

**Test purchase:**
1. Go to `https://capitalistbuddha.ca/checkout`
2. Enter test email: (use an email you can check)
3. Select **Ontario** address (to test HST calculation)
4. Enter real credit card
5. Complete payment

**Expected result:**
- Subtotal: $1.00 CAD
- Tax (HST): $0.13 CAD (13% of $1.00)
- Total: $1.13 CAD

---

### B4. ☐ Check these five things

**1. Payment succeeded in Stripe Dashboard**
- Stripe Dashboard → LIVE mode
- Payments → Charges
- Should see your $1.13 charge

**2. Tax was calculated correctly**
- Click the charge
- Scroll to "Automatic tax calculation" section
- Should show:
  - Tax amount: $0.13
  - Tax breakdown: HST 13%
  - Taxability: Tax charged (Ontario address)

**3. Receipt email arrived**
- Check email you entered at checkout
- Should have receipt from Stripe
- Shows $1.00 + $0.13 HST = $1.13

**4. Webhook delivered**
- Stripe Dashboard → Workbench → Webhooks
- Select live endpoint
- Should see `checkout.session.completed` event
- Status: **200** (means server accepted it)

**5. Return page showed success**
- After payment, should see:
  - "Payment Confirmed" page
  - Account creation form
  - Email prefilled

---

### B5. ☐ Switch back to real course

**After verification:**
1. Cloudflare → Change **COURSE_PRICE_ID** back to real course price
2. Redeploy

**In Stripe Dashboard:**
1. Products → Find "Live Test - $1"
2. Archive it (so customers can't accidentally buy it)

---

### B6. ☐ Refund or keep the $1.13

**Your choice:**
- **Keep it**: It's a real sale. $0.13 HST must be reported to CRA.
- **Refund it**: Stripe doesn't charge to refund. No processing fee is returned, so refunding $1.13 costs you $0.13 in fees.

---

## Checklist: Ready for Live

**A: Switch to Live**
- [ ] A1: Recreated course product and price in live mode (have price ID)
- [ ] A2: Set up Stripe Tax in live mode with registration
- [ ] A3: Turned on customer receipts
- [ ] A4: Created live webhook endpoint (have signing secret)
- [ ] A6: Updated all keys in Cloudflare (all four values live)
- [ ] A7: Rotated keys and redeployed

**B: Verify with $1 Purchase**
- [ ] B1: Created $1 test product in live mode
- [ ] B2: Pointed checkout at test price and redeployed
- [ ] B3: Made test purchase with real card
- [ ] B4a: Payment appears in Stripe Payments
- [ ] B4b: Tax calculated correctly ($0.13)
- [ ] B4c: Receipt email received
- [ ] B4d: Webhook delivered (status 200)
- [ ] B4e: Return page showed success
- [ ] B5: Switched back to real course price
- [ ] B5: Archived $1 test product

**Final**
- [ ] All environment variables are live keys/IDs
- [ ] No test values mixed with live values
- [ ] Site redeployed after all changes
- [ ] Ready to accept real customer payments

---

## Important Notes

**Test vs Live Objects**
- Sandbox products/prices cannot be used in live mode
- Sandbox webhooks cannot be used in live mode
- Must recreate everything in live with same settings

**Tax Critical**
- Without active Stripe Tax registration, live payments show $0 tax
- Must add GST/HST registration to Stripe Tax in live mode
- Tax behavior (exclusive/inclusive) cannot be changed after price creation

**Keys Critical**
- Never mix test (sk_test_, pk_test_) with live (sk_live_, pk_live_) keys
- All four values must be live, or first payment will fail
- Keep keys in environment variables, never hard-code

**Webhook Critical**
- Each endpoint has its own signing secret
- Live endpoint secret ≠ sandbox endpoint secret
- Must update both in code

---

## Next Steps

1. ✅ Have Stripe credentials ready:
   - Live secret key
   - Live publishable key
   - Live course price ID
   - Live webhook signing secret

2. Follow checklist A (Switch to Live) above

3. Follow checklist B (Verify with $1 Purchase) above

4. Once B4 all checks pass:
   - **Site is ready for live customer payments**
   - Switch course price back from $1 test to $199 real course
   - Remove test product from inventory

---

**Document Date**: November 1, 2026  
**Reference**: Official Stripe documentation (sources S1-S14)  
**Site**: capitalistbuddha.ca  
**Current Status**: Ready to switch (all sandbox testing complete)
