import lunr from "lunr";
import { Katturai, katturaiDetail } from "../../models/katturaiModel.js";

// Initialize Lunar Index
const index = lunr(function () {
    this.ref("id");
    this.field("title");
    this.field("short_desc");
    this.field("para");
    this.field("keywords");
    this.field("tag_names");

    // Adding documents to the index
    Katturai.forEach((doc) => {
        this.add({
            id: doc.id,
            title: doc.title,
            short_desc: doc.short_desc,
            para: mergeParagraphs(doc.para || ""),
            keywords: normalizeTamilText(doc.keywords || ""),
            tag_names: mergeTagNames(doc.tag_names || []),
        });
    });
});

const tamilStopWords = new Set(["ஒரு", "என்று", "அது", "இது", "அந்த", "இந்த", "மற்றும்"]);

function removeTamilStopWords(text) {
    return text.split(/\s+/).filter(word => !tamilStopWords.has(word)).join(" ");
}

function normalizeTamilText(text) {
    if (!text) return "";
    text = text.normalize("NFKC"); // Normalize Unicode
    text = text.replace(/([\u0B80-\u0BFF])\s+([\u0B80-\u0BFF])/g, "$1$2"); // Fix spaces
    return text.trim();
}

function mergeParagraphs(paragraphs) {
    return Array.isArray(paragraphs) ? paragraphs.join(" ") : "";
}

const mergeTagNames = (tags) => (Array.isArray(tags) ? tags.join(" ") : "");
const cleanTamilText = (text) => text.replace(/\n/g, "").trim(); // Remove newlines

// Load Data from Database & Index It
export const loadAndIndexData = async () => {
    try {
        const katturai = await Katturai.find();
        const katturaiDetails = await katturaiDetail.find();

        katturai.forEach((doc) => {
            index.add({
                id: doc.id,
                title: doc.title,
                short_desc: doc.short_desc,
                image_url: doc.image_url || "",
                type: "katturai",
            });
        });

        katturaiDetails.forEach((doc) => {
            const contentObj = Array.isArray(doc.content) && doc.content.length > 0 ? doc.content[0] : {};
            const paraText = mergeParagraphs(contentObj.para || []);
            const cleanKeywords = cleanTamilText(doc.keywords || "");

            index.add({
                id: doc.id,
                title: doc.title,
                short_desc: doc.short_desc,
                para: paraText,
                tag_names: mergeTagNames(doc.tag_names || []),
                keywords: normalizeTamilText(cleanKeywords),
                type: "katturaiDetail",
            });
        });

        console.log("✅ Data Indexed Successfully!");
    } catch (error) {
        console.error("❌ Error Loading Data:", error);
    }
};

// Search Function
export const searchKatturai = async (req, res) => {
    let { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: "❌ Query parameter 'q' is required" });
    }

    q = q.trim().toLowerCase();
    console.log(`🔍 Searching for: "${q}"`);

    try {
        const results = index.search(`*${q}*`); // Lunr.js wildcard search

        if (!results.length) {
            return res.status(404).json({ message: "No Articles Found!" });
        }

        const refIds = results.map((item) => item.ref);
        const katturaiDocs = await Katturai.find({ id: { $in: refIds } });

        res.status(200).json({ results: katturaiDocs });
    } catch (error) {
        console.error("❌ Search Error:", error);
        res.status(500).json({ message: "❌ Internal Server Error" });
    }
};
