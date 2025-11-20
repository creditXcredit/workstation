# Rollbacks Directory

This directory contains rollback files created by the Repo Update Agent.

## Structure

```
rollbacks/
├── YYYY-MM-DD/
│   ├── README.md.bak
│   ├── REPOSITORY_STATS.md.bak
│   ├── STATS_OVERVIEW.md.bak
│   └── ...
└── rollback-index.json
```

## Retention

Rollback files are automatically cleaned after **30 days**.

## Usage

See `agents/repo-update-agent/scripts/rollback.sh` for rollback commands.

```bash
# List available rollbacks
./agents/repo-update-agent/scripts/rollback.sh --list

# Rollback all files from a date
./agents/repo-update-agent/scripts/rollback.sh 2025-11-20

# Rollback specific file
./agents/repo-update-agent/scripts/rollback.sh 2025-11-20 README.md
```

## Safety

- Original files are backed up before rollback (.safety-backup)
- Rollback files are preserved (never deleted during rollback)
- Can be reversed by restoring .safety-backup files

---

**Managed by**: Repo Update Agent v1.0.0
