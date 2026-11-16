// ==========================================
// KARIX — SUPABASE CONNECTION
// ==========================================

const karixClient = window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    )
    : null;


// ==========================================
// INITIAL KARIAKOO FIELD RESEARCH
// Fallback data if Supabase is unavailable
// ==========================================

const streets = [
    {
        id: 1,
        name: "Magila",
        categories: ["Clothing", "Computers", "Cameras", "Electronics", "Generators", "Speakers", "Laptops"]
    },
    {
        id: 2,
        name: "Sikukuu",
        categories: ["Plumbing", "Kitchen wares", "Construction", "Paints", "Car accessories", "Safety equipment"]
    },
    {
        id: 3,
        name: "Aggrey",
        categories: ["Electronics", "Mobile accessories", "Appliances", "Computers", "Phones", "Spare parts"]
    },
    {
        id: 4,
        name: "Masasi",
        categories: ["Electronics", "Stationery", "Computers", "Phone accessories", "Printing", "Photography"]
    },
    {
        id: 5,
        name: "Ndanda",
        categories: ["Subwoofers", "Fans", "Fridges", "Furniture", "Speakers", "Televisions"]
    },
    {
        id: 6,
        name: "Likoma",
        categories: ["Phone accessories", "Repairs", "Electronics", "Solar", "Televisions", "Packaging", "Clothing", "Textiles"]
    }
];

let allStreets = [...streets];
let karixStreetMap = null;
let karixStreetMarkers = [];

const LANGUAGE_STORAGE_KEY = "karix-language-preference";
const DEFAULT_LANGUAGE = "en";
let currentLanguage = DEFAULT_LANGUAGE;

const languageTranslations = {
    en: {
        navExplore: "Explore",
        navAbout: "About",
        navContribute: "Contribute",
        navJoin: "Join KariX",
        searchPlaceholder: "Search products, streets or categories...",
        searchHint: "Explore Kariakoo street by street.",
        heroEyebrow: "THE DIGITAL GUIDE TO KARIAKOO",
        heroTitle: "Find what you're looking for",
        heroTitleAccent: "in Kariakoo.",
        heroDescription: "Discover streets, wholesalers, shops and products across one of Dar es Salaam's busiest commercial centres.",
        emptyMessage: "No matching streets found. Try another search.",
        exploreStreet: "Explore street →",
        backToStreets: "← Back to streets",
        streetExplore: "Explore Kariakoo",
        streetExplorerStatus: "Street-level discovery · Shop inventory not yet verified",
        streetCategories: "Categories associated with this street",
        streetObservations: "Products and items observed on this street",
        verifiedBusinesses: "Verified businesses on this street",
        noStreetObservations: "No street-level observations have been recorded yet.",
        noRelatedProducts: "No related catalogue products have been added yet.",
        noVerifiedBusinesses: "No verified businesses have been registered on this street yet. Know a shop here? Help KariX discover it.",
        explorerProductNote: "These products belong to the KariX catalogue and are associated with this street's recorded categories. Their availability in individual shops has not been confirmed.",
        observationNote: "These are street-level observations. Availability in individual shops has not been verified.",
        relatedStreets: "Relevant streets to explore:",
        relatedStreetNote: "Based on street-level observations. Shop stock is not yet verified.",
        searchResultsLabel: "Search results",
        searchResultsEmpty: "No matching products, categories, streets or verified businesses found.",
        searchResultStreet: "Street",
        languageToggle: "Kiswahili",
        streetAccess: "Street access & navigation",
        noAccessPoints: "No verified access points have been recorded for this street yet.",
        accessPointMap: "Location map",
        navigateDriving: "Navigate by car / motorcycle",
        navigateWalking: "Walking directions"
    },
    sw: {
        navExplore: "Chunguza",
        navAbout: "Kuhusu",
        navContribute: "Changia",
        navJoin: "Jiunge na KariX",
        searchPlaceholder: "Tafuta bidhaa, mitaa au aina...",
        searchHint: "Chunguza Kariakoo kwa kila barabara.",
        heroEyebrow: "MWONGOZO WA DIGITALLY WA KARIAKOO",
        heroTitle: "Pata unachotafuta",
        heroTitleAccent: "katika Kariakoo.",
        heroDescription: "Gundua mitaa, wauzaji wakubwa, maduka na bidhaa katika mojawapo ya maeneo ya biashara yenye shughuli nyingi zaidi Dar es Salaam.",
        emptyMessage: "Hakuna barabara zinazolingana. Jaribu utafutaji mwingine.",
        exploreStreet: "Chunguza mtaa →",
        backToStreets: "← Rudi kwenye mitaa",
        streetExplore: "Chunguza Kariakoo",
        streetExplorerStatus: "Ugunduzi wa barabara · Hifadhi ya duka haijathibitishwa",
        streetCategories: "Aina zinazohusiana na barabara hii",
        streetObservations: "Bidhaa na vitu vilivyotambuliwa kwenye barabara hii",
        verifiedBusinesses: "Biashara zilizoidhinishwa kwenye barabara hii",
        noStreetObservations: "Hakuna uchunguzi wa barabara uliorekodiwa bado.",
        noRelatedProducts: "Hakuna bidhaa za katalogi zinazohusiana zilizoongezwa bado.",
        noVerifiedBusinesses: "Hakuna biashara zilizoidhinishwa zilizojazwa kwenye barabara hii bado. Unajua duka hapa? Saidia KariX kuigundua.",
        explorerProductNote: "Bidhaa hizi ni za katalogi ya KariX na zinahusiana na kategoria zilizorekodiwa kwenye barabara hii. Upatikanaji wa bidhaa kwenye maduka binafsi haujathibitishwa.",
        observationNote: "Hizi ni maelezo ya kiwango cha barabara. Upatikanaji kwenye maduka binafsi haujathibitishwa.",
        relatedStreets: "Mitaa husika ya kuchunguza:",
        relatedStreetNote: "Kulingana na uchunguzi wa barabara. Hifadhi ya duka haijathibitishwa.",
        searchResultsLabel: "Matokeo ya utafutaji",
        searchResultsEmpty: "Hakuna bidhaa, kategoria, mitaa au biashara zilizoidhinishwa zinazolingana.",
        searchResultStreet: "Mtaa",
        languageToggle: "English",
        streetAccess: "Njia za kuingia na urambazaji",
        noAccessPoints: "Hakuna sehemu za kuingilia zilizothibitishwa kwenye mtaa huu bado.",
        accessPointMap: "Ramani ya eneo",
        navigateDriving: "Elekeza kwa gari / pikipiki",
        navigateWalking: "Maelekezo ya kutembea kwa miguu"
    }
};

function normalizeLanguage(lang) {
    return lang === "sw" ? "sw" : "en";
}

function getTranslation(key, fallback = "") {
    const languageData = languageTranslations[currentLanguage] || languageTranslations.en;
    return languageData[key] || fallback || languageTranslations.en[key] || "";
}

