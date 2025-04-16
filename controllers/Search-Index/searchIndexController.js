import { SearchIndex } from "search-index";
import { Katturai, katturaiDetail } from "../../models/katturaiModel.js";

let index = null;

const initializeIndex = async () => {
    if (!index) {
        index = await new SearchIndex();
        console.log("✅ Search index initialized");
    }
};

// Ensure index is initialized before using it
await initializeIndex();




// let index;
// (async () => {
//     index = await si();
// })();

const tamilStopWords = new Set(["ஒரு", "என்று", "அது", "இது", "அந்த", "இந்த", "மற்றும்"]);

function removeTamilStopWords(text) {
    return text.split(/\s+/).filter(word => !tamilStopWords.has(word)).join(" ");
}

function mergeParagraphs(paragraphs) {
    return Array.isArray(paragraphs) ? paragraphs.join(" ") : "";
}

const mergeTagNames = (tags) => Array.isArray(tags) ? tags.join(" ") : "";

const cleanTamilText = (text) => text.replace(/\n/g, "").trim();

export const loadAndIndexData = async () => {
    try {
        await initializeIndex(); // Ensure index is ready

        const katturai = await Katturai.find();
        const katturaiDetails = await katturaiDetail.find();

        const docs = [
            ...katturai.map(doc => ({
                _id: doc._id.toString(), // ✅ Ensure _id is a string
                title: doc.title,
                short_desc: doc.short_desc,
                image_url: doc.image_url || "",
                type: "katturai"
            })),
            ...katturaiDetails.map(doc => ({
                _id: doc._id.toString(),
                title: doc.title,
                short_desc: doc.short_desc,
                para: mergeParagraphs(doc.content?.[0]?.para || []),
                tag_names: mergeTagNames(doc.tag_names || []),
                keywords: cleanTamilText(doc.keywords || ""),
                type: "katturaiDetail"
            }))
        ];

        console.log("📂 Indexing documents:", docs);

        await index.PUT(docs);
        console.log("✅ Data Indexed Successfully!");
    } catch (error) {
        console.error("❌ Error Indexing Data:", error);
    }
};


// export const searchKatturai = async (req, res) => {
//     let { q } = req.query;
//     if (!q) {
//         return res.status(400).json({ message: "❌ Query parameter 'q' is required" });
//     }

//     q = decodeURIComponent(q.trim().toLowerCase());
//     console.log(`🔍 Searching for: "${q}"`);

//     try {
//         const results = await index.QUERY({
//             AND: q.split(" "),
//             SCORE: "title^2 short_desc^1 para^1 keywords^3 tag_names^3"
//         });

//         // if (!results || results.length === 0) {
//         //     console.log("⚠ No results found for:", q);
//         //     return res.json({ query: q, results: [] });
//         // }
//         if (!Array.isArray(results) || results.length === 0) {
//             console.log("⚠ No results found for :",q);
//             return res.status(404).json({ message: "No results found for your query." });
//         }
//         const refIds = results.map(item => item.id);
        

//         const resultsArray = Array.isArray(results) ? results : results.hits || results.data || [];
//     console.log("Processed results:", resultsArray);

//         // const refIds = resultsArray.map(item => item.id);
//         const katturaiDocs = await Katturai.find({ id: { $in: refIds } });
//         const katturaiDetailDocs = await katturaiDetail.find({ id: { $in: refIds } });

//         const response = resultsArray.map(({ id, _score }) => {
//             const doc = katturaiDocs.find(d => String(d.id) === String(id)) ||
//                         katturaiDetailDocs.find(d => String(d.id) === String(id));
//             return doc ? { ...doc.toObject(), score: Math.round(_score) } : null;
//         }).filter(Boolean);

//         res.json({ query: q, results: response });
//     } catch (error) {
//         console.error("❌ Search Error:", error);
//         res.status(500).json({ message: "❌ Internal Server Error" });
//     }
// };

export const searchKatturai = async (req, res) => {
    let { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: "❌ Query parameter 'q' is required" });
    }

    q = decodeURIComponent(q.trim().toLowerCase());
    console.log(`🔍 Searching for: "${q}"`);

    try {
        await initializeIndex(); // Ensure index is ready

        console.log("🔍 Querying index with:", q);
        const results = await index.QUERY({
            AND: q.split(" "), // ✅ Ensure query is formatted correctly
            SCORE: "title^2 short_desc^1 para^1 keywords^3 tag_names^3"
        });

        console.log("🔎 Raw search results:", results);

        // ✅ Handle different result structures
        const resultArray = results.RESULT || results.hits || [];

        if (!Array.isArray(resultArray) || resultArray.length === 0) {
            console.log("⚠ No results found for:", q);
            return res.status(404).json({ message: "No results found for your query." });
        }

        // ✅ Use string `_id`
        const stringIds = resultArray.map(item => item._id);

        // ✅ Fetch matching documents
        const katturaiDocs = await Katturai.find({ _id: { $in: stringIds } });
        const katturaiDetailDocs = await katturaiDetail.find({ _id: { $in: stringIds } });

        const response = resultArray.map(({ _id, _score }) => {
            const doc = katturaiDocs.find(d => d._id.toString() === _id) ||
                        katturaiDetailDocs.find(d => d._id.toString() === _id);
            return doc ? { ...doc.toObject(), score: Math.round(_score) } : null;
        }).filter(Boolean);

        res.json({ query: q, results: response });
    } catch (error) {
        console.error("❌ Search Error:", error);
        res.status(500).json({ message: "❌ Internal Server Error" });
    }
};
