# Media

| | |
|---|---|
| Package | `atrium-php/media` — module `media`, on once installed |
| Namespace | `Atrium\Media\` |
| Depends on | core, Intervention Image |
| Permissions | `media.view` (open the library, browse everyone's shared files), `media.manage` (edit any shared file: title, alt text, image editor), `media.delete` (**Super Admin only** — move anyone's unused file to the Trash, delete permanently, empty the Trash). Everyone may edit, trash and restore their own uploads. |
| Pages | Backoffice → Media Library (`/media`, with a Trash); the profile photo card on Account → Settings; *Choose from library* for the logo and favicon on Settings → General; a storage-used card on the Backoffice dashboard |
| User model | uses `Atrium\Media\Concerns\HasMedia` — add it when you install it |
| Config | `media` (below); disk, upload limit and image sizes also on Backoffice → Settings → Media (`media.manage`) |
| Uninstall | backup **required**, files included |

A WordPress-style media library: every upload lands in one central library, and models *use* library items through named collections. One image can be used in many places; removing it from a model never deletes the file. Built on Laravel's `Storage` disks plus [Intervention Image](https://image.intervention.io) for image sizes and editing — no media-library package.

Files are either **shared** (public) or **personal** (private):

| | Shared (public) | Personal (private) |
|---|---|---|
| What | logos, banners, documents — anything uploaded to the library | profile photos, and any collection you mark private |
| Listed in the Media Library and pickers | yes, to whoever may see the library | **never**, not even for Super Admin |
| A picker for its collection lists | the library | only the viewer's own earlier uploads |
| Link | permanent: `/media/{uuid}/{file}`, for anyone with the link | signed, expires after `temporary_url_minutes` |
| Edit / delete | own uploads; `media.manage` edits, `media.delete` deletes | the owner only |
| Activity log | the `media` log (uploaded, renamed, edited, trashed…) | the owner's **My Activity** ("changed the profile photo") |

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

`.env`: `MEDIA_DISK` (default `local`), `MEDIA_PRIVATE_DISK` (default `local`), `MEDIA_IMAGE_DRIVER` (`gd` or `imagick`), and the `AWS_*` keys for S3-compatible storage — see [Storage](#storage).

Uninstalling always backs up the library, its attachments **and the files** (policy **required**); after a restore, missing image sizes are regenerated. Remove `HasMedia` from your models before the module's code is removed.

## Backoffice → Media Library

- **Add new** — drag and drop (or pick) many files at once, with a progress bar. Each file is validated on its own; a bad one is reported without losing the rest.
- A grid with search, a type filter (images, video, audio, documents), **Only mine** and *Load more*. Only shared files are listed.
- Click a tile for details: preview (image, video or audio player), file info, editable **Title** and **Alt text**, **Edit image**, the **Permanent link**, **Used in** (every record still using it) and **Move to Trash**.
- **Bulk select** → **Delete selected** moves them to the Trash. Files in use, or someone else's without `media.delete`, are skipped and counted.
- **Trash** tab — deleted files, restorable for `trash_days` (30). **Restore**: the uploader or `media.delete`. **Delete permanently** and **Empty Trash**: `media.delete`. A daily job (`media:purge-trash`, 03:15) deletes what's older.

### Deleting is guarded

- **A file in use can't be deleted** — not even by Super Admin. Remove it from those records first, from each record's own form, by someone allowed to edit that record. The library has no "remove from everywhere" button, so nobody can strip files off records they can't edit.
- **Delete = Trash.** A mass delete by mistake (or by someone who shouldn't) is undone from the Trash. Only `media.delete` (Super Admin) loses files for good.
- Bulk actions are one grouped entry in the activity log.

## Image editor

**Edit image** (Media Library details, or the scissors on an attached image in any media field) opens the editor: crop with a free box or 1:1, 4:3, 16:9 or the original ratio, rotate left / right, flip, and set the output width × height (proportions locked by default). Then:

- **Save as copy** — a new item "{name} (edited)", uploaded by you; the original is untouched. In a media field the copy takes the original's place.
- **Replace** — the same item gets the edited image, so every place using it updates. The previous version goes to the Trash as "{name} (before edit)", restorable for `trash_days`.

JPEG, PNG, GIF and WebP only (animated GIFs may lose their animation). The browser only sends the crop box, turns and size; the server applies them to the original with Intervention Image, then makes the image sizes again. Who may edit: the uploader, or `media.manage` for shared files. A collection's `aspect` sets the ratio the editor starts with from its field — the profile photo starts square.

The crop box is [Cropper.js](https://github.com/fengyuanchen/cropperjs) 1.6.2 (MIT), shipped inside the module and served from `/media-assets/` — no npm step, and it leaves with the module.

## The media field

Anywhere a form needs files:

```blade
<livewire:media::field :model="$post" collection="gallery" ability="update" label="Gallery" />
```

It shows what's attached (with remove buttons) and an **Add media** button that opens a picker with two tabs: **Upload files** (new uploads are selected automatically) and **Media library** (search, filter, select one or many, **Insert**).

Only files that fit the collection (type, size, dimensions) are listed, and only files the viewer may pick: for a shared collection, the library (staff with `media.view` see all of it, everyone else only their own uploads); for a private one, only the viewer's own earlier uploads to it.

Bound to a model it saves straight away — pass `ability` (`Gate::authorize($ability, $model)`) unless the page already guarantees the viewer may edit the model. Or use it as a plain form input and save yourself:

```blade
<livewire:media::field wire:model="gallery" collection="gallery" />
```

```php
$post->syncMedia($this->gallery, 'gallery', auth()->user());   // rejects ids this user may not see
```

The account's **profile photo** card is the module's own example (`collection="avatar"`, private). Changes to the signed-in user's own media through a field go on their **My Activity** log.

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
$media->publicUrl();                                  // permanent link (null if private or trashed)
```

