# Quick Recovery Guide

## Overview

This guide provides rapid recovery procedures for critical incidents affecting the stackBrowserAgent application. With our comprehensive Docker image versioning and rollback system, most incidents can be resolved in under 5 minutes.

## Emergency Recovery Matrix

| Incident Type | Recovery Time | Method |
|--------------|---------------|---------|
| Bad deployment | < 2 minutes | GitHub Actions Rollback Workflow |
| Code bug | < 5 minutes | Docker Image Rollback |
| Data issue | < 15 minutes | Database Restore + Rollback |
| Full system failure | < 30 minutes | Complete System Restore |

---

## 🚨 1-Minute Recovery: Automated Rollback (Recommended)

### Using GitHub Actions (Easiest & Safest)

1. **Go to Actions Tab**
   - Navigate to: https://github.com/creditXcredit/workstation/actions
   - Select "Docker Image Rollback" workflow

2. **Run Workflow**
   - Click "Run workflow"
   - Choose target version:
     - `previous` - Rollback to last commit
     - Specific SHA - Rollback to exact version
     - `latest` - Use most recent build
   - Select environment: `production` or `staging`
   - Type `ROLLBACK` to confirm
   - Click "Run workflow"

3. **Monitor Progress**
   - Watch the workflow execution
   - Review the summary when complete
   - Verify health endpoints

**Benefits:**
- ✅ Automatic validation
- ✅ Creates rollback backup  
- ✅ Generates deployment commands
- ✅ Full audit trail
- ✅ No SSH access needed

---

## ⚡ 2-Minute Recovery: Manual Docker Rollback

### Quick Rollback (Manual Method)

```bash
# 1. Identify target version
git log --oneline -10

# 2. Stop current container
docker stop stackbrowseragent && docker rm stackbrowseragent

# 3. Pull and run specific version (replace SHA)
ROLLBACK_SHA="047b82e2e5674df8987724cdada3a5bb5127683c"
docker pull ghcr.io/creditxcredit/workstation:$ROLLBACK_SHA

docker run -d --name stackbrowseragent \
  -p 3000:3000 \
  -e JWT_SECRET=$JWT_SECRET \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ghcr.io/creditxcredit/workstation:$ROLLBACK_SHA

# 4. Verify deployment
curl http://localhost:3000/health
```

### Find Available Versions

**Option 1: Git History**
```bash
git log --pretty=format:"%h - %an, %ar : %s" --graph -10
```

**Option 2: Container Registry**
- Visit: https://github.com/creditXcredit/workstation/pkgs/container/workstation

**Option 3: GitHub API**
```bash
gh api repos/creditXcredit/workstation/commits --paginate | \
  jq -r '.[] | "\(.sha[0:7]) - \(.commit.message)"' | head -10
```

---

## 🔄 5-Minute Recovery: Git Revert + Rebuild

```bash
# 1. Identify and revert problematic commit
git log --oneline --all
git revert <commit-sha>

# 2. Push to trigger new build (takes 2-3 minutes)
git push origin main

# 3. Monitor build at: https://github.com/creditXcredit/workstation/actions

# 4. Once built, deploy new image
docker pull ghcr.io/creditxcredit/workstation:latest
docker stop stackbrowseragent && docker rm stackbrowseragent
docker run -d --name stackbrowseragent \
  -p 3000:3000 \
  -e JWT_SECRET=$JWT_SECRET \
  ghcr.io/creditxcredit/workstation:latest
```

---

## 💾 15-Minute Recovery: Database Rollback

```bash
# 1. Stop application
docker stop stackbrowseragent

# 2. Backup current state
docker exec postgres pg_dump stackbrowseragent > /tmp/pre-restore-backup.sql

# 3. Restore from backup
pg_restore -C -d postgres /backups/backup_<timestamp>.dump

# 4. Rollback to compatible application version
docker pull ghcr.io/creditxcredit/workstation:<compatible-version>

# 5. Restart application
docker run -d --name stackbrowseragent \
  -p 3000:3000 \
  -e JWT_SECRET=$JWT_SECRET \
  ghcr.io/creditxcredit/workstation:<compatible-version>

# 6. Verify
curl http://localhost:3000/health
```

---

## 🆘 30-Minute Recovery: Complete System Restore

```bash
# 1. Document current state
docker ps -a > /tmp/container_state.txt
git log --oneline -5 > /tmp/git_state.txt

# 2. Clean slate
docker stop $(docker ps -q) 2>/dev/null || true
docker system prune -af

# 3. Checkout known good commit
GOOD_SHA="047b82e2e5674df8987724cdada3a5bb5127683c"
git fetch --all
git checkout $GOOD_SHA

# 4. Rebuild environment
npm ci && npm run build && npm test

# 5. Restore database
pg_restore -C -d postgres /backups/backup_latest.dump

# 6. Deploy
docker pull ghcr.io/creditxcredit/workstation:$GOOD_SHA
docker run -d --name stackbrowseragent \
  -p 3000:3000 \
  -v /data:/data \
  -e JWT_SECRET=$JWT_SECRET \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ghcr.io/creditxcredit/workstation:$GOOD_SHA

# 7. Verify and monitor
curl http://localhost:3000/health
watch -n 10 'curl -s http://localhost:3000/health | jq'
```

---

## ✅ Post-Recovery Verification

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Authentication test
TOKEN=$(curl -X POST http://localhost:3000/auth/generate \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","role":"admin"}' | jq -r '.token')
curl http://localhost:3000/auth/verify -H "Authorization: Bearer $TOKEN"

# 3. Performance check
time curl http://localhost:3000/health
docker stats stackbrowseragent --no-stream

# 4. Log analysis
docker logs stackbrowseragent --tail 100 | grep -i error
```

---

## 📊 Recovery Decision Tree

```
Is application down?
├─ YES → 🚨 Use 1-Minute Automated Rollback
│   └─ Still down? → Manual Docker Rollback
└─ NO → Is functionality broken?
    ├─ YES → Critical?
    │   ├─ YES → 🚨 Automated Rollback
    │   └─ NO → ⚡ Git Revert + Rebuild
    └─ NO → Is data corrupted?
        ├─ YES → 💾 Database Rollback
        └─ NO → Monitor and document
```

---

## 🔗 Quick Links

- **Container Registry**: https://github.com/creditXcredit/workstation/pkgs/container/workstation
- **GitHub Actions**: https://github.com/creditXcredit/workstation/actions
- **Rollback Workflow**: https://github.com/creditXcredit/workstation/actions/workflows/docker-rollback.yml
- **Commit History**: https://github.com/creditXcredit/workstation/commits/main
- **Full Guides**: [DOCKER_ROLLBACK_GUIDE.md](./DOCKER_ROLLBACK_GUIDE.md) | [CONTAINER_VERSION_STRATEGY.md](./CONTAINER_VERSION_STRATEGY.md)

---

## 📋 Recovery Checklist

- [ ] Issue detected and severity assessed
- [ ] Current state documented (logs, screenshots)
- [ ] Recovery method selected
- [ ] Recovery procedure executed
- [ ] Health checks verified
- [ ] System monitored for 15+ minutes
- [ ] Incident report created
- [ ] Root cause analyzed
- [ ] Prevention measures implemented
- [ ] Team notified
