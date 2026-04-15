import axios from "axios";

export interface ScrapedImages {
  heroImage: string | null;
  images: string[];
}

/**
 * Scrapes a website URL and returns usable image URLs.
 * Returns CDN-accessible images from the prospect's website.
 */
export async function scrapeWebsiteImages(url: string): Promise<ScrapedImages> {
  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    
    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 15000,
    });

    const html: string = response.data;
    const baseUrl = new URL(normalizedUrl);
    
    // Extract all image src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const bgRegex = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    
    const rawUrls: string[] = [];
    
    // OG image first (usually the best hero)
    let match;
    while ((match = ogImageRegex.exec(html)) !== null) {
      rawUrls.unshift(match[1]);
    }
    
    while ((match = imgRegex.exec(html)) !== null) {
      rawUrls.push(match[1]);
    }
    
    while ((match = bgRegex.exec(html)) !== null) {
      rawUrls.push(match[1]);
    }

    // Resolve relative URLs and filter
    const resolvedUrls: string[] = [];
    const seen = new Set<string>();
    
    for (const raw of rawUrls) {
      try {
        let resolved = raw;
        if (raw.startsWith("//")) {
          resolved = `https:${raw}`;
        } else if (raw.startsWith("/")) {
          resolved = `${baseUrl.protocol}//${baseUrl.host}${raw}`;
        } else if (!raw.startsWith("http")) {
          resolved = `${baseUrl.protocol}//${baseUrl.host}/${raw}`;
        }
        
        // Filter out tiny images, icons, logos, tracking pixels
        if (
          !seen.has(resolved) &&
          !resolved.includes("logo") &&
          !resolved.includes("icon") &&
          !resolved.includes("favicon") &&
          !resolved.includes("pixel") &&
          !resolved.includes("tracking") &&
          !resolved.includes("1x1") &&
          !resolved.includes("avatar") &&
          (resolved.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i) ||
           resolved.includes("cdn") ||
           resolved.includes("images") ||
           resolved.includes("media") ||
           resolved.includes("uploads"))
        ) {
          seen.add(resolved);
          resolvedUrls.push(resolved);
        }
      } catch {
        // skip invalid URLs
      }
    }

    // Verify images are actually accessible (check first 8)
    const verifiedUrls: string[] = [];
    const toCheck = resolvedUrls.slice(0, 12);
    
    await Promise.allSettled(
      toCheck.map(async (imgUrl) => {
        try {
          const headRes = await axios.head(imgUrl, { timeout: 5000 });
          const contentType = headRes.headers["content-type"] || "";
          const contentLength = parseInt(headRes.headers["content-length"] || "0");
          if (contentType.includes("image") && contentLength > 10000) {
            verifiedUrls.push(imgUrl);
          }
        } catch {
          // not accessible
        }
      })
    );

    return {
      heroImage: verifiedUrls[0] || null,
      images: verifiedUrls.slice(0, 6),
    };
  } catch (error) {
    console.error("[Scraper] Failed to scrape:", url, error);
    return { heroImage: null, images: [] };
  }
}
