# Backup

| | |
|---|---|
| Package | `atrium-php/backup` — module `backup`, on once installed; backups only run with `BACKUP_ENABLED=true` |
| Namespace | `Atrium\Backup\` |
| Depends on | core, spatie/laravel-backup |
| Permissions | `backups.manage` (Super Admin only — a backup is the whole database) |
| Pages | Backoffice → Backups (`/backups`); a last-backup card on the Backoffice dashboard (Super Admin) |
| Schedule | clean 01:00, back up 01:30, monitor 09:00 (daily) |
| Config | `backup` (spatie's, preset by Atrium) |
| Uninstall | no module backup (policy **none**) — the backups on your disks are not touched |

Database and file backups through spatie/laravel-backup, with a backoffice page, a health check and a nightly schedule.

## Install

```bash
php artisan module:install backup
```

Or Backoffice → Modules → *Available* → *Install*. Then turn backups on in `.env` (below). Its `.env` keys are listed under [Environment](#environment).

Uninstalling takes no module backup (policy **none**: the module keeps no data of its own) and leaves the backup archives on your disks alone.

## Turning backups on

Once installed the module is on, but **does nothing until you set**:

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

## Settings → Backups

Super Admin can set the same things without `.env`: **nightly backups** on / off / *As in .env*, **destination disks**, **problem emails** and the **storage limit**. A stored setting wins over `.env`; empty falls back to it.

## Retention

Spatie's default strategy: every backup for 7 days, one per day for 16 days, one per week for 8 weeks, one per month for 4 months, one per year for 2 years — and the oldest are deleted when backups use more than `BACKUP_MAX_STORAGE_MB` (5000).

## Restoring

A backup that has never been restored isn't proven. Rehearse this on a staging copy after setup and every few months.

1. **Pick and fetch** a backup: download it from Backoffice → Backups, or run `php artisan backup:list` and fetch `<disk>/<BACKUP_NAME>/<Y-m-d-H-i-s>.zip`.
2. **Unzip** it, with `BACKUP_ARCHIVE_PASSWORD` if it was set. Inside are `db-dumps/<driver>-<database>.sql` and `private/…` / `public/…`.
3. **Stop traffic and jobs**: `php artisan down`, and stop the queue workers.
4. **Restore the database** into an empty database:
   - MySQL / MariaDB: `mysql -u <user> -p <database> < db-dumps/mysql-<database>.sql` (`mariadb-…` for MariaDB)
   - PostgreSQL: `psql -U <user> -d <database> -f db-dumps/postgresql-<database>.sql`
   - SQLite: `sqlite3 database/database.sqlite < db-dumps/sqlite-<database>.sql`
5. **Restore files**: copy `private/` and `public/` back into `storage/app/`, then `php artisan storage:link`.
6. **Bring it back**: `php artisan atrium:upgrade --force` (migrations newer than the backup), restart the workers, `php artisan up`, then `php artisan health:check`.

The same `APP_KEY` is required — without it, 2FA secrets and encrypted settings can't be read. Keep `.env` in your secrets manager, not only on the server.

These are whole-site backups. To bring back **one module's** data after uninstalling it, use its [module backup](/guide/modules#backups-and-restore) instead.

## Monitoring

- A **health check** on Backoffice → System health and `/health` (with the [Health module](/packages/health)): a warning while backups are off or none exists yet, failed when the newest is too old or a destination is unhealthy.
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
