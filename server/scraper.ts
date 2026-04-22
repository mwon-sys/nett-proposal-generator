import axios from "axios";

export interface ScrapedImages {
  heroImage: string | null;
  images: string[];
}

/**
 * Scrapes a website URL and returns usable image URLs.
 * Prioritizes product/lifestyle photos over logos and icons.
 * Checks multiple pages to find the best images.
 */
export async function scrapeWebsiteImages(url: string): Promise<ScrapedImages> {
  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const baseUrl = new URL(normalizedUrl);

    // Fetch multiple pages to get more images
    const pagesToScrape = [normalizedUrl];
    const subpages = ["/about", "/shop", "/menu", "/products", "/gallery", "/services", "/order"];
    for (const sub of subpages.slice(0, 3)) {
      pagesToScrape.push(`${baseUrl.protocol}//${baseUrl.host}${sub}`);
    }

    const allRawUrls: string[] = [];

    for (const pageUrl of pagesToScrape) {
      try {
        const response = await axios.get(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          },
          timeout: 10000,
        });
        const html: string = response.data;

        // OG image first (usually the best hero)
        const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
        let match;
        while ((match = ogImageRegex.exec(html)) !== null) {
          allRawUrls.unshift(match[1]);
        }

        // Extract img src
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        while ((match = imgRegex.exec(html)) !== null) {
          allRawUrls.push(match[1]);
        }

        // Extract background images
        const bgRegex = /background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
        while ((match = bgRegex.exec(html)) !== null) {
          allRawUrls.push(match[1]);
        }
      } catch {
        // Skip pages that fail to load
      }
    }

    // Keywords that indicate a logo, icon, banner-with-text, or non-photo asset — skip these
    const badKeywords = [
      "logo", "icon", "favicon", "pixel", "tracking", "1x1", "avatar",
      "badge", "button", "arrow", "sprite", "placeholder",
      "white%402x", "White%402x", "white@2x", "White@2x",
      "CDPrimary", "cdprimary", "Primary+Logo", "primary+logo",
      "-logo-", "_logo_", "/logo/", "logo.", "logotype",
      // Banner/promotional images that typically have text overlaid
      "_delivered", "-delivered", "_banner", "-banner", "banner_",
      "_slide", "-slide", "slide_", "slideshow",
      "_hero_text", "hero-text", "_text_", "-text-",
      "_promo", "-promo", "promo_",
      "_sale", "-sale", "sale_",
      "_offer", "-offer",
      "_ad_", "-ad-",
      "header_bg", "header-bg",
    ];

    // Resolve relative URLs and apply smart filtering
    const resolvedUrls: string[] = [];
    const seen = new Set<string>();

    for (const raw of allRawUrls) {
      try {
        let resolved = raw;
        if (raw.startsWith("//")) {
          resolved = `https:${raw}`;
        } else if (raw.startsWith("/")) {
          resolved = `${baseUrl.protocol}//${baseUrl.host}${raw}`;
        } else if (!raw.startsWith("http")) {
          resolved = `${baseUrl.protocol}//${baseUrl.host}/${raw}`;
        }

        const lowerResolved = resolved.toLowerCase();

        // Skip if it contains bad keywords
        if (badKeywords.some(kw => lowerResolved.includes(kw.toLowerCase()))) {
          continue;
        }

        // Must be an image file or from a known image CDN
        const isImageUrl =
          resolved.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i) ||
          lowerResolved.includes("squarespace-cdn") ||
          lowerResolved.includes("cloudinary") ||
          lowerResolved.includes("imgix") ||
          lowerResolved.includes("shopify") ||
          lowerResolved.includes("wixstatic") ||
          lowerResolved.includes("amazonaws") ||
          lowerResolved.includes("cdn") ||
          lowerResolved.includes("images") ||
          lowerResolved.includes("media") ||
          lowerResolved.includes("uploads");

        if (!seen.has(resolved) && isImageUrl) {
          seen.add(resolved);
          resolvedUrls.push(resolved);
        }
      } catch {
        // skip invalid URLs
      }
    }

    // Verify images are accessible AND large enough to be real photos (not tiny icons)
    const verifiedUrls: string[] = [];
    const toCheck = resolvedUrls.slice(0, 25);

    await Promise.allSettled(
      toCheck.map(async (imgUrl) => {
        try {
          const headRes = await axios.head(imgUrl, {
            timeout: 5000,
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
          });
          const contentType = headRes.headers["content-type"] || "";
          const contentLength = parseInt(headRes.headers["content-length"] || "0");
          // Must be an image and at least 40KB (filters out logos, icons, tiny graphics)
          if (contentType.includes("image") && contentLength > 40000) {
            verifiedUrls.push(imgUrl);
          }
        } catch {
          // not accessible
        }
      })
    );

    const uniqueVerified = Array.from(new Set(verifiedUrls));

    return {
      heroImage: uniqueVerified[0] || null,
      images: uniqueVerified.slice(0, 6),
    };
  } catch (error) {
    console.error("[Scraper] Failed to scrape:", url, error);
    return { heroImage: null, images: [] };
  }
}