Edit an image in code: `app(ImageEditService::class)->apply($media, new EditInstructions(rotate: 90, crop: [...], width: 800), replace: false, editor: $user)` (`Atrium\Media\Services`, `Atrium\Media\Support`).

While the module is off every method is a no-op that behaves as if the model has no media (`addMedia()` returns `null`), so models can use the trait safely.

## Configuration

Backoffice → Settings → **Media** (`media.manage`) sets the storage disk, the largest upload (MB) and which image sizes are made — a stored setting wins over `config/media.php` / `.env`; empty falls back to it.

Create `config/media.php` in the project to change any of these (it wins over the module's):

| Key | |
|---|---|
| `library` | What may be uploaded at all: `mimes` (images, PDF, Office files, text, CSV, zip, mp4/webm, mp3/wav), `max_size` 10 MB. SVG is excluded on purpose — it can carry scripts. |
| `collections` | Per-collection narrowing: `mimes`, `max_size`, `dimensions`, `single`, `disk`, `visibility` (`public` by default, or `private`), `label` (its name in the activity log), `aspect` (the editor's starting ratio). Unlisted collections use `default`. `avatar`: JPEG/PNG/WebP, 2 MB, at least 100×100, one file, **private**, square. `brand`: images for the logo / favicon picker. |
| `conversions` | Image sizes made once per image: `thumb` 300×300 crop, `medium` 800, `large` 1600. Sizes the original already fits are skipped. |
| `default_disk` / `MEDIA_DISK` | Where files go (`local`) |
| `private_disk` / `MEDIA_PRIVATE_DISK` | Where private collections' files go when the collection names no disk (`local`). Never a publicly served disk. |
| `trash_days` | Days a deleted file stays restorable in the Trash (30) |
| `image_driver` / `MEDIA_IMAGE_DRIVER` | `gd` or `imagick` |
| `per_page`, `temporary_url_minutes` | Grid page size (30), signed URL lifetime (30 min) |

The rules apply to new uploads *and* when an existing library item is picked. Livewire's temporary-upload limit (12 MB by default) also caps uploads.

## Storage

Files go to `{Y}/{m}/{uuid}.{ext}`, sizes in a `conversions/` folder next to them. Disk: the argument → the collection's `disk` → `MEDIA_PRIVATE_DISK` for private collections, `MEDIA_DISK` otherwise.

**Shared files** get a permanent link, `/media/{uuid}/{file}`, on every portal's domain — the same on any disk, so changing disks never breaks a stored link (the brand logo, an email). Local disks are streamed (cached for an hour); S3-style disks get a short redirect to a fresh signed URL; disks with plain URLs redirect to them. Images, video and audio open in the browser; every other type downloads, so an uploaded file can never run as a page of your site. `Media::url()` adds `?v=` so an edited image isn't served from cache. A trashed file's link stops working until it's restored.

**Private files** keep signed links: `local` is private (`storage/app/private`), and its URLs expire after `temporary_url_minutes`.

::: warning Upgrading with your own config/media.php
If you created `config/media.php` before 07, add `'visibility' => 'private'` (plus `'label' => 'profile photo'` and `'aspect' => '1'`) to its `avatar` collection *before* running `atrium:upgrade`. The upgrade makes files used only as profile photos private, based on that setting.
:::

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
| Delete a library item | Refused while it's in use. Otherwise moved to the Trash: hidden, link stops, file kept; restorable for `trash_days` |
| Delete permanently / Empty Trash / daily purge | File and sizes deleted (`media.delete`; the purge for Trash older than `trash_days`) |
| Replace in the image editor | Same item, new file; the previous version goes to the Trash |
| Remove from a field / `detachMedia()` / `clearMedia()` | The reference is removed; the file stays in the library |
| Delete a model using `HasMedia` | Its references are removed (soft deletes wait for `forceDelete()`); files stay |
| Account deletion | The user's references are removed, and every file they uploaded that nothing else uses is deleted for good (Trash included) |
| Module off | Nothing is deleted |

## Tables

- `media` — the library: `name` (title), `alt`, `visibility` (`public` / `private`), `original_name`, `mime_type`, `size`, `metadata` (width/height), `disk`, `path`, `uploaded_by`, `deleted_at` (in the Trash); image sizes are rows with `conversion_of_id` + `conversion`.
- `mediables` — uses: `media_id`, `mediable_type`/`id`, `collection`, `order`.
