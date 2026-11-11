# Scheduled tasks

| | |
|---|---|
| Package | `atrium-php/scheduler` — module `scheduler`, on once installed |
| Namespace | `Atrium\Scheduler\` |
| Depends on | core |
| Permissions | `scheduler.view` (Admin has it); `scheduler.run` (Super Admin only) |
| Pages | Backoffice → Scheduled tasks |
| Config | `config/scheduler.php`: `keep_days` (`SCHEDULER_KEEP_DAYS`, 30), `output_limit`, `history_limit` |
| Uninstall | nothing to back up — `scheduled_task_runs` is run history |

Read-only visibility of the scheduler: every task core and the modules schedule, with its cron expression, when it is next due, the result and duration of its last run, and the average time of successful runs. **History** shows the last 50 runs of a task, with the error message of a failed one.

## Install

```bash
php artisan module:install scheduler
```

Or Backoffice → Modules → *Available* → *Install*. Your own tasks need no changes.

## How it works

The module listens to the scheduler's own events (starting, finished, failed, skipped) and writes one row per run. A task that was due but held back (a `when()` filter, an overlap lock) is noted as *Skipped*, at most once an hour, and never hides the last real result. Web requests never load the console schedule, so a small task runs every minute and saves the task list for the page. The page therefore fills in the first minute after `php artisan schedule:run` runs from cron. Runs older than `keep_days` are deleted daily.

## Alerts

- **Failure:** when a task that was fine fails, everyone with `scheduler.view` gets a mail and an in-app notification (once per streak: a task failing every minute doesn't mail every minute). Each person can switch it off in their notification preferences, and the wording is editable in Email templates.
- **Health check:** a **Scheduled tasks** check is added to the Health module. It fails while any task's latest run failed, and warns when a task that has run before missed its last due time (it stopped running). With the Health module's alerts on, the team is also told when the status changes. That the scheduler is running at all is the Health module's own *Scheduler* check.

## Run now

For tasks that are artisan commands, Super Admins (`scheduler.run`) get **Run now**, with a confirm. It queues the command and is written to the audit trail. Closure tasks have no button. It is refused while viewing as someone else (Impersonation).