function getLocalizedValue(record, preferredFields, fallback = "") {
    const fieldList = Array.isArray(preferredFields) ? preferredFields : [preferredFields];

    for (const fieldName of fieldList) {
        const value = record && record[fieldName];
        if (typeof value === "string" && value.trim()) return value;
        if (Array.isArray(value) && value.length) return value;
    }

    return fallback;
}

function getStreetDisplayName(street) {
    if (!street) return "";

    const streetName = getLocalizedValue(
        street,
        currentLanguage === "sw"
            ? ["street_name_sw", "name_sw", "street_name_en", "name_en", "street_name", "name"]
            : ["street_name_en", "name_en", "street_name_sw", "name_sw", "street_name", "name"],
        street.name || ""
    );

    return streetName || street.name || "";
}

function isCommercialCorridor(street) {
    const name = getStreetDisplayName(street).trim();
    return name === "Morogoro Road" || name === "Kigogo Road";
}

function getStreetTitleText(street) {
    const name = getStreetDisplayName(street);

    if (!name) return "";

    if (isCommercialCorridor(street)) {
        return name;
    }

    return currentLanguage === "sw"
        ? `mtaa wa ${name}`
        : `${name} Street`;
}

function getStreetDisplayDescription(street) {
    if (!street) return "";

    return getLocalizedValue(
        street,
        currentLanguage === "sw"
            ? ["description_sw", "description", "description_en"]
            : ["description_en", "description", "description_sw"],
        street.description || ""
    );
}

function getStreetSearchText(street) {
    if (!street) return "";

    const nameValues = [
        street.name,
        street.name_en,
        street.name_sw,
        street.street_name,
        street.street_name_en,
        street.street_name_sw,
        getStreetDisplayName(street)
    ].filter(Boolean);

    const descriptionValues = [
        street.description,
        street.description_en,
        street.description_sw
    ].filter(Boolean);

    const categoryValues = (street.categories || []).flatMap(category => [
        category,
        category?.category_name,
        category?.category_name_en,
        category?.category_name_sw
    ]).filter(Boolean);

    const itemValues = (getStreetObservations(street.id) || [])
        .flatMap(observation => [
            ...(observation.observed_items || []),
            ...(observation.observed_items_sw || []),
            observation.category_name,
            observation.category_name_sw,
            observation.area_label,
            observation.area_label_sw
        ])
        .filter(Boolean);

    return [...new Set([...nameValues, ...descriptionValues, ...categoryValues, ...itemValues])]
        .join(" ")
        .toLowerCase();
}

function setLanguagePreference(lang) {
    currentLanguage = normalizeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);

    const languageToggle = document.getElementById("languageToggle");
    if (languageToggle) {
        languageToggle.textContent = getTranslation("languageToggle");
        languageToggle.setAttribute(
            "aria-label",
            currentLanguage === "en" ? "Switch language to Kiswahili" : "Switch language to English"
        );
    }

    const navLinks = document.querySelectorAll(".navbar nav a");
    if (navLinks[0]) navLinks[0].textContent = getTranslation("navExplore");
    if (navLinks[1]) navLinks[1].textContent = getTranslation("navAbout");
    if (navLinks[2]) navLinks[2].textContent = getTranslation("navContribute");

    const navJoinButton = document.querySelector(".nav-button");
    if (navJoinButton) navJoinButton.textContent = getTranslation("navJoin");

    const heroEyebrow = document.querySelector(".hero .eyebrow");
    if (heroEyebrow) heroEyebrow.textContent = getTranslation("heroEyebrow");

    const heroHeading = document.querySelector(".hero h1");
    if (heroHeading) {
        const title = getTranslation("heroTitle");
        const accent = getTranslation("heroTitleAccent");
        heroHeading.innerHTML = `${title}<span> ${accent}</span>`;
    }

    const heroDescription = document.querySelector(".hero-description");
    if (heroDescription) heroDescription.textContent = getTranslation("heroDescription");

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.placeholder = getTranslation("searchPlaceholder");

    const searchHint = document.querySelector(".search-hint");
    if (searchHint) searchHint.textContent = getTranslation("searchHint");

    const searchResultsLabel = document.querySelector(".search-results-label");
    if (searchResultsLabel) searchResultsLabel.textContent = getTranslation("searchResultsLabel");

    if (emptyMessage) emptyMessage.textContent = getTranslation("emptyMessage");

    if (allStreets.length) {
        displayStreets(allStreets);
    }

    if (searchInput && searchInput.value.trim()) {
        runSearch();
    }
}

// ==========================================
// DATABASE-DRIVEN STREET DISCOVERY
// Replaces hardcoded streetDiscoveryRules
// ==========================================

let streetObservations = [];

async function loadStreetObservations() {
    if (!karixClient) {
        console.error("Supabase unavailable: observations not loaded.");
        streetObservations = [];
        return [];
    }

    const { data, error } = await karixClient
        .from("street_observations")
        .select(`
            observation_id,
            street_id,
            area_label,
            area_label_sw,
            category_name,
            category_name_sw,
            observed_items,
            observed_items_sw,
            verification_status
        `)
        .limit(2000);

    if (error) {
        console.error("Street observations loading error:", error.message);
        streetObservations = [];
        return [];
    }

    streetObservations = data || [];
    return streetObservations;
}

// Find streets associated with a category.
function getRelevantStreets(categoryName) {
    if (!categoryName) return [];

    const matchingStreetIds = new Set(
        streetObservations
            .filter(observation =>
                observation.category_name?.toLowerCase() ===
                categoryName.toLowerCase()
            )
            .map(observation => observation.street_id)
    );

    return allStreets.filter(street =>
        matchingStreetIds.has(street.id)
    );
}

// Get categories recorded for a particular street.
function getStreetCategories(streetId) {
    const categories = streetObservations
        .filter(observation => observation.street_id === streetId)
        .map(observation => observation.category_name);

    return [...new Set(categories)].sort();
}

// Get observations recorded for a particular street.
function getStreetObservations(streetId) {
    return streetObservations.filter(
        observation => observation.street_id === streetId
    );
}


// ==========================================
// KARIX STREET EXPLORER
// ==========================================

let streetExplorerElement = null;

function createStreetExplorer() {
    const section = document.createElement("section");
    section.className = "street-explorer";
    section.hidden = true;

    const backButton = document.createElement("button");
    backButton.className = "explorer-back";
    backButton.textContent = getTranslation("backToStreets");
    backButton.addEventListener("click", closeStreetExplorer);

    const content = document.createElement("div");
    content.id = "streetExplorerContent";

    section.append(backButton, content);

    const streetsSection = document.querySelector(".streets-section");

    if (!streetsSection) {
        console.error("Street section not found.");
        return null;
    }

    streetsSection.appendChild(section);

    return section;
}

