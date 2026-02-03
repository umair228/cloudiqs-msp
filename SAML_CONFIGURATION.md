# 🎉 SAML Configuration Parameters - Ready!

## Your Cognito User Pool Details

✅ **Amplify Build**: COMPLETE  
✅ **User Pool Created**: us-east-1_GyQq313qC  
✅ **User Pool Domain**: d13k6ou0ossrku-main  
✅ **App Client ID**: 79n3aa3gvmeim7i6h81llqiu3o  
✅ **Application URL**: https://main.d13k6ou0ossrku.amplifyapp.com

---

## Step 1: Configure IAM Identity Center SAML Application

### SAML Configuration Parameters

Copy these values - you'll need them for Identity Center:

**applicationStartURL**:
```
https://d13k6ou0ossrku-main.auth.us-east-1.amazoncognito.com/authorize?client_id=79n3aa3gvmeim7i6h81llqiu3o&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https://main.d13k6ou0ossrku.amplifyapp.com/&idp_identifier=team
```

**applicationACSURL**:
```
https://d13k6ou0ossrku-main.auth.us-east-1.amazoncognito.com/saml2/idpresponse
```

**applicationSAMLAudience**:
```
urn:amazon:cognito:sp:us-east-1_GyQq313qC
```

---

## Configure in IAM Identity Center Console

### 1. Go to IAM Identity Center
Navigate to: https://console.aws.amazon.com/singlesignon/

### 2. Add SAML Application
1. Click **Applications** → **Add application**
2. Select **Add custom SAML 2.0 Application**
3. Click **Next**

### 3. Configure Application Details

**Display name**: `TEAM IDC APP`

**Description**: `Temporary Elevated Access Management Application`

**📋 IMPORTANT - Save This!**
- Find and copy the **AWS IAM Identity Center SAML metadata file URL**
- It looks like: `https://portal.sso.us-east-1.amazonaws.com/saml/metadata/[your-instance-id]`
- **You'll need this URL for the next step!**

### 4. Application Properties

**Application start URL**: Paste the `applicationStartURL` from above
```
https://d13k6ou0ossrku-main.auth.us-east-1.amazoncognito.com/authorize?client_id=79n3aa3gvmeim7i6h81llqiu3o&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https://main.d13k6ou0ossrku.amplifyapp.com/&idp_identifier=team
```

### 5. Application Metadata

Select: **Manually type your metadata values**

**Application ACS URL**: Paste the `applicationACSURL` from above
```
https://d13k6ou0ossrku-main.auth.us-east-1.amazoncognito.com/saml2/idpresponse
```

**Application SAML audience**: Paste the `applicationSAMLAudience` from above
```
urn:amazon:cognito:sp:us-east-1_GyQq313qC
```

### 6. Click Submit

### 7. Configure Attribute Mappings

1. Click **Actions** → **Edit attribute mappings**
2. Add these two mappings:

| User attribute in the application | Maps to this string value or user attribute in IAM Identity Center | Format |
|----------------------------------|-------------------------------------------------------------------|---------|
| Subject | `${user:subject}` | persistent |
| Email | `${user:email}` | basic |

3. Click **Save changes**

### 8. Assign Users and Groups

1. Click **Assigned users** tab
2. Click **Assign users**
3. Add these groups:
   - ✅ `team_admin_group_name` (or your admin group)
   - ✅ `team_auditor_group_name` (or your auditor group)
4. Add any individual users who need access
5. Click **Assign users**

---

## Step 2: Link Cognito with Identity Center

After completing the Identity Center configuration above, run this command:

```bash
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment
./cognito.sh
```

**When prompted**, enter:
1. **SAML Metadata URL**: The URL you saved in Step 3 above
2. **Identity Provider Name**: `team` (lowercase, no spaces)

The script will:
- Create a SAML identity provider in Cognito
- Link it to your Identity Center
- Update the Cognito app client
- Configure the federation

---

## Step 3: Test Authentication

1. **Open the application**:
   ```
   https://main.d13k6ou0ossrku.amplifyapp.com
   ```

2. **Click "Federated Sign In"**

3. **You should be redirected to**:
   ```
   https://d-90661f7cab.awsapps.com/start
   ```

4. **Sign in** with your Identity Center credentials

5. **Success!** You'll be redirected back to the TEAM application, fully authenticated

---

## Troubleshooting

### Error: "details.json not found"
This happens when you run `cognito.sh` before configuring Identity Center SAML.

**Solution**: Complete Step 1 (Identity Center configuration) first, then run Step 2.

### Error: "Provider IDC does not exist"
The SAML identity provider hasn't been created yet.

**Solution**: Make sure you complete the Identity Center SAML configuration and get the metadata URL before running `cognito.sh`.

### Error: "User not found" after login
The user isn't assigned to the TEAM application in Identity Center.

**Solution**: Go to Identity Center → Applications → TEAM IDC APP → Assigned users → Add the user or group.

### Authentication redirects but shows error
Check that:
1. SAML metadata URL is correct in `cognito.sh`
2. Attribute mappings are configured (Subject and Email)
3. User is in the assigned groups

---

## Quick Reference

| Item | Value |
|------|-------|
| **User Pool ID** | us-east-1_GyQq313qC |
| **User Pool Domain** | d13k6ou0ossrku-main |
| **App Client ID** | 79n3aa3gvmeim7i6h81llqiu3o |
| **Application URL** | https://main.d13k6ou0ossrku.amplifyapp.com |
| **Identity Center Portal** | https://d-90661f7cab.awsapps.com/start |
| **Cognito OAuth Domain** | https://d13k6ou0ossrku-main.auth.us-east-1.amazoncognito.com |

---

## Summary

1. ✅ **Configure SAML in Identity Center** (Steps 1-8 above) - ~10 minutes
2. ⏳ **Run cognito.sh** - ~2 minutes  
3. ⏳ **Test authentication** - ~2 minutes

**Total time**: ~15 minutes

After this, your application will be fully functional with real authentication through IAM Identity Center! 🎉

---

**Next Step**: Go to IAM Identity Center Console and follow Step 1 above!
