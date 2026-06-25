const CATEGORY_ALIASES = {
    "curtains-and-accessories": [
        "curtains-and-accessories",
        "curtains",
        "curtain",
        "Curtains and Accessories",
        "Curtains & Accessories"
    ],
    "window-blinds": [
        "window-blinds",
        "blinds",
        "Window Blinds"
    ],
    "pvc-wooden-window-blinds": [
        "pvc-wooden-window-blinds",
        "pvc wooden window blinds",
        "PVC & Wooden Window Blinds"
    ],
    "home-decor-wallpaper-stickers": [
        "home-decor-wallpaper-stickers",
        "wallpaper",
        "wallpapers",
        "Wallpaper & Wall Coverings",
        "Home Decor Wallpaper"
    ],
    "artificial-grass-plant-vertical-garden": [
        "artificial-grass-plant-vertical-garden",
        "artificial-grass",
        "artificial grass",
        "Artificial Grass Plant Vertical Garden"
    ],
    "pvc-flooring": [
        "pvc-flooring",
        "flooring",
        "PVC Flooring"
    ]
};

const canonicalCategoryByAlias = Object.entries(CATEGORY_ALIASES).reduce((acc, [canonical, aliases]) => {
    aliases.forEach(alias => {
        acc[String(alias).toLowerCase()] = canonical;
    });
    return acc;
}, {});

export const getCategoryQueryValues = (category) => {
    if (!category) return [];
    return CATEGORY_ALIASES[category] || [category];
};

export const toCanonicalCategory = (category) => {
    if (!category) return category;
    return canonicalCategoryByAlias[String(category).toLowerCase()] || category;
};

export const toCanonicalSubcategory = (category, subcategory) => {
    if (
        toCanonicalCategory(category) === "artificial-grass-plant-vertical-garden" &&
        subcategory === "artificial-grass"
    ) {
        return "lawn-grass";
    }

    return subcategory;
};
