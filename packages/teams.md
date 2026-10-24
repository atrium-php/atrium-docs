# Teams

| | |
|---|---|
| Package | `atrium-php/teams` — module `teams`, on once installed |
| Namespace | `Atrium\Teams\` |
| Depends on | core |
| Permissions | `teams.manage` — Backoffice → Teams (Admin has it). Team roles are separate, see below |
| Pages | Team switcher in the App sidebar; Account → Teams and each team's page; Backoffice → Teams; the emailed invitation link (auth portal); Backoffice → Settings → Teams |
| Config | `teams` (below); both values also on Settings → Teams |
| Uninstall | backup **required** — `teams`, `team_user`, `team_invitations`. Blocked while any team has members besides its owner |

Workspaces your users belong to — a company, a household, a project group. Each person works in one **current team** at a time and switches from the App sidebar; your App-portal data is scoped to it.

**With the module off or uninstalled** nothing is scoped and the app works as a single-tenant app — your models keep working with `team_id` left as it is.

## Install

```bash
php artisan module:install teams
```

Or Backoffice → Modules → *Available* → *Install*. Nothing to add to your user model.

## Team roles

Each member holds one team role. They are **separate from global roles** (Super Admin, Admin, Staff…), which stay platform-level: a team owner gets no Backoffice access, and a Backoffice Admin is not a member of anyone's team.

| | Owner | Admin | Member |
|---|---|---|---|
| Work in the team, see its members | ✓ | ✓ | ✓ |
| Rename, add people, change roles, remove members | ✓ | ✓ (never the owner) | |
| Transfer ownership, delete the team | ✓ | | |
| Leave | — transfer first | ✓ | ✓ |

One owner per team; ownership moves only by **transfer** (the old owner stays on as an admin).

## Personal teams

With **Give every new account its own team** on (Settings → Teams, default on), each new account gets *"Ada's team"*, and so does anyone in no team on their first App visit. A personal team can't be deleted — it goes with the account.

Off: someone in no team is sent to Account → Teams to create one, or to wait to be added.

## Switching

The switcher under the App sidebar's brand lists the person's teams, with *Team settings* and *Create team*. Their pick is kept for the session and remembered as the team they used last, which is where they start next time. Disabled teams are skipped.

## Adding people

On a team's page (Account → Teams → the team), owner and admins paste addresses (up to 20) and pick **Admin** or **Member**:

- **Has an account** → joins straight away and is told (mail + in-app, a *Teams* notification preference).
- **No account** → an emailed link (valid 7 days, Settings → Teams, 1–90). Opening it while registration is **Open** leads to sign-up, then into the team; with an existing account, to sign-in. The link is also shown once to copy. Pending ones can be withdrawn.

With registration **Closed** or **Invite only**, people without an account can't sign up from a team link — invite them first ([Invitations](/packages/invitations)), then add them.

## Scoping your models

Give App-portal tables a nullable `team_id` and use core's trait:

```php
use Atrium\Core\Concerns\BelongsToTeam;

class Project extends Model
{
    use BelongsToTeam;
}
```

While the person is in the **App portal** (Livewire updates from App pages included):

- queries only return the current team's rows;
- new rows get the current team's `team_id`;
- someone with no team sees nothing.

Everywhere else — Backoffice, Account portal, console commands, queued jobs — and with the module off, the model is **unscoped**. In a job, pass the team id along and filter by it. To read across teams inside the App portal: `Project::withoutGlobalScope('team')`.

The current team from your own code:

```php
use Atrium\Core\Contracts\CurrentTeam;

app(CurrentTeam::class)->scoping(); // App-portal request with the module on
app(CurrentTeam::class)->id();      // null when there is none
app(CurrentTeam::class)->name();
```

Rows of a deleted team aren't touched — listen to `Atrium\Teams\Models\Team`'s `deleted` event if your app should clean them up.

## Backoffice → Teams

`teams.manage`: every team with its owner, member count and creation date, searchable by name or owner email; each team's members; **Disable** (nobody can work in it or change it; members are switched to another team) and **Enable**.

## Account deletion

When an account is deleted, each team it owned goes to its longest-standing admin (else member); teams nobody else is in, and its personal team, are deleted.

## Configuration

`config('teams')`, from the package's `config.php`:

| Key | `.env` | Default | |
|---|---|---|---|
| `personal_teams` | `TEAMS_PERSONAL_TEAMS` | `true` | a team for every new account |
| `invitation_expiry_days` | `TEAMS_INVITATION_EXPIRY_DAYS` | `7` | how long invitation links work |
| `max_per_invite` | — | `20` | addresses per invite |

## While support views as someone

With [Impersonation](/packages/impersonation) on, creating teams and every action on a team's page and Backoffice → Teams are refused.

## For module authors

- `Atrium\Core\Contracts\CurrentTeam` (null object `NullCurrentTeam`) and `Atrium\Core\Concerns\BelongsToTeam` live in core — use them without depending on this module.
- Core point **`shell.sidebar.header`** — Livewire components under the sidebar brand of the signed-in portals, `[component, portals, order]`, each given `:portal`. The switcher uses it.
- Events `Atrium\Teams\Events\MemberJoined` (team, user, role) and `MemberLeft` (team, user) — also sent as [webhooks](/packages/webhooks) `team.member_joined` / `team.member_left`.
- Billing stays per user; billing per team is a later item.
