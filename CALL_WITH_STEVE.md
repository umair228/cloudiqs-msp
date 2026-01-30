# ✅ What to Ask Steve - Quick Checklist

## 🎯 TL;DR - Must-Have Information

Before deploying, you MUST get these from Steve:

### Critical (Cannot Deploy Without)
- [ ] **AWS Account ID**: ________________
- [ ] **AWS Region**: ________________
- [ ] **IAM Identity Center ARN**: ________________
- [ ] **SES Sender Email**: ________________
- [ ] **SES Domain Verification Status**: ☐ Verified ☐ Not Verified
- [ ] **Bedrock Access Status**: ☐ Approved ☐ Pending ☐ Not Requested

### Important (Needed for Go-Live)
- [ ] **Target Deployment Date**: ________________
- [ ] **First 3 Customers to Onboard**: 
  1. ________________
  2. ________________
  3. ________________
- [ ] **Approval for Deployment**: ☐ Yes ☐ No

---

## 📞 Conversation Guide with Steve

### Opening (2 minutes)
**You**: "Hey Steve! The CloudiQS MSP implementation is complete - all features you requested are built and tested. Before we deploy, I need to gather some AWS configuration details. Should take about 15-20 minutes. Good time?"

### Section 1: AWS Basics (5 minutes)

**You**: "First, the AWS environment..."

**Ask**:
1. "What AWS account should we deploy to?" → **Get Account ID**
2. "Which region do you prefer?" → **Recommend us-east-1 for Bedrock**
3. "Do you have a separate staging/dev account for testing first?" → **Get staging account if exists**
4. "Is IAM Identity Center already set up?" → **Get ARN or need to configure**

**Expected answers**:
- Account ID: 12-digit number
- Region: us-east-1 or us-west-2
- Staging: Yes/No
- IAM IdC: Already setup / Need to configure

---

### Section 2: Email Configuration (5 minutes)

**You**: "Now for email notifications..."

**Ask**:
1. "What email should send the notifications?" → **Get email address**
2. "Is that email/domain verified in Amazon SES?" → **Yes/No/Don't know**
3. "Are you in SES sandbox mode or production?" → **Sandbox limits to verified emails only**
4. "For testing, what email addresses should receive test emails?" → **Get 2-3 test emails**

**If NOT verified yet**:
**You**: "No problem! I'll walk you through SES verification - takes about 5 minutes. We can do it together or I can send you instructions."

**Expected answers**:
- Sender email: noreply@cloudiqs.com or similar
- Domain status: Need to verify
- SES mode: Probably sandbox (need to move to production)
- Test emails: steve@cloudiqs.com, umair@cloudiqs.com

---

### Section 3: AI/Bedrock (3 minutes)

**You**: "For the AI-powered summaries feature..."

**Ask**:
1. "Have you requested access to AWS Bedrock?" → **Yes/No/Don't know**
2. "If not, I can request it now - usually instant approval. Want me to?" → **Get permission**
3. "The AI will generate customer-friendly summaries. What's your monthly budget for AI calls?" → **Get budget or say "$50/month is typical"**

