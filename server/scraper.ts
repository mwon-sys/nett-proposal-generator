import axios from "axios";

export interface ScrapedImages {
  heroImage: string | null;
  images: string[];
}

/**
 * Upgrades Shopify CDN image URLs to request full-resolution images.
 * Shopify appends ?width=NNN or &width=NNN to serve resized images.
 * We strip or increase the width parameter to get the full-size version.
 */
function upgradeShopifyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only touch Shopify CDN URLs
    if (!parsed.hostname.includes("shopify") && !parsed.pathname.includes("cdn/shop")) {
      return url;
    }
    // Remove width/height resize params to get the original full-res image
    parsed.searchParams.delete("width");
    parsed.searchParams.delete("height");
    parsed.searchParams.delete("crop");
    // If the URL had a ?v= version param, keep it (it's a cache buster, not a resize param)
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Estimates whether an image URL is likely landscape-oriented based on URL hints.
 * Shopify and some CDNs encode dimensions in the filename (e.g. _800x600.jpg).
 * Returns: 1 = likely landscape, 0 = unknown, -1 = likely portrait/square
 */
function estimateOrientation(url: string): number {
  // Look for WxH patterns in the URL (e.g. 1200x800, 800x600)
  const dimMatch = url.match(/[_-](\d{3,4})x(\d{3,4})[_.\-]/);
  if (dimMatch) {
    const w = parseInt(dimMatch[1]);
    const h = parseInt(dimMatch[2]);
    if (w > h * 1.2) return 1;   // clearly landscape
    if (h > w * 1.2) return -1;  // clearly portrait
    return 0;                     // roughly square
  }
  return 0; // unknown
}

/**
 * Scrapes a website URL and returns usable image URLs.
 * Prioritizes product/lifestyle photos over logos and icons.
 * Checks multiple pages to find the best images.
 * Prefers landscape images for hero/campaign/goals slots.
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
      // CTA buttons and UI elements that appear as image assets
      "shop-now", "shop_now", "shopnow",
      "buy-now", "buy_now", "buynow",
      "add-to-cart", "add_to_cart",
      "learn-more", "learn_more",
      "get-started", "get_started",
      "sign-up", "sign_up",
      "cta-", "-cta",
      "btn-", "-btn",
      "checkout", "subscribe",
    ];

    // Resolve relative URLs, upgrade Shopify URLs, and apply smart filtering
    const resolvedUrls: string[] = [];
    const seen = new Set<string>();

    for (const raw of allRawUrls) {
      try {
        let resolved = raw;
        // Step 1: resolve relative URLs first
        if (resolved.startsWith("//")) {
          resolved = `https:${resolved}`;
        } else if (resolved.startsWith("/")) {
          resolved = `${baseUrl.protocol}//${baseUrl.host}${resolved}`;
        } else if (!resolved.startsWith("http")) {
          resolved = `${baseUrl.protocol}//${baseUrl.host}/${resolved}`;
        }

        // Step 2: decode all HTML/URL encoding variants of & so query params parse correctly
        // Handles: &amp; &amp%3B &amp%3b %26amp%3B and plain %26
        resolved = resolved
          .replace(/&amp%3[Bb]/g, "&")   // &amp%3B → &
          .replace(/%26amp%3[Bb]/g, "&") // %26amp%3B → &
          .replace(/&amp;/gi, "&")        // &amp; → &
          .replace(/%26/g, "&");          // %26 → &

        // Upgrade Shopify URLs to full resolution before deduplication
        resolved = upgradeShopifyUrl(resolved);

        const lowerResolved = resolved.toLowerCase();

        // Skip if it contains bad keywords
        if (badKeywords.some(kw => lowerResolved.includes(kw.toLowerCase()))) {
          continue;
        }

        // Must be an image file or from a known image CDN
        const isImageUrl =
          resolved.match(/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i) ||
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
    const verifiedUrls: Array<{ url: string; orientation: number }> = [];
    const toCheck = resolvedUrls.slice(0, 30); // check a few more to find landscape options

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
            verifiedUrls.push({ url: imgUrl, orientation: estimateOrientation(imgUrl) });
          }
        } catch {
          // not accessible
        }
      })
    );

    // Sort: landscape images first (orientation=1), then unknown (0), then portrait (-1)
    // This is a stable soft-sort — landscape is preferred but portrait is still used if needed
    const sorted = verifiedUrls.sort((a, b) => b.orientation - a.orientation);
    const uniqueVerified = Array.from(
      new Map(sorted.map(item => [item.url, item])).values()
    ).map(item => item.url);

    return {
      heroImage: uniqueVerified[0] || null,
      images: uniqueVerified.slice(0, 6),
    };
  } catch (error) {
    console.error("[Scraper] Failed to scrape:", url, error);
    return { heroImage: null, images: [] };
  }
}
