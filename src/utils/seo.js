import { Product } from "../models/product.model.js";
import { toCanonicalCategory, toCanonicalSubcategory } from "./categoryAliases.js";

export const SITE_URL = (process.env.SITE_URL || process.env.FRONTEND_URL || "https://www.signaturedrapes.in").replace(/\/+$/, "");
export const SITEMAP_LIMIT = Number(process.env.SITEMAP_LIMIT || 45000);

export const publicStaticRoutes = [
    { path: "/", priority: 1, changefreq: "daily" },
    { path: "/products", priority: 0.9, changefreq: "daily" },
    { path: "/gallery", priority: 0.7, changefreq: "weekly" },
    { path: "/about", priority: 0.6, changefreq: "monthly" },
    { path: "/contact", priority: 0.6, changefreq: "monthly" },
    { path: "/faq", priority: 0.5, changefreq: "monthly" },
    { path: "/privacy", priority: 0.3, changefreq: "yearly" },
    { path: "/terms", priority: 0.3, changefreq: "yearly" }
];

export const blockedRobotsPaths = [
    "/admin",
    "/login",
    "/register",
    "/verify-otp",
    "/verify-email-otp",
    "/verify-email",
    "/resend-verification",
    "/forgot-password",
    "/reset-password",
    "/cart",
    "/checkout",
    "/payment",
    "/account",
    "/profile",
    "/wishlist",
    "/orders",
    "/my-orders",
    "/search",
    "/api/"
];

export const absoluteUrl = (path = "/") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_URL}${normalizedPath}`;
};

export const escapeXml = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const xmlResponse = (res, xml) => {
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
    return res.status(200).send(xml);
};

export const textResponse = (res, text) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
    return res.status(200).send(text);
};

export const formatLastmod = (date) => {
    const parsed = date ? new Date(date) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export const urlEntry = ({ loc, lastmod, changefreq = "weekly", priority = 0.5 }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(formatLastmod(lastmod))}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;

export const sitemapXml = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

export const sitemapIndexXml = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(formatLastmod(entry.lastmod))}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;

export const getCategoryEntries = async () => {
    const categories = Product.getAllCategoriesWithSubcategories();
    const stats = await Product.aggregate([
        { $match: { isActive: true, "seo.noIndex": { $ne: true } } },
        {
            $group: {
                _id: { category: "$category", subcategory: "$subcategory" },
                count: { $sum: 1 },
                lastmod: { $max: "$updatedAt" }
            }
        }
    ]);

    const categoryStats = new Map();
    const subcategoryStats = new Map();

    stats.forEach(stat => {
        const categoryId = toCanonicalCategory(stat._id?.category);
        const subcategoryId = toCanonicalSubcategory(categoryId, stat._id?.subcategory);
        if (!categoryId || !categories[categoryId]) return;

        const existingCategory = categoryStats.get(categoryId);
        categoryStats.set(categoryId, {
            count: (existingCategory?.count || 0) + stat.count,
            lastmod: existingCategory?.lastmod && existingCategory.lastmod > stat.lastmod
                ? existingCategory.lastmod
                : stat.lastmod
        });

        if (subcategoryId) {
            subcategoryStats.set(`${categoryId}:${subcategoryId}`, {
                count: stat.count,
                lastmod: stat.lastmod
            });
        }
    });

    return Object.entries(categories).flatMap(([categoryId, category]) => {
        const categoryStat = categoryStats.get(categoryId);

        return [
            urlEntry({
                loc: absoluteUrl(`/category/${categoryId}`),
                lastmod: categoryStat?.lastmod || new Date(),
                changefreq: "weekly",
                priority: 0.8
            }),
            ...(category.subcategories || []).flatMap(subcategory => {
                const subcategoryStat = subcategoryStats.get(`${categoryId}:${subcategory.id}`);

                return urlEntry({
                    loc: absoluteUrl(`/category/${categoryId}?subcategory=${encodeURIComponent(subcategory.id)}`),
                    lastmod: subcategoryStat?.lastmod || categoryStat?.lastmod || new Date(),
                    changefreq: "weekly",
                    priority: 0.7
                });
            })
        ];
    });
};

export const getProductPath = (product) => {
    return `/product/${product.slug || product._id}`;
};

export const getProductEntries = async ({ page = 1, limit = SITEMAP_LIMIT } = {}) => {
    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find({ isActive: true, "seo.noIndex": { $ne: true } })
        .select("name productCode slug updatedAt createdAt")
        .sort({ updatedAt: -1, _id: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

    return products.map(product => urlEntry({
        loc: absoluteUrl(getProductPath(product)),
        lastmod: product.updatedAt || product.createdAt,
        changefreq: "weekly",
        priority: 0.8
    }));
};
