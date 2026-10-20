# Search

The search boxes on **Backoffice → Users** and **Backoffice → Activity** (and Account → My Activity) go through [Laravel Scout](https://laravel.com/docs/scout). By default it uses the `database` driver, which needs no extra service and no index:

```sh
SCOUT_DRIVER=database
```

The driver searches the model's own table with `LIKE` (`ILIKE` on PostgreSQL), matching the columns in the model's `toSearchableArray()`:

| Model | Matches on |
|---|---|
| `App\Models\User` | name, email, or an exact id |
| `Atrium\Activity\Models\Activity` (Activity module) | description, event, log name |

Only a typed search goes through Scout. A blank search box is a plain database query, so the lists keep working even when an external index is empty.

## Your own models

Add the `Laravel\Scout\Searchable` trait and a `toSearchableArray()` that returns only real text columns — every key you return is searched with `LIKE`. A model owned by a module should also return `Module::enabled('<module>')` from `shouldBeSearchable()`, like `Activity` does, so a switched-off module never writes to an external index; list it in the module's `OwnedData(searchable: [...])` so uninstalling empties its index and a restore rebuilds it.

On MySQL/MariaDB or PostgreSQL, a full-text index makes large text columns faster to search: add it in a migration (`$table->fullText('description')`), then mark the column with `#[SearchUsingFullText(['description'])]` on `toSearchableArray()`. Full-text matches whole words, not substrings.

## Switching to Meilisearch

Once `LIKE` queries get slow (roughly hundreds of thousands of rows), switch to [Meilisearch](https://www.meilisearch.com) for typo tolerance and relevance ranking. Nothing in the pages changes.

1. Install the client: `composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle`
2. Run Meilisearch, e.g. `docker run -p 7700:7700 getmeili/meilisearch`.
3. Set the driver:
   ```sh
   SCOUT_DRIVER=meilisearch
   MEILISEARCH_HOST=http://127.0.0.1:7700
   MEILISEARCH_KEY=your-master-key
   SCOUT_QUEUE=true   # index on the queue, not in the request
   ```
4. In `config/scout.php`, uncomment the `users` and `activity_log` entries under `meilisearch.index-settings` — the lists filter and sort, so those fields must be filterable and sortable.
5. Push the settings and import the existing rows:
   ```bash
   php artisan scout:sync-index-settings
   php artisan scout:import "App\Models\User"
   php artisan scout:import "Atrium\Activity\Models\Activity"
   ```

From then on, Scout keeps the index up to date as rows are saved and deleted. Re-run `scout:import` after restoring a whole-site backup, or after a bulk change that skips Eloquent events (`DB::table()->update()`). Module restores rebuild their own index.
