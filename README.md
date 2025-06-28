# Scheduled Image Upload and Resize Script

This script is a **Vercel serverless function** scheduled to run **once daily at midnight UTC**. It automatically:

- Fetches images from a GitHub repository folder (`images` directory)
- Filters image files (`jpg`, `jpeg`, `png`, `gif`, `webp`)
- Uploads each image to **Cloudinary**
- Converts and resizes images to **500x400** pixels, cropping to fill the dimensions
- Converts images to **WebP** format for optimized delivery
- Stores images in the Cloudinary folder `product-images`
- Returns a JSON response summarizing the uploaded files

---

## Configuration

```ts
export const config = {
  schedule: "0 0 * * *", // runs once daily at midnight UTC
};
```

This cron schedule triggers the function every day at 00:00 UTC.

---

## Cloudinary Setup

Cloudinary is configured with environment variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

```ts
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
```

---

## Image Upload Function

`uploadImageFromUrl(url: string, publicId: string)` downloads an image from a URL using Axios as a stream, then uploads it to Cloudinary with transformations:

- Resize to 500 width × 400 height pixels, cropping to fill (`crop: 'fill'`)
- Convert format to WebP (`format: 'webp'`)
- Save in the folder `product-images` with the given `publicId`

```ts
async function uploadImageFromUrl(url: string, publicId: string) {
  return new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
    axios({
      url,
      method: "GET",
      responseType: "stream",
    })
      .then((response) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            folder: "product-images",
            public_id: publicId,
            format: "webp",
            transformation: [{ width: 500, height: 400, crop: "fill" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        );
        response.data.pipe(uploadStream);
      })
      .catch(reject);
  });
}
```

---

## Main Handler Function

The scheduled `GET` handler:

1. Fetches contents of the `images` directory in the GitHub repo specified by environment variables:

   - `GITHUB_OWNER`
   - `GITHUB_REPO`

2. Filters image files by extension

3. Iterates through images and uploads each one using `uploadImageFromUrl`

4. Logs successes and failures

5. Returns a JSON response listing uploaded files and URLs

```json
{
  "message": "Upload complete",
  "uploaded": [
    {
      "file": "airfryer.webp",
      "url": "https://res.cloudinary.com/dznugshvp/image/upload/v1751083141/github-images/airfryer.webp"
    },
    {
      "file": "blender.webp",
      "url": "https://res.cloudinary.com/dznugshvp/image/upload/v1751083141/github-images/blender.webp"
    },
    {
      "file": "fan.jpg",
      "url": "https://res.cloudinary.com/dznugshvp/image/upload/v1751083142/github-images/fan.jpg"
    }
  ]
}
```

---

## Environment Variables Required

| Variable                  | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| `CLOUDINARY_CLOUD_NAME`   | Your Cloudinary cloud name                                                       |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                                                               |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                                                            |
| `GITHUB_OWNER`            | GitHub repo owner (username/org)                                                 |
| `GITHUB_REPO`             | GitHub repo name                                                                 |
| `GITHUB_TOKEN` (optional) | GitHub Personal Access Token, if accessing private repos or to avoid rate limits |

---

## Notes

- You can replace the GitHub image source with other DAM solutions like Bynder, LucidLink, or Salsify by modifying the fetch logic.
- Images are resized and converted to WebP **during upload** to optimize storage and delivery.
- Ensure you have the proper permissions and tokens set in your environment variables.

---

## License

MIT © Justin Abercrombia

---

Feel free to customize or extend this script to fit your project needs!
