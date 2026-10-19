# Media

| | |
|---|---|
| Package | `atrium-php/media` — module `media`, on once installed |
| Namespace | `Atrium\Media\` |
| Depends on | core, Intervention Image |
| Permissions | `media.view` (open the library, browse everyone's files), `media.manage` (edit or delete any file — everyone may edit and delete their own) |
| Pages | Backoffice → Media Library (`/media`); the profile photo card on Account → Settings |
| User model | uses `Atrium\Media\Concerns\HasMedia` — add it when you install it |
| Config | `media` (below) |
| Uninstall | backup **required**, files included |

A WordPress-style media library: every upload lands in one central library, and models *use* library items through named collections. One image can be used in many places; removing it from a model never deletes the file. Built on Laravel's `Storage` disks plus [Intervention Image](https://image.intervention.io) for image sizes — no media-library package.

## Install

```bash
php artisan module:install media
```

Or Backoffice → Modules → *Available* → *Install*. Then add the trait to your user model (it powers the profile photo):

```php
use Atrium\Media\Concerns\HasMedia;

class User extends \Atrium\Core\Models\User
{
    use HasMedia;
}
```

`.env`: `MEDIA_DISK` (default `local`), `MEDIA_IMAGE_DRIVER` (`gd` or `imagick`), and the `AWS_*` keys for S3-compatible storage — see [Storage](#storage).

Uninstalling always backs up the library, its attachments **and the files** (policy **required**); after a restore, missing image sizes are regenerated. Remove `HasMedia` from your models before the module's code is removed.

## Backoffice → Media Library

- **Add new** — drag and drop (or pick) many files at once, with a progress bar. Each file is validated on its own; a bad one is reported without losing the rest.
- A grid with search, a type filter (images, video, audio, documents) and *Load more*.
- Click a tile for details: preview (image, video or audio player), file info, editable **Title** and **Alt text**, **Copy URL**, **Used in** (every model and collection using it), **Delete permanently**.
- **Bulk select** → **Delete selected**.

## The media field

Anywhere a form needs files:

```blade
<livewire:media::field :model="$post" collection="gallery" ability="update" label="Gallery" />
```

It shows what's attached (with remove buttons) and an **Add media** button that opens a picker with two tabs: **Upload files** (new uploads are selected automatically) and **Media library** (search, filter, select one or many, **Insert**).

Only files that fit the collection (type, size, dimensions) are listed, and only files the viewer may see: staff with `media.view` see the whole library, everyone else only their own uploads.

Bound to a model it saves straight away — pass `ability` (`Gate::authorize($ability, $model)`) unless the page already guarantees the viewer may edit the model. Or use it as a plain form input and save yourself:

```blade
<livewire:media::field wire:model="gallery" collection="gallery" />
```

```php
$post->syncMedia($this->gallery, 'gallery', auth()->user());   // rejects ids this user may not see
```

The account's **profile photo** card is the module's own example (`collection="avatar"`).

## In code

```php
use Atrium\Media\Concerns\HasMedia;

class Post extends Model
{
    use HasMedia;
}
```

```php
$post->addMedia($request->file('cover'), 'cover');    // upload into the library + use it here
$post->attachMedia($media, 'gallery');                // use an existing library item
$post->syncMedia([4, 9, 2], 'gallery');               // exactly these, in this order
$post->detachMedia($media, 'gallery');                // stop using it (the file stays)
$post->clearMedia('gallery');

$post->getMedia('gallery');                           // in order
$post->getFirstMediaUrl('cover', 'medium');           // a size, falling back to the original
$media->conversion('thumb')->url();
```

While the module is off every method is a no-op that behaves as if the model has no media (`addMedia()` returns `null`), so models can use the trait safely.

## Configuration

Create `config/media.php` in the project to change any of these (it wins over the module's):

| Key | |
|---|---|
| `library` | What may be uploaded at all: `mimes` (images, PDF, Office files, text, CSV, zip, mp4/webm, mp3/wav), `max_size` 10 MB. SVG is excluded on purpose — it can carry scripts. |
| `collections` | Per-collection narrowing: `mimes`, `max_size`, `dimensions`, `single`, `disk`. Unlisted collections use `default`. `avatar`: JPEG/PNG/WebP, 2 MB, at least 100×100, one file. |
| `conversions` | Image sizes made once per image: `thumb` 300×300 crop, `medium` 800, `large` 1600. Sizes the original already fits are skipped. |
| `default_disk` / `MEDIA_DISK` | Where files go (`local`) |
| `image_driver` / `MEDIA_IMAGE_DRIVER` | `gd` or `imagick` |
| `per_page`, `temporary_url_minutes` | Grid page size (30), signed URL lifetime (30 min) |

The rules apply to new uploads *and* when an existing library item is picked. Livewire's temporary-upload limit (12 MB by default) also caps uploads.

## Storage

Files go to `{Y}/{m}/{uuid}.{ext}`, sizes in a `conversions/` folder next to them. Disk: the argument → the collection's `disk` → `MEDIA_DISK`.

`local` is private (`storage/app/private`): `Media::url()` returns a signed URL that expires after `temporary_url_minutes`. Disks without temporary URLs (e.g. `public`) get their plain URL.

S3, Cloudflare R2, DigitalOcean Spaces, MinIO, B2 and the like:

```bash
composer require league/flysystem-aws-s3-v3
```

```sh
MEDIA_DISK=s3
AWS_ACCESS_KEY_ID=…
AWS_SECRET_ACCESS_KEY=…
AWS_DEFAULT_REGION=us-east-1                 # R2: auto
AWS_BUCKET=my-bucket
AWS_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com   # R2 / Spaces only
AWS_USE_PATH_STYLE_ENDPOINT=true                             # R2 / Spaces only
```

Each item remembers its disk, so changing `MEDIA_DISK` later leaves old files where they are.

## Deleting

| Action | Effect |
|---|---|
| Delete a library item | File and sizes deleted, removed from every model using it |
| Remove from a field / `detachMedia()` / `clearMedia()` | The reference is removed; the file stays in the library |
| Delete a model using `HasMedia` | Its references are removed (soft deletes wait for `forceDelete()`); files stay |
| Account deletion | The user's references are removed, and every file they uploaded that nothing else uses is deleted |
| Module off | Nothing is deleted |

## Tables

- `media` — the library: `name` (title), `alt`, `original_name`, `mime_type`, `size`, `metadata` (width/height), `disk`, `path`, `uploaded_by`; image sizes are rows with `conversion_of_id` + `conversion`.
- `mediables` — uses: `media_id`, `mediable_type`/`id`, `collection`, `order`.
