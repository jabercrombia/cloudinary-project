import axios from 'axios';
import cloudinary from 'cloudinary';

export const config = {
 schedule: '*/10 * * * *',
};

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function uploadImageFromUrl(url: string, publicId: string) {
  return new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
    axios({
      url,
      method: 'GET',
      responseType: 'stream',
    }).then(response => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: 'github-images', public_id: publicId },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );
      response.data.pipe(uploadStream);
    }).catch(reject);
  });
}

export async function GET() {
  try {
    const githubResponse = await axios.get(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/images`,
      {
        headers: {
          // Optional: add GitHub token here if you hit rate limits
          // Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    type GitHubFile = {
      name: string;
      download_url: string;
      type: string;
    };

    const files: GitHubFile[] = githubResponse.data;

    // Filter image files by extension
    const imageFiles = files.filter(
      (file) =>
        file.type === 'file' &&
        /\.(jpe?g|png|gif|webp)$/i.test(file.name)
    );

    const uploadResults: { file: string; url: string }[] = [];

    for (const file of imageFiles) {
      const rawUrl = file.download_url;
      const publicId = file.name.replace(/\.[^/.]+$/, '');

      try {
        const result = await uploadImageFromUrl(rawUrl, publicId);
        uploadResults.push({ file: file.name, url: result.secure_url });
        console.log(`Uploaded ${file.name} → ${result.secure_url}`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, (error as Error).message);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Upload complete',
        uploaded: uploadResults,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