function closeStreetExplorer() {
    const streetsSection = document.querySelector(".streets-section");

    if (!streetsSection) return;

    const heading = streetsSection.querySelector(".section-heading");

    if (heading) heading.style.display = "";

    if (streetGrid) streetGrid.style.display = "";

    if (emptyMessage) emptyMessage.style.display = "";

    if (streetExplorerElement) {
        streetExplorerElement.hidden = true;
    }

    displayStreets(allStreets);

    streetsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function addExplorerMessage(container, message) {
    const paragraph = document.createElement("p");
    paragraph.className = "explorer-empty";
    paragraph.textContent = message;
    container.appendChild(paragraph);
}

// ==========================================
// KARIX STREET ACCESS & NAVIGATION
// ==========================================

async function loadStreetAccessPoints(streetId, content) {
    const existingBlocks = content.querySelectorAll(".explorer-access-block");
    if (existingBlocks.length) {
        existingBlocks.forEach(block => block.remove());
    }

    const accessBlock = document.createElement("div");
    accessBlock.className = "explorer-block explorer-access-block";

    const heading = document.createElement("h3");
    heading.textContent = getTranslation("streetAccess");

    accessBlock.appendChild(heading);

    const accessList = document.createElement("div");
    accessList.className = "explorer-access-list";

    const mapContainer = document.createElement("div");
    mapContainer.className = "explorer-map-container";

    accessBlock.append(mapContainer, accessList);

    const status = content.querySelector(".explorer-status");

    if (status) {
        status.after(accessBlock);
    } else {
        content.appendChild(accessBlock);
    }

    if (!karixClient) {
        addExplorerMessage(
            accessList,
            getTranslation("noAccessPoints")
        );
        return;
    }

    const { data, error } = await karixClient
        .from("street_access_points")
        .select(`
            access_point_id,
            access_point_name,
            access_point_type,
            latitude,
            longitude,
            directions_en,
            directions_sw
        `)
        .eq("street_id", streetId)
        .eq("is_active", true)
        .eq("verification_status", "verified");

    if (content.dataset.streetId !== String(streetId)) {
        return;
    }

    if (error) {
        console.error("Street access loading error:", error.message);

        addExplorerMessage(
            accessList,
            getTranslation("noAccessPoints")
        );

        return;
    }

    const accessPoints = data || [];

    if (!accessPoints.length) {
        addExplorerMessage(
            accessList,
            getTranslation("noAccessPoints")
        );
        return;
    }

    function showAccessPointOnMap(point) {
        const latitude = Number(point.latitude);
        const longitude = Number(point.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
        }

        const mapFrame = document.createElement("iframe");

        mapFrame.className = "explorer-map-frame";
        mapFrame.src =
            `https://maps.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`;

        mapFrame.title = getTranslation("accessPointMap");
        mapFrame.loading = "lazy";
        mapFrame.referrerPolicy = "no-referrer-when-downgrade";

        mapFrame.setAttribute("allowfullscreen", "");
        mapFrame.setAttribute("aria-label", getTranslation("accessPointMap"));

        mapContainer.replaceChildren(mapFrame);
    }

    accessPoints.forEach((point, index) => {
        const latitude = Number(point.latitude);
        const longitude = Number(point.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
        }

        const card = document.createElement("article");
        card.className = "explorer-access-point";

        const name = document.createElement("strong");
        name.textContent = point.access_point_name;

        const directions = document.createElement("p");
        directions.textContent = currentLanguage === "sw"
            ? point.directions_sw || point.directions_en || ""
            : point.directions_en || point.directions_sw || "";

        const mapButton = document.createElement("button");
        mapButton.type = "button";
        mapButton.className = "explorer-map-button";
        mapButton.textContent = getTranslation("accessPointMap");

        mapButton.addEventListener("click", () => {
            showAccessPointOnMap(point);
        });

        const actions = document.createElement("div");
        actions.className = "explorer-navigation-actions";

        const destination = `${latitude},${longitude}`;

        const drivingLink = document.createElement("a");
        drivingLink.href =
            `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        drivingLink.target = "_blank";
        drivingLink.rel = "noopener noreferrer";
        drivingLink.textContent = getTranslation("navigateDriving");

        const walkingLink = document.createElement("a");
        walkingLink.href =
            `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
        walkingLink.target = "_blank";
        walkingLink.rel = "noopener noreferrer";
        walkingLink.textContent = getTranslation("navigateWalking");

        actions.append(drivingLink, walkingLink);

        card.append(name, directions, mapButton, actions);
        accessList.appendChild(card);

        if (index === 0) {
            showAccessPointOnMap(point);
        }
    });

    if (!accessList.children.length) {
        addExplorerMessage(
            accessList,
            getTranslation("noAccessPoints")
        );
    }
}

async function openStreetExplorer(street) {
    const streetsSection = document.querySelector(".streets-section");

    if (!streetsSection) return;

    if (!streetExplorerElement) {
        streetExplorerElement = createStreetExplorer();
    }

    if (!streetExplorerElement) return;

    const heading = streetsSection.querySelector(".section-heading");

    if (heading) heading.style.display = "none";

    if (streetGrid) streetGrid.style.display = "none";

    if (emptyMessage) emptyMessage.style.display = "none";

    streetExplorerElement.hidden = false;

    const content = document.getElementById("streetExplorerContent");

    content.innerHTML = "";
    content.dataset.streetId = String(street.id);

    const eyebrow = document.createElement("p");
    eyebrow.className = "explorer-eyebrow";
    eyebrow.textContent = getTranslation("streetExplore");

    const title = document.createElement("h2");
    title.className = "explorer-title";
    title.textContent = getStreetTitleText(street);

    const description = document.createElement("p");
    description.className = "explorer-description";
    description.textContent =
        getStreetDisplayDescription(street) ||
        "Explore products and categories associated with this street.";

    const status = document.createElement("span");
    status.className = "explorer-status";
    status.textContent = getTranslation("streetExplorerStatus");

    content.append(eyebrow, title, description, status);

    loadStreetAccessPoints(street.id, content);

    const observations = getStreetObservations(street.id);

    const categories = getStreetCategories(street.id);

    const categoryBlock = document.createElement("div");
    categoryBlock.className = "explorer-block";

    const categoryHeading = document.createElement("h3");
    categoryHeading.textContent = getTranslation("streetCategories");

    const categoryList = document.createElement("div");
    categoryList.className = "explorer-category-list";

    categories.forEach(category => {
        const chip = document.createElement("span");
        chip.className = "explorer-category";

        const matchingObservation = observations.find(
            observation =>
                observation.category_name === category
        );

        chip.textContent = currentLanguage === "sw"
            ? matchingObservation?.category_name_sw || category
            : category;

        categoryList.appendChild(chip);
    });

    categoryBlock.append(categoryHeading, categoryList);
    content.appendChild(categoryBlock);

    const observationBlock = document.createElement("div");
    observationBlock.className = "explorer-block";

    const observationHeading = document.createElement("h3");
    observationHeading.textContent = getTranslation("streetObservations");

    const observationList = document.createElement("div");
    observationList.className = "explorer-category-list";

    observations.forEach(observation => {
        const items = currentLanguage === "sw"
            ? (observation.observed_items_sw?.length
                ? observation.observed_items_sw
                : observation.observed_items || [])
            : observation.observed_items || [];

        items.forEach(productName => {
            const chip = document.createElement("span");
            chip.className = "explorer-category";
            chip.textContent = productName;
            observationList.appendChild(chip);
        });
    });

    observationBlock.append(observationHeading, observationList);

    const observationNote = document.createElement("p");
    observationNote.className = "explorer-note";
    observationNote.textContent = getTranslation("observationNote");

    observationBlock.appendChild(observationNote);
    content.appendChild(observationBlock);

    if (!observations.length) {
        addExplorerMessage(
            observationList,
            getTranslation("noStreetObservations")
        );
    }

    const productBlock = document.createElement("div");
    productBlock.className = "explorer-block";

    const productHeading = document.createElement("h3");
    productHeading.textContent = currentLanguage === "sw" ? "Bidhaa za katalogi zinazohusiana" : "Related catalogue products";

    const productGrid = document.createElement("div");
    productGrid.className = "explorer-product-grid";

    productBlock.append(productHeading, productGrid);
    content.appendChild(productBlock);

    const businessBlock = document.createElement("div");
    businessBlock.className = "explorer-block";

    const businessHeading = document.createElement("h3");
    businessHeading.textContent = getTranslation("verifiedBusinesses");

    const businessList = document.createElement("div");
    businessList.className = "explorer-business-list";

    businessBlock.append(businessHeading, businessList);
    content.appendChild(businessBlock);

    if (!karixClient) {
        addExplorerMessage(
            productGrid,
            getTranslation("noRelatedProducts")
        );
        addExplorerMessage(
            businessList,
            getTranslation("noVerifiedBusinesses")
        );
        return;
    }

    const [productResponse, businessResponse] = await Promise.all([
        karixClient
            .from("products")
            .select(`
                product_id,
                product_name,
                brand,
                description,
                categories (
                    category_name
                )
            `)
            .eq("is_active", true),

        karixClient
            .from("businesses")
            .select(`
                business_id,
                business_name,
                description,
                shop_number,
                floor,
                status,
                claim_status
            `)
            .eq("street_id", street.id)
            .eq("is_published", true)
    ]);

    if (content.dataset.streetId && content.dataset.streetId !== String(street.id)) {
        return;
    }

    if (productResponse.error) {
        console.error("Explorer product error:", productResponse.error.message);

        addExplorerMessage(
            productGrid,
            getTranslation("noRelatedProducts")
        );
    } else {
        const relatedProducts = (productResponse.data || []).filter(product => {
            const category = Array.isArray(product.categories)
                ? product.categories[0]?.category_name
                : product.categories?.category_name;

            return categories.includes(category);
        });

        if (!relatedProducts.length) {
            addExplorerMessage(
                productGrid,
                "No related catalogue products have been added yet."
            );
        }

        relatedProducts.forEach(product => {
            const card = document.createElement("div");
            card.className = "explorer-product";

            const name = document.createElement("strong");
            name.textContent = product.product_name;

            const brand = document.createElement("small");
            brand.textContent = product.brand || "KariX catalogue product";

            card.append(name, brand);
            productGrid.appendChild(card);
        });
    }

    const productNote = document.createElement("p");
    productNote.className = "explorer-note";
    productNote.textContent = getTranslation("explorerProductNote");

    productBlock.appendChild(productNote);

    if (businessResponse.error) {
        console.error("Explorer business error:", businessResponse.error.message);

        addExplorerMessage(
            businessList,
            getTranslation("noVerifiedBusinesses")
        );
    } else {
        const businesses = businessResponse.data || [];

        if (!businesses.length) {
            addExplorerMessage(
                businessList,
                "No verified businesses have been registered on this street yet. Know a shop here? Help KariX discover it."
            );
        }

        businesses.forEach(business => {
            const card = document.createElement("div");
            card.className = "explorer-business";

            const name = document.createElement("strong");
            name.textContent = business.business_name;

            const details = document.createElement("small");
            const publicationStatus = document.createElement("small");
            publicationStatus.className = "business-publication-status";
            publicationStatus.textContent = business.status === "verified"
                ? "Verified business"
                : business.claim_status === "claimed"
                    ? "Trader-managed · Verification pending"
                    : "Community submitted · Unclaimed";

            const location = [
                business.shop_number ? "Shop " + business.shop_number : "",
                business.floor ? "Floor " + business.floor : ""
            ].filter(Boolean).join(" · ");

            details.textContent =
                [location, business.description].filter(Boolean).join(" · ") ||
                "Verified Kariakoo business";

            card.append(name, details, publicationStatus);
            businessList.appendChild(card);
        });
    }

    streetsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// HTML ELEMENTS
// ==========================================

const streetGrid = document.getElementById("streetGrid");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const emptyMessage = document.getElementById("emptyMessage");
const searchResults = document.getElementById("searchResults");
const searchResultsList = document.getElementById("searchResultsList");


// ==========================================
// LOAD STREETS
// ==========================================

async function loadStreetsFromSupabase() {
    if (!karixClient) {
        console.error("Supabase client unavailable.");
        return streets;
    }

    const pageSize = 30;
    let allData = [];
    let from = 0;

    while (true) {
        const { data, error } = await karixClient
            .from("streets")
            .select("street_id, street_name, description, description_sw, status, is_published, latitude, longitude")
            .eq("is_published", true)
            .order("street_name")
            .range(from, from + pageSize - 1);

        if (error) {
            console.error("Street loading error:", error.message);
            return streets;
        }

        if (!data || data.length === 0) {
            break;
        }

        allData = allData.concat(data);

        if (data.length < pageSize) {
            break;
        }

        from += pageSize;
    }

    console.log("Total streets fetched from Supabase:", allData.length);

    return allData.map(street => ({
        id: street.street_id,
        name: street.street_name,
        description: street.description || "",
        description_sw: street.description_sw || "",
        status: street.status,
        latitude: street.latitude ?? null,
        longitude: street.longitude ?? null,
        categories: []
    }));
}

function getStreetCoordinates(street) {
    if (!street) return null;

    const latitude = Number(street.latitude ?? street.lat ?? street.location_lat ?? street.street_latitude);
    const longitude = Number(street.longitude ?? street.lng ?? street.location_lng ?? street.street_longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return [latitude, longitude];
}

function renderStreetMapMarkers() {
    const mapElement = document.getElementById("kariakooMap");

    if (!mapElement || typeof window.L === "undefined") {
        return;
    }

    if (!karixStreetMap) {
        karixStreetMap = window.L.map("kariakooMap", {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([-6.8205, 39.2745], 14);

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(karixStreetMap);
    }

    karixStreetMarkers.forEach(marker => marker.remove());
    karixStreetMarkers = [];

    const plottedStreets = allStreets.filter(street => getStreetCoordinates(street));

    plottedStreets.forEach(street => {
        const coordinates = getStreetCoordinates(street);
        if (!coordinates) return;

        const marker = window.L.marker(coordinates).addTo(karixStreetMap);

        const popupHtml = `
            <div style="min-width: 150px;">
                <strong>${getStreetTitleText(street)}</strong><br>
                <button
                    type="button"
                    class="map-marker-button"
                    data-street-id="${street.id}"
                    style="margin-top: 8px; background:#203b52; color:#fff; border:none; border-radius:8px; padding:7px 10px; cursor:pointer;"
                >
                    Explore street
                </button>
            </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on("popupopen", () => {
            const button = document.querySelector(`.map-marker-button[data-street-id="${street.id}"]`);
            if (button) {
                button.addEventListener("click", () => {
                    openStreetExplorer(street);
                });
            }
        });

        karixStreetMarkers.push(marker);
    });

    if (karixStreetMarkers.length) {
        const markerBounds = window.L.featureGroup(karixStreetMarkers).getBounds();
        karixStreetMap.fitBounds(markerBounds.pad(0.22));
    }
}


// ==========================================
// DISPLAY STREET CARDS
// ==========================================

function displayStreets(streetList) {
    if (!streetGrid || !emptyMessage) return;

    streetGrid.innerHTML = "";
    emptyMessage.hidden = streetList.length > 0;

    streetList.forEach((street, index) => {
        const card = document.createElement("article");
        card.className = "street-card";

        const number = document.createElement("div");
        number.className = "street-number";
        number.textContent = String(index + 1).padStart(2, "0");

        const title = document.createElement("h3");
        title.textContent = getStreetTitleText(street);

        const description = document.createElement("p");
        description.textContent =
            getStreetDisplayDescription(street) ||
            (street.categories || []).slice(0, 4).join(" · ") ||
            "Explore Kariakoo.";

        const link = document.createElement("a");
        link.className = "explore-link";
        link.href = "#";
        link.textContent = getTranslation("exploreStreet");

        link.addEventListener("click", event => {
            event.preventDefault();
            openStreetExplorer(street);
        });

        card.append(number, title, description, link);
        streetGrid.appendChild(card);
    });
}


// ==========================================
// FILTER STREET CARDS
// ==========================================

function searchStreets(query) {
    const term = query.toLowerCase();

    const results = allStreets.filter(street => {
        const searchableText = getStreetSearchText(street);
        return searchableText.includes(term);
    });

    displayStreets(results);
}


// ==========================================
// SEARCH SUPABASE TABLES
// ==========================================

async function runSupabaseSearch(query) {
    if (!karixClient || !query) return [];

    const term = `%${query}%`;

    const results = [];

    // 1. SEARCH PRODUCTS
    const productRequest = karixClient
        .from("products")
        .select(`
            product_id,
            product_name,
            brand,
            model_number,
            description,
            categories (
                category_name
            )
        `)
        .eq("is_active", true)
        .ilike("product_name", term)
        .limit(8);

    // 2. SEARCH CATEGORIES
    const categoryRequest = karixClient
        .from("categories")
        .select("category_id, category_name, description")
        .eq("is_active", true)
        .ilike("category_name", term)
        .limit(8);

    // 3. SEARCH STREETS
    const streetRequest = karixClient
        .from("streets")
        .select("street_id, street_name, description")
        .eq("is_published", true)
        .ilike("street_name", term)
        .limit(8);

    // 4. SEARCH VERIFIED BUSINESSES
    const businessRequest = karixClient
        .from("businesses")
        .select("business_id, business_name, description, status, claim_status")
        .eq("is_published", true)
        .ilike("business_name", term)
        .limit(8);

    const [
        productResponse,
        categoryResponse,
        streetResponse,
        businessResponse
    ] = await Promise.all([
        productRequest,
        categoryRequest,
        streetRequest,
        businessRequest
    ]);

    // PRODUCTS
    if (productResponse.error) {
        console.error("Product search:", productResponse.error.message);
    } else {
        (productResponse.data || []).forEach(product => {
            const category = Array.isArray(product.categories)
                ? product.categories[0]?.category_name
                : product.categories?.category_name;

            results.push({
                type: "Product",
                title: product.product_name,
                description: [
                    category,
                    product.brand,
                    product.description
                ].filter(Boolean).join(" · "),
                relatedStreets: getRelevantStreets(category)
            });
        });
    }

    // STREET-LEVEL OBSERVATIONS
    const matchingObservations = streetObservations.filter(observation => {
        const itemMatches = (observation.observed_items || []).some(item =>
            item.toLowerCase().includes(query.toLowerCase())
        );

        const categoryMatches =
            observation.category_name?.toLowerCase().includes(query.toLowerCase());

        return itemMatches || categoryMatches;
    });

    matchingObservations.forEach(observation => {
        const street = allStreets.find(
            item => item.id === observation.street_id
        );

        if (!street) return;

        const matchingItems = (observation.observed_items || []).filter(item =>
            item.toLowerCase().includes(query.toLowerCase())
        );

        results.push({
            type: "Street Observation",
            title: getStreetTitleText(street),
            description: [
                observation.area_label,
                observation.category_name,
                matchingItems.length
                    ? matchingItems.join(", ")
                    : observation.observed_items.join(", ")
            ].filter(Boolean).join(" · "),
            streetId: street.id,
            verificationStatus: observation.verification_status
        });
    });

    // CATEGORIES
    if (categoryResponse.error) {
        console.error("Category search:", categoryResponse.error.message);
    } else {
        (categoryResponse.data || []).forEach(category => {
            results.push({
                type: "Category",
                title: category.category_name,
                description: category.description || "Explore this product category."
            });
        });
    }

    // STREETS
    if (streetResponse.error) {
        console.error("Street search:", streetResponse.error.message);
    } else {
        (streetResponse.data || []).forEach(street => {
            const displayStreet = {
                id: street.street_id,
                name: street.street_name,
                description: street.description || "",
                street_name: street.street_name
            };

            results.push({
                type: "Street",
                title: getStreetTitleText(displayStreet),
                description: street.description || "Explore this Kariakoo street."
            });
        });
    }

    // PUBLISHED BUSINESSES
    if (businessResponse.error) {
        console.error("Business search:", businessResponse.error.message);
    } else {
        (businessResponse.data || []).forEach(business => {
            results.push({
                type: "Business",
                title: business.business_name,
                description: [
                    business.description,
                    business.status === "verified" ? "Verified"
                        : business.claim_status === "claimed"
                            ? "Trader-managed · verification pending"
                            : "Community submitted · unclaimed"
                ].filter(Boolean).join(" · ")
            });
        });
    }

    return results.slice(0, 12);
}


// ==========================================
// DISPLAY SEARCH RESULTS
// ==========================================

function renderSearchResults(results) {
    if (!searchResults || !searchResultsList) return;

    searchResultsList.innerHTML = "";

    if (!results.length) {
        const message = document.createElement("p");
        message.className = "search-empty";
    message.textContent = getTranslation("searchResultsEmpty");
        searchResults.hidden = false;
        return;
    }

    results.forEach(result => {
        const item = document.createElement("div");
        item.className = "search-result-item";

        const tag = document.createElement("span");
        tag.className = "search-result-tag";

        const isRoadResult = result.type === "Street" &&
            (result.title === "Morogoro Road" || result.title === "Kigogo Road");

        tag.textContent = isRoadResult
            ? "Commercial corridor"
            : result.type === "Street"
                ? getTranslation("searchResultStreet")
                : result.type;

        const title = document.createElement("strong");
        title.textContent = result.title;

        const description = document.createElement("small");
        description.textContent = result.description;

        item.append(tag, title, description);

        if (
            result.type === "Street" ||
            result.type === "Street Observation"
        ) {
            const matchingStreet = allStreets.find(street =>
                street.id === result.streetId ||
                street.name.toLowerCase() ===
                    result.title.replace(/ Street$/i, "").toLowerCase()
            );

            if (matchingStreet) {
                item.classList.add("search-result-clickable");
                item.addEventListener("click", () => {
                    openStreetExplorer(matchingStreet);
                });
            }
        }

        // Show relevant streets for product results.
        if (result.type === "Product" && result.relatedStreets?.length) {
            const streetSection = document.createElement("div");
            streetSection.className = "related-streets";

            const heading = document.createElement("strong");
            heading.textContent = getTranslation("relatedStreets");

            streetSection.appendChild(heading);

            result.relatedStreets.forEach(street => {
                const streetLink = document.createElement("p");
                streetLink.textContent = getStreetTitleText(street);
                streetSection.appendChild(streetLink);
            });

            const note = document.createElement("small");
            note.textContent = getTranslation("relatedStreetNote");

            streetSection.appendChild(note);
            item.appendChild(streetSection);
        }

        searchResultsList.appendChild(item);
    });

    searchResults.hidden = false;
}


// ==========================================
// MAIN SEARCH
// ==========================================

let searchTimer = null;
let searchNumber = 0;

async function runSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        searchNumber++;

        if (searchResults) {
            searchResults.hidden = true;
        }

        displayStreets(allStreets);
        return;
    }

    searchStreets(query);

    const currentSearch = ++searchNumber;

    try {
        const results = await runSupabaseSearch(query);

        // Ignore older responses if a newer search has started.
        if (currentSearch !== searchNumber) return;

        renderSearchResults(results);

    } catch (error) {
        console.error("Search failed:", error);
    }
}


// ==========================================
// SEARCH EVENTS
// ==========================================

if (searchButton) {
    searchButton.addEventListener("click", runSearch);
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(runSearch, 300);
    });

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            clearTimeout(searchTimer);
            runSearch();
        }
    });
}


// ==========================================
// AUTHENTICATION FLOW
// ==========================================

const authSection = document.getElementById("authSection");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSwitch = document.getElementById("authSwitch");
const registerSwitch = document.getElementById("registerSwitch");
const accountStatus = document.getElementById("accountStatus");
const accountStatusText = document.getElementById("accountStatusText");
const logoutButton = document.getElementById("logoutButton");
const businessSubmission = document.getElementById("businessSubmission");
const businessForm = document.getElementById("businessForm");
const businessFormMessage = document.getElementById("businessFormMessage");
const businessStreetSelect = document.getElementById("businessStreet");
const traderDashboard = document.getElementById("traderDashboard");
const traderBusinessList = document.getElementById("traderBusinessList");
const businessClaimForm = document.getElementById("businessClaimForm");
const claimBusinessSelect = document.getElementById("claimBusinessSelect");
const claimFormMessage = document.getElementById("claimFormMessage");
const myBusinessClaims = document.getElementById("myBusinessClaims");
let traderProductCatalog = [];
let currentTraderUserId = null;

function setAuthMessage(message, isError = false) {
    if (!authMessage) return;

    authMessage.textContent = message || "";
    authMessage.style.color = isError ? "#8d2a2a" : "#203b52";
}

function setAuthMode(mode) {
    const isRegister = mode === "register";

    if (registerForm) registerForm.hidden = !isRegister;
    if (loginForm) loginForm.hidden = isRegister;

    if (authTitle) {
        authTitle.textContent = isRegister
            ? "Become a KariX contributor"
            : "Log in to KariX";
    }

    if (authDescription) {
        authDescription.textContent = isRegister
            ? "Help document Kariakoo businesses, products and streets."
            : "Manage your contributor account and status.";
    }

    if (authSwitch) authSwitch.hidden = !isRegister;
    if (registerSwitch) registerSwitch.hidden = isRegister;
}

function openAuthPanel(mode = "register") {
    if (!authSection) return;

    authSection.hidden = false;
    setAuthMode(mode);
    setAuthMessage("");
}

function closeAuthPanel() {
    if (!authSection) return;

    authSection.hidden = true;
    setAuthMessage("");
}

async function fetchContributorProfile(userId) {
    if (!karixClient || !userId) return null;

    const { data, error } = await karixClient
        .from("contributors")
        .select("contributor_id, display_name, role, status")
        .eq("contributor_id", userId)
        .maybeSingle();

    if (error) {
        console.error("Contributor profile fetch failed:", error.message);
        return null;
    }

    return data || null;
}

async function updateAccountStatus() {
    if (!karixClient || !accountStatus || !accountStatusText) return;
    const { data: { user }, error } = await karixClient.auth.getUser();

    if (error || !user) {
        accountStatus.hidden = true;
        if (businessSubmission) businessSubmission.hidden = true;
        return;
    }

    if (!user.email_confirmed_at) {
        accountStatusText.textContent = "Please confirm your email address before submitting or managing business profiles.";
        accountStatus.hidden = false;
        if (businessSubmission) businessSubmission.hidden = true;
        return;
    }

    accountStatusText.textContent = "Your KariX account is ready. Register your own shop or publish a community-discovered business. Community submissions are public immediately and remain unclaimed until the trader claims them.";
    accountStatus.hidden = false;
    if (businessSubmission) businessSubmission.hidden = false;
    if (traderDashboard) traderDashboard.hidden = false;
    populateBusinessStreetOptions();
    await loadTraderDashboard(user.id);
}

async function handleRegisterSubmit(event) {
    event.preventDefault();

    if (!karixClient) {
        setAuthMessage("Supabase is not available right now.", true);
        return;
    }

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!name || !email || !password) {
        setAuthMessage("Please complete all registration fields.", true);
        return;
    }

    try {
        const { data, error } = await karixClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) throw error;

        if (data?.user && !data.session) {
            registerForm.reset();
            setAuthMessage(
                "Account created. Please confirm your email address, then log in to publish business profiles.",
                false
            );
            setAuthMode("login");
            return;
        }

        if (data?.session) {
            registerForm.reset();
            setAuthMessage(
                "Account created. Your KariX account is ready. You can now publish business profiles.",
                false
            );
            await updateAccountStatus();
        }
    } catch (error) {
        console.error("Registration failed:", error);
        setAuthMessage(error.message || "Registration failed. Please try again.", true);
    }
}

function setBusinessFormMessage(message, isError = false) {
    if (!businessFormMessage) return;
    businessFormMessage.textContent = message || "";
    businessFormMessage.style.color = isError ? "#8d2a2a" : "#203b52";
}

function populateBusinessStreetOptions() {
    if (!businessStreetSelect) return;
    const selected = businessStreetSelect.value;
    businessStreetSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a published Kariakoo street";
    businessStreetSelect.appendChild(placeholder);
    allStreets.forEach(street => {
        if (!street?.id || !street?.name) return;
        const option = document.createElement("option");
        option.value = street.id;
        option.textContent = street.name;
        businessStreetSelect.appendChild(option);
    });
    if (selected) businessStreetSelect.value = selected;
}


function setClaimMessage(message, isError = false) {
    if (!claimFormMessage) return;
    claimFormMessage.textContent = message || "";
    claimFormMessage.style.color = isError ? "#8d2a2a" : "#203b52";
}

function renderTraderBusinesses(rows) {
    if (!traderBusinessList) return;
    traderBusinessList.replaceChildren();

    if (!rows?.length) {
        traderBusinessList.textContent = "You do not manage any businesses yet. Register your own shop above or claim an existing listing.";
        return;
    }

    rows.forEach(row => {
        const business = row.businesses;
        if (!business) return;

        const card = document.createElement("article");
        card.className = "trader-business-card";

        const heading = document.createElement("h4");
        heading.textContent = business.business_name;
        const role = document.createElement("p");
        role.textContent = "Your role: " + row.role + " · " +
            (business.status === "verified" ? "Verified" : "Verification pending");

        const form = document.createElement("form");
        form.className = "trader-business-edit-form";
        form.dataset.businessId = business.business_id;

        const fields = [
            ["Business name", "business_name", business.business_name || "", "input"],
            ["Description", "description", business.description || "", "textarea"],
            ["Business phone", "phone", business.phone || "", "input"],
            ["WhatsApp", "whatsapp", business.whatsapp || "", "input"],
            ["Website", "website", business.website || "", "input"],
            ["Shop number", "shop_number", business.shop_number || "", "input"],
            ["Floor", "floor", business.floor || "", "input"],
            ["Opening hours", "opening_hours", business.opening_hours || "", "input"]
        ];

        fields.forEach(([labelText, field, value, type]) => {
            const label = document.createElement("label");
            label.textContent = labelText;
            const control = document.createElement(type === "textarea" ? "textarea" : "input");
            control.name = field;
            control.value = value;
            if (type === "textarea") control.rows = 2;
            form.append(label, control);
        });

        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = "Save business details";
        form.appendChild(save);

        const message = document.createElement("p");
        message.className = "trader-business-message";
        message.setAttribute("role", "status");
        form.appendChild(message);

        form.addEventListener("submit", async event => {
            event.preventDefault();
            save.disabled = true;
            message.textContent = "Saving...";
            const payload = {};
            fields.forEach(([, field]) => {
                payload[field] = form.elements[field].value.trim() || null;
            });
            try {
                const { error } = await karixClient.from("businesses")
                    .update(payload)
                    .eq("business_id", business.business_id);
                if (error) throw error;
                message.textContent = "Business details saved.";
            } catch (error) {
                console.error("Business update failed:", error);
                message.textContent = error.message || "Could not save business details.";
            } finally {
                save.disabled = false;
            }
        });

        card.append(heading, role, form);
        traderBusinessList.appendChild(card);
    });
}

async function loadTraderDashboard(userId) {
    if (!karixClient || !userId) return;

    if (traderBusinessList) traderBusinessList.textContent = "Loading your businesses...";
    const { data: memberships, error } = await karixClient
        .from("business_memberships")
        .select("membership_id, role, businesses(business_id, business_name, description, phone, whatsapp, website, shop_number, floor, opening_hours, status)")
        .eq("user_id", userId)
        .eq("status", "active");

    if (error) {
        console.error("Trader business load failed:", error);
        if (traderBusinessList) traderBusinessList.textContent =
            "Could not load your businesses. Confirm the KariX business-autonomy database migration has been applied.";
    } else {
        currentTraderUserId = userId;
        await loadTraderProductCatalog();
        renderTraderBusinesses(memberships || []);
    }

    await loadClaimableBusinesses();
    await loadMyBusinessClaims(userId);
}

async function loadClaimableBusinesses() {
    if (!karixClient || !claimBusinessSelect) return;
    claimBusinessSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose an unclaimed business";
    claimBusinessSelect.appendChild(placeholder);

    const { data, error } = await karixClient.from("businesses")
        .select("business_id, business_name, shop_number, floor")
        .eq("is_published", true)
        .eq("claim_status", "unclaimed")
        .order("business_name")
        .limit(500);

    if (error) {
        console.error("Claimable businesses load failed:", error);
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Could not load listings. Database migration may not be applied.";
        claimBusinessSelect.appendChild(option);
        return;
    }

    (data || []).forEach(business => {
        const option = document.createElement("option");
        option.value = business.business_id;
        option.textContent = [
            business.business_name,
            business.shop_number ? "Shop " + business.shop_number : "",
            business.floor ? "Floor " + business.floor : ""
        ].filter(Boolean).join(" · ");
        claimBusinessSelect.appendChild(option);
    });
}

async function loadMyBusinessClaims(userId) {
    if (!karixClient || !myBusinessClaims) return;
    myBusinessClaims.textContent = "Loading claims...";
    const { data, error } = await karixClient.from("business_claims")
        .select("claim_id, status, review_notes, created_at, businesses(business_name)")
        .eq("claimant_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Business claims load failed:", error);
        myBusinessClaims.textContent = "Could not load ownership claims.";
        return;
    }

    myBusinessClaims.replaceChildren();
    if (!data?.length) {
        myBusinessClaims.textContent = "You have not submitted any ownership claims.";
        return;
    }

    data.forEach(claim => {
        const item = document.createElement("p");
        const businessName = claim.businesses?.business_name || "Business";
        item.textContent = businessName + " — " + claim.status.replace("_", " ") +
            (claim.review_notes ? " · " + claim.review_notes : "");
        myBusinessClaims.appendChild(item);
    });
}

async function handleBusinessClaimSubmit(event) {
    event.preventDefault();
    if (!karixClient) return setClaimMessage("KariX is temporarily unavailable.", true);

    const { data: { user }, error: userError } = await karixClient.auth.getUser();
    if (userError || !user || !user.email_confirmed_at) {
        return setClaimMessage("Log in with a confirmed email address before claiming a business.", true);
    }

    const businessId = claimBusinessSelect?.value;
    const evidenceText = document.getElementById("claimEvidence").value.trim();
    if (!businessId || !evidenceText) {
        return setClaimMessage("Choose a business and explain how KariX can verify your connection to it.", true);
    }

    const button = document.getElementById("claimBusinessButton");
    if (button) button.disabled = true;
    setClaimMessage("Submitting ownership claim...");
    try {
        const { error } = await karixClient.from("business_claims").insert({
            business_id: businessId,
            claimant_id: user.id,
            evidence: { explanation: evidenceText },
            status: "pending"
        });
        if (error) throw error;
        businessClaimForm.reset();
        setClaimMessage("Claim submitted. The business remains publicly visible, but ownership changes only after KariX verifies your claim.");
        await loadMyBusinessClaims(user.id);
    } catch (error) {
        console.error("Business claim failed:", error);
        setClaimMessage(error.message || "Could not submit the ownership claim.", true);
    } finally {
        if (button) button.disabled = false;
    }
}

async function handleBusinessSubmit(event) {
    event.preventDefault();
    if (!karixClient) return setBusinessFormMessage("KariX is temporarily unavailable.", true);

    const { data: { user }, error: userError } = await karixClient.auth.getUser();
    if (userError || !user || !user.email_confirmed_at) {
        return setBusinessFormMessage("Log in with a confirmed email address before publishing a business.", true);
    }

    const source = document.getElementById("businessSubmissionType").value;
    const name = document.getElementById("businessName").value.trim();
    const streetId = businessStreetSelect?.value;
    if (!name || !streetId) return setBusinessFormMessage("Enter the business name and choose its street.", true);

    const payload = {
        business_name: name,
        street_id: streetId,
        business_type: document.getElementById("businessType").value,
        shop_number: document.getElementById("businessShopNumber").value.trim() || null,
        floor: document.getElementById("businessFloor").value.trim() || null,
        phone: document.getElementById("businessPhone").value.trim() || null,
        description: document.getElementById("businessDescription").value.trim() || null,
        created_by: user.id,
        status: "pending",
        is_published: true,
        submission_source: source,
        claim_status: source === "trader" ? "claimed" : "unclaimed"
    };

    const button = document.getElementById("businessSubmitButton");
    if (button) button.disabled = true;
    setBusinessFormMessage("Publishing business profile...");
    try {
        const { data, error } = await karixClient.from("businesses")
            .insert(payload)
            .select("business_id, business_name")
            .single();
        if (error) throw error;

        businessForm.reset();
        populateBusinessStreetOptions();
        setBusinessFormMessage(source === "trader"
            ? "Your business is public. Your account has automatically received owner access. Verification is still pending."
            : "The business is public as a community-submitted, unclaimed profile. The trader can claim it later.");
        console.log("Published KariX business:", data?.business_id);
    } catch (error) {
        console.error("Business publishing failed:", error);
        setBusinessFormMessage(error.message || "Could not publish this business.", true);
    } finally {
        if (button) button.disabled = false;
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    if (!karixClient) {
        setAuthMessage("Supabase is not available right now.", true);
        return;
    }

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        setAuthMessage("Please enter your email and password.", true);
        return;
    }

    try {
        const { data, error } = await karixClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        if (data?.session) {
            setAuthMessage("Logged in successfully.");
            await updateAccountStatus();
        }
    } catch (error) {
        console.error("Login failed:", error);
        setAuthMessage(error.message || "Login failed. Please try again.", true);
    }
}

async function handleLogout() {
    if (!karixClient) return;

    try {
        const { error } = await karixClient.auth.signOut();

        if (error) throw error;

        if (accountStatus) accountStatus.hidden = true;
        setAuthMessage("You have been logged out.");
    } catch (error) {
        console.error("Logout failed:", error);
        setAuthMessage("Logout failed. Please try again.", true);
    }
}

if (document.getElementById("openRegister")) {
    document.getElementById("openRegister").addEventListener("click", () => {
        openAuthPanel("register");
    });
}

const navJoinButton = document.querySelector(".nav-button");
if (navJoinButton) {
    navJoinButton.addEventListener("click", event => {
        event.preventDefault();
        openAuthPanel("register");
    });
}

if (document.getElementById("closeAuth")) {
    document.getElementById("closeAuth").addEventListener("click", closeAuthPanel);
}

if (document.getElementById("showLogin")) {
    document.getElementById("showLogin").addEventListener("click", () => {
        setAuthMode("login");
        setAuthMessage("");
    });
}

if (document.getElementById("showRegister")) {
    document.getElementById("showRegister").addEventListener("click", () => {
        setAuthMode("register");
        setAuthMessage("");
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
}

if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
}
if (businessForm) {
    businessForm.addEventListener("submit", handleBusinessSubmit);
}
if (businessClaimForm) {
    businessClaimForm.addEventListener("submit", handleBusinessClaimSubmit);
}

if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
}

if (karixClient && karixClient.auth) {
    karixClient.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            await updateAccountStatus();
            if (authSection && !authSection.hidden) {
                setAuthMode("login");
                setAuthMessage("Logged in successfully.");
            }
        } else if (accountStatus) {
            accountStatus.hidden = true;
            if (businessSubmission) businessSubmission.hidden = true;
            if (traderDashboard) traderDashboard.hidden = true;
        }
    });
}


// ==========================================
// INITIALIZE KARIX
// ==========================================

async function initializeKariX() {
    allStreets = await loadStreetsFromSupabase();

    // Load street observations before displaying discovery results.
    await loadStreetObservations();

    displayStreets(allStreets);
    renderStreetMapMarkers();

    if (searchResults) {
        searchResults.hidden = true;
    }

    console.log("KariX initialized successfully.");
    console.log("Streets loaded:", allStreets.length);
    console.log("Street observations loaded:", streetObservations.length);
}

const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
currentLanguage = normalizeLanguage(storedLanguage);

const languageToggle = document.getElementById("languageToggle");
if (languageToggle) {
    languageToggle.addEventListener("click", () => {
        const nextLanguage = currentLanguage === "en" ? "sw" : "en";
        setLanguagePreference(nextLanguage);
    });
}

initializeKariX();

if (document.readyState === "complete") {
    setLanguagePreference(currentLanguage);
} else {
    window.addEventListener("load", () => setLanguagePreference(currentLanguage));
}