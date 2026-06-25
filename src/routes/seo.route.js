import { Router } from "express";
import { Product } from "../models/product.model.js";
import {
    SITE_URL,
    SITEMAP_LIMIT,
    absoluteUrl,
    blockedRobotsPaths,
    getCategoryEntries,
    getProductEntries,
    publicStaticRoutes,
    sitemapIndexXml,
    sitemapXml,
    textResponse,
    urlEntry,
    xmlResponse
} from "../utils/seo.js";

const router = Router();

router.get("/robots.txt", async (req, res) => {
    const lines = [
        "User-agent: *",
        "Allow: /",
        ...blockedRobotsPaths.map(path => `Disallow: ${path}`),
        "",
        `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
        `Host: ${SITE_URL}`
    ];

    return textResponse(res, lines.join("\n"));
});

router.get("/sitemap.xml", async (req, res) => {
    const productCount = await Product.countDocuments({ isActive: true, "seo.noIndex": { $ne: true } });

    if (productCount > SITEMAP_LIMIT) {
        const productSitemapCount = Math.ceil(productCount / SITEMAP_LIMIT);
        const indexEntries = [
            { loc: absoluteUrl("/sitemap-static.xml"), lastmod: new Date() },
            ...Array.from({ length: productSitemapCount }, (_, index) => ({
                loc: absoluteUrl(`/sitemap-products-${index + 1}.xml`),
                lastmod: new Date()
            }))
        ];

        return xmlResponse(res, sitemapIndexXml(indexEntries));
    }

    const entries = [
        ...publicStaticRoutes.map(route => urlEntry({
            loc: absoluteUrl(route.path),
            lastmod: new Date(),
            changefreq: route.changefreq,
            priority: route.priority
        })),
        ...getCategoryEntries(),
        ...(await getProductEntries())
    ];

    return xmlResponse(res, sitemapXml(entries));
});

router.get("/sitemap-static.xml", async (req, res) => {
    const entries = [
        ...publicStaticRoutes.map(route => urlEntry({
            loc: absoluteUrl(route.path),
            lastmod: new Date(),
            changefreq: route.changefreq,
            priority: route.priority
        })),
        ...getCategoryEntries()
    ];

    return xmlResponse(res, sitemapXml(entries));
});

router.get("/sitemap-products-:page.xml", async (req, res) => {
    const page = Math.max(Number(req.params.page || 1), 1);
    const entries = await getProductEntries({ page });

    return xmlResponse(res, sitemapXml(entries));
});

export default router;
