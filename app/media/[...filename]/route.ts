import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    // Next.js 15 always passes route params as a promise.
    { params }: { params: Promise<{ filename: string[] }> }
) {
    try {
        const resolvedParams = await params;
        const filename = resolvedParams.filename;

        if (!filename || filename.length === 0) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Sanitize the filename to prevent directory traversal
        const safePath = path.normalize(filename.join("/")).replace(/^(\.\.(\/|\\|$))+/, "");

        // Resolve the path to the media directory at the root of the project
        const mediaPath = path.resolve(process.cwd(), "media", safePath);

        const fileStat = await fs.stat(mediaPath);
        if (!fileStat.isFile()) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Determine basic content type
        const ext = path.extname(mediaPath).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".png") contentType = "image/png";
        else if (ext === ".webp") contentType = "image/webp";
        else if (ext === ".avif") contentType = "image/avif";
        else if (ext === ".svg") contentType = "image/svg+xml";
        else if (ext === ".gif") contentType = "image/gif";
        else if (ext === ".mp4") contentType = "video/mp4";

        const fileBuffer = await fs.readFile(mediaPath);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new NextResponse(fileBuffer as any, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        return new NextResponse("Not Found", { status: 404 });
    }
}
