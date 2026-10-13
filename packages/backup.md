# Backup

| | |
|---|---|
| Package | `atrium-php/backup` — module `backup`, on by default (`MODULE_BACKUP`); backups only run with `BACKUP_ENABLED=true` |
| Namespace | `Atrium\Backup\` |
| Depends on | core, spatie/laravel-backup |
| Permissions | `backups.manage` (Super Admin only — a backup is the whole database) |
| Pages | Backoffice → Backups (`/backups`) |
| Schedule | clean 01:00, back up 01:30, monitor 09:00 (daily) |
| Config | `backup` (spatie's, preset by Atrium) |

Database and file backups through spatie/laravel-backup, with a backoffice page, a health check and a nightly schedule.

## Turning backups on

The module is on by default but **does nothing until you set**:

```sh
BACKUP_ENABLED=true
```

Then every night: `backup:clean` (01:00, so a new backup never pushes out the newest old one), `backup:run` (01:30) and `backup:monitor` (09:00, emails when the newest backup is too old or too big). Keep Laravel's scheduler and a queue worker running.

## What's backed up

- **The database** (`DB_CONNECTION`).
- **Files in `storage/app`** — uploads, media — except the backups themselves, temporary uploads, data exports and health-check files.

Backups go to the `backups` disk (`storage/app/backups`) by default. Use an off-site disk in production:

```sh
BACKUP_DISKS=s3,backups        # comma-separated filesystem disks
BACKUP_ARCHIVE_PASSWORD=…      # encrypt the zip
```

## Backoffice → Backups

- Every backup on every destination, with size and date.
- **Back up now** — the database, the files, or both, queued (one at a time).
- **Download** and **delete** a backup.
- The current settings (destinations, schedule, retention) at a glance.

## Retention

Spatie's default strategy: every backup for 7 days, one per day for 16 days, one per week for 8 weeks, one per month for 4 months, one per year for 2 years — and the oldest are deleted when backups use more than `BACKUP_MAX_STORAGE_MB` (5000).

## Monitoring

- A **health check** on Backoffice → System health and `/health`: a warning while backups are off or none exists yet, failed when the newest is too old or a destination is unhealthy.
- **Emails** to `BACKUP_NOTIFY_MAIL` (falls back to `HEALTH_NOTIFY_MAIL`) when a backup or cleanup fails, or the monitor finds a problem (newest backup older than a day, or over the storage cap). Successful runs send nothing.

## Environment

| Var | Default | |
|---|---|---|
| `BACKUP_ENABLED` | `false` | Run scheduled backups |
| `BACKUP_DISKS` | `backups` | Destination disks |
| `BACKUP_NAME` | `APP_NAME` | Folder name on the disks |
| `BACKUP_ARCHIVE_PASSWORD` | empty | Encrypt archives |
| `BACKUP_NOTIFY_MAIL` | `HEALTH_NOTIFY_MAIL` | Who is emailed |
| `BACKUP_MAX_STORAGE_MB` | `5000` | Storage cap before the oldest are deleted |
| `BACKUP_CLEAN_AT`, `BACKUP_RUN_AT`, `BACKUP_MONITOR_AT` | `01:00`, `01:30`, `09:00` | Schedule times |

To change anything else, create `config/backup.php` in the project — it wins over the module's.