**Expected answers**:
- Bedrock: Not set up yet (you'll help)
- Budget: $50-100/month is fine
- Permission: Yes, set it up

**If Steve unsure**:
**You**: "AI summaries use AWS Bedrock with Claude 3. It costs about $0.003 per 1000 tokens - roughly $20-50/month for typical usage. We also have a fallback that generates basic summaries if you want to skip Bedrock initially."

---

### Section 4: Customers & Timeline (5 minutes)

**You**: "For customer onboarding..."

**Ask**:
1. "Which 2-3 customers should we onboard first as a pilot?" → **Get customer names**
2. "Do you have their AWS account IDs ready?" → **Get account IDs**
3. "What's your target go-live date?" → **Get date or timeframe**
4. "Should we deploy to staging first or go straight to production?" → **Recommend staging**

**Expected answers**:
- First customers: 2-3 friendly customers
- Account IDs: They might need to get these
- Go-live: This week / Next week / Flexible
- Strategy: Staging first (recommended)

**Recommendation**:
**You**: "I'd suggest: (1) Deploy to staging today, (2) Test with 1 customer tomorrow, (3) Production by end of week if all looks good. Sound reasonable?"

---

### Section 5: Testing (3 minutes)

**You**: "For testing before go-live..."

**Ask**:
1. "Can we use real customer data for testing or should we use dummy data?" → **Preference**
2. "Should we test the email approval flow with actual customer emails?" → **Get test strategy**
3. "Do you want to review email templates before they go to customers?" → **Yes/No**

**Expected answers**:
- Test data: Start with dummy, then real
- Email testing: Use internal emails first
- Review: Yes, show me templates

**You**: "Great! I'll set up a test customer and walk you through the full workflow before we enable it for real customers."

---

### Closing (2 minutes)

**You**: "Perfect! I have everything I need. Here's what happens next:"

**Explain Timeline**:
1. "I'll deploy to staging today (30 minutes)"
2. "We'll test together tomorrow (1 hour)"
3. "If all looks good, production by [agreed date]"
4. "I'll send you screenshots and a quick demo video"

**Ask for Final Approval**:
**You**: "Before I start deployment, do you approve me to proceed with these configurations?"
→ **Get explicit "Yes, go ahead"**

**Set Follow-up**:
**You**: "I'll send you an update tonight with staging deployed. Can we do a test walkthrough tomorrow at [time]?"
→ **Schedule next meeting**

---

## 📝 During the Call - Fill This Out

### Notes Template

**Date of Call**: ________________  
**Duration**: ________________

**AWS Configuration**:
```
Account ID: ____________________
Region: ____________________
Staging Account: ____________________
IAM IdC ARN: ____________________
```

**Email Setup**:
```
Sender Email: ____________________
Domain Status: ☐ Verified ☐ Need to verify
SES Mode: ☐ Sandbox ☐ Production
Test Emails: 
  1. ____________________
  2. ____________________
```

**Bedrock/AI**:
```
Access Status: ☐ Approved ☐ Will request
Budget: $________/month
Fallback OK: ☐ Yes ☐ No
```

**Customers**:
```
Pilot Customer 1: ____________________
  - Account ID: ____________________
  - Approver Email: ____________________

Pilot Customer 2: ____________________
  - Account ID: ____________________
  - Approver Email: ____________________

Pilot Customer 3: ____________________
  - Account ID: ____________________
  - Approver Email: ____________________
```

**Timeline**:
```
Target Go-Live: ____________________
Staging Deploy: ____________________
Testing Date: ____________________
Production Deploy: ____________________
```

**Decisions Made**:
- [ ] Approved to proceed with deployment
- [ ] Will test in staging first
- [ ] Customer approval emails reviewed
- [ ] Monitoring/alerts set up needed
- [ ] Training session scheduled

**Action Items**:
- [ ] Umair: Deploy to staging by ____
- [ ] Umair: Send demo video by ____
- [ ] Steve: Verify SES domain by ____
- [ ] Steve: Provide customer details by ____
- [ ] Both: Test session on ____

---

## 🎬 After the Call

### Immediate Actions (Today)
1. [ ] Send Steve summary email with notes
2. [ ] Start staging deployment (follow QUICKSTART.md)
3. [ ] Verify SES if Steve hasn't already
4. [ ] Request Bedrock access if needed
5. [ ] Create test customer in staging

### Next Day Actions
1. [ ] Demo to Steve (recorded session)
2. [ ] Walk through email templates
3. [ ] Test full approval workflow
4. [ ] Show AI summary generation
5. [ ] Get Steve's sign-off for production

### Within 1 Week
1. [ ] Deploy to production
2. [ ] Onboard first customer
3. [ ] Monitor for 24-48 hours
4. [ ] Collect feedback
5. [ ] Iterate as needed

---

## 🚨 If Steve Doesn't Have Information

### He doesn't know AWS Account ID:
**You**: "No problem! Let me help you find it. Log into AWS Console → Click your name in top-right → You'll see a 12-digit number. That's your account ID."

### He doesn't know about IAM Identity Center:
**You**: "That's the authentication service we'll use. If you're not sure if it's set up, I can check with you. We'll need admin access to AWS Console for 10 minutes to configure it."

### He doesn't have SES set up:
**You**: "Perfect timing! I'll set it up as part of deployment. It's straightforward - just need to verify an email address. Takes 5 minutes."

### He's unsure about Bedrock:
**You**: "No worries! We have a fallback that works without AI initially. We can add Bedrock later once you're comfortable with costs. The fallback still provides good summaries, just more technical."

### He's not ready to decide on customers:
**You**: "That's fine! Let's deploy to staging first and test with dummy data. You can identify customers next week before production."

---

## ✅ Success Criteria

You're ready to deploy when you have:
- ✅ AWS account access (ID + credentials)
- ✅ Region decided
- ✅ Email configuration plan (even if not verified yet)
- ✅ Steve's approval to proceed
- ✅ Test strategy agreed
- ✅ Next meeting scheduled

You can START deployment even if:
- ⚠️ SES not verified yet (can verify during deployment)
- ⚠️ Bedrock not set up (can use fallback)
- ⚠️ Customer list not final (can add later)
- ⚠️ CloudTrail Lake not configured (optional initially)

---

## 📧 Follow-up Email Template

After your call, send this:

```
Subject: CloudiQS MSP Deployment - Next Steps

Hi Steve,

Great call today! Here's a summary of what we discussed:

✅ Confirmed Information:
- AWS Account: [ID]
- Region: [region]
- Email: [sender email]
- Go-Live Target: [date]

⏳ Action Items:
You:
- [Action 1]
- [Action 2]

Me:
- Deploy to staging today
- Send demo video tomorrow
- Schedule test session for [date/time]

🚀 Next Steps:
1. I'll deploy to staging tonight (ETA: [time])
2. You'll receive an email with staging URL and test credentials
3. We'll test together on [date] at [time]
4. Production deployment on [date] if tests pass

Questions? Just reply to this email or call me.

Thanks!
Umair
```

---

**Document Version**: 1.0  
**Purpose**: Guide conversation with Steve  
**Time Required**: 15-25 minutes  
**Outcome**: Ready to deploy!
