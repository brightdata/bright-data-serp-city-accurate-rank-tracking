# 🚀 GitHub Actions Setup Guide

This guide explains how to set up automated daily SERP rank tracking using GitHub Actions.

## 📋 Prerequisites

- GitHub repository with the SERP rank tracker code
- Bright Data API credentials
- GitHub repository admin access

## 🔐 Setting Up Secrets

### 1. Go to Repository Settings
Navigate to your repository → **Settings** → **Secrets and variables** → **Actions**

### 2. Add Required Secrets

#### `BRIGHT_DATA_API_KEY`
- **Name**: `BRIGHT_DATA_API_KEY`
- **Value**: Your Bright Data API key
- **Description**: API key for Bright Data SERP API access

#### `BRIGHT_DATA_ZONE` (Optional)
- **Name**: `BRIGHT_DATA_ZONE`
- **Value**: `serp_api1` (or your custom zone)
- **Description**: Bright Data zone identifier

## ⏰ Schedule Configuration

The workflow is configured to run **every day at 6:00 AM Europe time**:

- **Winter (CET)**: 6:00 AM Central European Time
- **Summer (CEST)**: 6:00 AM Central European Summer Time
- **UTC Equivalent**: 5:00 AM UTC (winter) / 4:00 AM UTC (summer)

### Customizing the Schedule

Edit `.github/workflows/daily-rank-tracking.yml` and modify the cron expression:

```yaml
schedule:
  - cron: '0 5 * * *'  # Current: 5:00 AM UTC daily
```

**Common Cron Patterns:**
- `0 5 * * *` - Daily at 5:00 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 5 * * 1-5` - Weekdays only at 5:00 AM UTC
- `0 5 1 * *` - First day of each month at 5:00 AM UTC

## 🎯 Manual Triggering

You can manually run the workflow anytime:

1. Go to **Actions** tab in your repository
2. Select **🚀 Daily SERP Rank Tracking**
3. Click **Run workflow**
4. Choose options:
   - **Test mode**: Run with limited data (faster, cheaper)
   - **Concurrency**: Number of simultaneous API requests

## 📊 Monitoring & Results

### Workflow Status
- **Green checkmark**: Success ✅
- **Red X**: Failure ❌
- **Yellow dot**: In progress 🔄

### Results Access
1. **Artifacts**: Download results from the Actions tab
2. **Summary**: View results summary in the workflow run
3. **Logs**: Check detailed execution logs

### Artifact Retention
- Results are kept for **30 days**
- Each run creates a new artifact with timestamp
- Previous runs remain accessible in the Actions history

## 🔧 Troubleshooting

### Common Issues

#### API Rate Limits
```
Error: Rate limit exceeded
```
**Solution**: Reduce concurrency or add delays between requests

#### Authentication Errors
```
Error: 401 Unauthorized
```
**Solution**: Check `BRIGHT_DATA_API_KEY` secret is correct

#### Missing Dependencies
```
Error: Cannot find module
```
**Solution**: Ensure `package-lock.json` is committed

### Debug Mode
Enable debug logging by adding to the workflow:

```yaml
- name: 🧪 Run rank tracking
  env:
    DEBUG: "*"
  run: npm run dev -- --concurrency 3
```

## 📈 Performance Optimization

### Recommended Settings
- **Production**: Concurrency 5-10
- **Testing**: Concurrency 2-3
- **Large datasets**: Consider splitting into multiple workflows

### Cost Management
- Monitor API usage in Bright Data dashboard
- Use test mode for development
- Set up usage alerts

## 🔄 Updating the Workflow

### Automatic Updates
Dependabot will automatically suggest updates for:
- Node.js version
- GitHub Actions versions
- npm dependencies

### Manual Updates
1. Edit `.github/workflows/daily-rank-tracking.yml`
2. Commit and push changes
3. GitHub Actions will use the new configuration on next run

## 📞 Support

If you encounter issues:
1. Check the workflow logs
2. Verify secrets are correctly set
3. Test locally with `npm run dev`
4. Check Bright Data API status

## 🎉 Success Indicators

Your setup is working correctly when:
- ✅ Workflow runs automatically at scheduled time
- ✅ Results are generated and uploaded as artifacts
- ✅ Summary shows correct result counts
- ✅ No authentication or rate limit errors 