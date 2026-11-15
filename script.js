// CONNECT KARIX TO SUPABASE
const karixClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

/* ==================================
   KARIX FRONTEND
   Street discovery and search
================================== */

// Initial Kariakoo field research.
// These are street-level observations,
// not verified individual shop listings.

const streets = [
    {
        id: 1,
        name: "Magila",
        categories: [
            "Clothing",
            "Computers",
            "Cameras",
            "Electronics",
            "Generators",
            "Speakers",
            "Laptops"
        ]
    },
    {
        id: 2,
        name: "Sikukuu",
        categories: [
            "Plumbing",
            "Kitchen wares",
            "Construction",
            "Paints",
            "Car accessories",
            "Safety equipment"
        ]
    },
    {
        id: 3,
        name: "Aggrey",
        categories: [
            "Electronics",
            "Mobile accessories",
            "Appliances",
            "Computers",
            "Phones",
            "Spare parts"
        ]
    },
    {
        id: 4,
        name: "Masasi",
        categories: [
            "Electronics",
            "Stationery",
            "Computers",
            "Phone accessories",
            "Printing",
            "Photography"
        ]
    },
    {
        id: 5,
        name: "Ndanda",
        categories: [
            "Subwoofers",
            "Fans",
            "Fridges",
            "Furniture",
            "Speakers",
            "Televisions"
        ]
    },
    {
        id: 6,
        name: "Likoma",
        categories: [
            "Phone accessories",
            "Repairs",
            "Electronics",
            "Solar",
            "Televisions",
            "Packaging",
            "Clothing",
            "Textiles"
        ]
    }
];

let allStreets = [...streets];

// GET HTML ELEMENTS
const streetGrid = document.getElementById("streetGrid");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const emptyMessage = document.getElementById("emptyMessage");

function normalizeStreet(street) {
    return {
        id: street.id ?? Date.now() + Math.random(),
        name: street.name ?? "Unnamed Street",
        categories: Array.isArray(street.categories)
            ? street.categories
            : (typeof street.categories === "string"
                ? street.categories.split(",").map((item) => item.trim()).filter(Boolean)
                : [])
    };
}

async function loadStreetsFromSupabase() {
    if (!karixClient) {
        console.warn("Supabase client is not available. Using local street data.");
        return [...streets];
    }

    try {
        const { data, error } = await karixClient
            .from("streets")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.warn("KariX Supabase query failed. Using local street data.", error.message);
            return [...streets];
        }

        if (!data || data.length === 0) {
            console.info("Supabase streets table is empty. Using local fallback data.");
            return [...streets];
        }

        return data.map(normalizeStreet);
    } catch (error) {
        console.warn("Unable to connect to Supabase. Using local street data.", error);
        return [...streets];
    }
}

// DISPLAY STREET CARDS
function displayStreets(streetList) {
    streetGrid.innerHTML = "";
    emptyMessage.hidden = streetList.length > 0;

    streetList.forEach((street) => {
        const card = document.createElement("article");
        card.className = "street-card";

        const number = document.createElement("div");
        number.className = "street-number";
        number.textContent = String(street.id).padStart(2, "0");

        const title = document.createElement("h3");
        title.textContent = street.name + " Street";

        const description = document.createElement("p");
        const categories = Array.isArray(street.categories) ? street.categories : [];
        description.textContent = categories.slice(0, 4).join(" · ") || "Explore local businesses";

        const link = document.createElement("a");
        link.className = "explore-link";
        link.href = "#";
        link.textContent = "Explore street →";

        link.addEventListener("click", (event) => {
            event.preventDefault();
            alert(
                street.name +
                " Street details will be available in the next development stage."
            );
        });

        card.appendChild(number);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(link);

        streetGrid.appendChild(card);
    });
}

// SEARCH FUNCTION
function searchStreets() {
    const query = searchInput.value.trim().toLowerCase();

    const results = allStreets.filter((street) => {
        const streetName = (street.name || "").toLowerCase();
        const categories = (Array.isArray(street.categories) ? street.categories : []).join(" ").toLowerCase();

        return streetName.includes(query) || categories.includes(query);
    });

    displayStreets(results);
}

// SEARCH EVENTS
searchButton.addEventListener("click", searchStreets);
searchInput.addEventListener("input", searchStreets);
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchStreets();
    }
});

// INITIAL PAGE LOAD
async function initializeKariX() {
    allStreets = await loadStreetsFromSupabase();
    displayStreets(allStreets);
    console.log("KariX frontend initialized successfully.");
}

initializeKariX();