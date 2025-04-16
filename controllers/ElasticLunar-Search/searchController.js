import elasticlunr from "elasticlunr";
import {Katturai , katturaiDetail} from '../../models/katturaiModel.js'



// Initialize ElasticLunr Index
const index = elasticlunr(function () {
    this.addField("title");
    this.addField("short_desc");
    this.addField("para");
    this.addField("keywords");
    this.addField("tag_names");
    this.setRef("id");
});

const tamilStopWords = new Set(["ஒரு", "என்று", "அது", "இது", "அந்த", "இந்த", "மற்றும்"]);

function removeTamilStopWords(text) {
    return text.split(/\s+/).filter(word => !tamilStopWords.has(word)).join(" ");
}


function tokenizeTamilText(text) {
    return text.replace(/[^அ-ஔக-ஹா-ூெ-ோௌ]/g, " ").split(/\s+/).filter(Boolean);
}


function normalizeTamilText(text) {
    if (!text) return "";
    
    // Normalize Unicode characters to avoid variations
    text = text.normalize("NFKC");
    
    // Fix extra spaces caused by encoding issues
    text = text.replace(/([\u0B80-\u0BFF])\s+([\u0B80-\u0BFF])/g, "$1$2");

    return text.trim();
}



// Function to merge paragraphs into a single string
// const mergeParagraphs = (paragraphs) => paragraphs.join(" ");
// Function to safely merge paragraphs into a single string
// const mergeParagraphs = (paragraphs) => {
//     if (!Array.isArray(paragraphs)) return ""; // If not an array, return an empty string
//     return paragraphs.join(" ");
// };

function mergeParagraphs(paragraphs) {
    return Array.isArray(paragraphs) ? paragraphs.join(" ") : "";
}


const mergeTagNames = (tags) => {
    if (!Array.isArray(tags)) return ""; // If not an array, return an empty string
    return tags.join(" ");
};

const cleanTamilText = (text) => {
    return text.replace(/\n/g, '').trim(); // Removes newlines
};



// Load Data from Database & Index It
export const loadAndIndexData = async () => {
    try {
        const katturai = await Katturai.find();
        const katturaiDetails = await katturaiDetail.find();

        // Index Katturai
        katturai.forEach(doc => {
            index.addDoc({
                id: doc.id,
                title: doc.title,
                short_desc: doc.short_desc,
                // para: "",
                image_url: doc.image_url || "",
                type: "katturai"
            });
        });

        // Index KatturaiDetail
        katturaiDetails.forEach(doc => {
            const contentObj = Array.isArray(doc.content) && doc.content.length > 0 ? doc.content[0] : {};
            const paraText = mergeParagraphs(contentObj.para || []);
            const cleanKeywords = cleanTamilText(doc.keywords || "");
            index.addDoc({
                id: doc.id,
                title: doc.title,
                short_desc: doc.short_desc,
                para: paraText,
                tag_names: mergeTagNames(doc.tag_names || []),
                keywords: normalizeTamilText(cleanKeywords) ,
                type: "katturaiDetail"
            });
            // console.log("Tag Names",mergeTagNames(doc.tag_names))
            // console.log("Normalized Tamil Text:", normalizeTamilText(doc.keywords || ""));

        });

        console.log("✅ Data Indexed Successfully!");
    } catch (error) {
        console.error("❌ Error Loading Data:", error);
    }
};

// Search Function
// export const searchKatturai = async (req, res) => {
//     const query = req.query.q;
//     if (!query) {
//         return res.status(400).json({ message: "Query parameter 'q' is required" });
//     }

//     const results = index.search(query, {
//         fields: {
//             title: { boost: 3 },
//             short_desc: { boost: 2 },
//             para: { boost: 1 }
//         },
//         expand: true
//     });

//     // Fetch Full Data from MongoDB
//     const katturai = await Katturai.find();
//     const katturaiDetails = await katturaiDetail.find();

//     // Map search results with full data
//     const response = results.map(res => {
//         let doc = katturai.find(d => d._id.toString() === res.ref) ||
//                   katturaiDetails.find(d => d._id.toString() === res.ref);
//         return { ...doc.toObject(), score: res.score };
//     });

//     res.json({ query, results: response });
// };

export const searchKatturai = async (req, res) => {
    let { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: "❌ Query parameter 'q' is required" });
    }

    q = q.trim().toLowerCase();

    console.log(`🔍 Searching for: "${q}"`);

    try {
        // If it's a single word, add wildcard for better matching
        const qq= decodeURIComponent(req.query.q || "").trim();
        console.log(`qq : ${qq}`)
        const query = qq.includes(" ") ? qq : `${qq}*`;

        const results = index.search(query, {
            fields: {
                title: { boost: 2 },
                short_desc: { boost: 1 },
                para: { boost: 1 },
                keywords: { boost: 3 },
                tag_names: { boost: 3 },
            },
            bool: "OR",
            expand: true,
            fuzzy: 1 // Enable fuzzy matching
        });

        // console.log("📜 Raw Search Results:", results);

        if (!results || results.length === 0) {
            console.log("⚠ No results found for:", q);
        }

        // Extract ref IDs from search results
        const refIds = results.map((item) => item.ref);
        const scores = results.reduce((acc, item) => {
            acc[item.ref] = Math.round(item.score);
            return acc;
        }, {});
        // console.log(`Scores : ${scores}`)
        // console.log("🆔 Fetching Documents for Ref IDs:", refIds);

        // Fetch corresponding documents from MongoDB
        // const katturaiDocs = await Katturai.find({
        //     _id: { $in: refIds.map(id => new mongoose.Types.ObjectId(id)) }
        // });
        // const katturaiDetailDocs = await katturaiDetail.find({
        //     _id: { $in: refIds.map(id => new mongoose.Types.ObjectId(id)) }
        // });
        const katturaiDocs = await Katturai.find({
            id: { $in: refIds }  // Directly match `id` field
        });
        
        const katturaiDetailDocs = await katturaiDetail.find({
            id: { $in: refIds }  // Ensure `id` is used
        });
        

        // await Promise.all(katturaiDocs.map(async (doc) => {
        //     const newScore = (doc.score || 0) + (scores[doc._id.toString()] || 0);
        //     await katturaiDetail.update({ _id: doc._id }, { $set: { score: newScore } });
        //     doc.updated_score = newScore; 
        // }));

        await Promise.all(katturaiDetailDocs.map(async (doc) => {
            const searchScore = scores[doc.id] || 0;
            const newScore = Math.round((doc.score || 0) + searchScore);
            // Update the score in MongoDB
            await katturaiDetail.updateMany(
                { id: doc.id },
                { $set: { score: newScore } }
            );
            
            console.log(`📝 Search Score for ${doc.id}: ${scores[doc.id]}`);
            console.log(`📝 Before Updating the Score for ${doc.id}: ${doc.score}`);           
            console.log(`📝 Updating Score for ${doc.id}: ${newScore}`);
        
            // Attach the updated score to the document for response
            doc.updated_score = newScore;
        }));
        // console.log("📄 Retrieved Katturai:", katturaiDetailDocs);
        // const fullResults = results.map(({ ref }) => ({
        //     ...index.documentStore.getDoc(ref), // Spread the document data
        //     search_score: scores[ref] || 0, // Use 'ref' instead of 'doc._id'
        //     actual_score:newScore
        // }));
        // const fullResults = results.map(({ ref }) => {
        //     const doc = index.documentStore.getDoc(ref);
        
        //     // Find the updated document in katturaiDocs
        //     const updatedDoc = katturaiDetailDocs.find(d => d.id === ref);
        
        //     console.log(`📄 Retrieved Doc for Ref ${ref}:`, updatedDoc);
        
        //     return {
        //         ...doc, // Spread original document data
        //         search_score: scores[ref] || 0, // The search score from Elasticlunr
        //         actual_score: updatedDoc ? Math.round(updatedDoc.updated_score) : Math.round(doc.score || 0), // Ensure updated score
        //         image: updatedDoc ? updatedDoc.image_url : doc.image_url,
        //     };
        // });
        const fullResults = results.map(({ ref }) => {
            const doc = index.documentStore.getDoc(ref);
            if (!doc) {
                console.log(`❌ No document found for Ref ${ref}`);
                return null;
            }
        
            // console.log("🔹 Ref:", ref, typeof ref);
            // console.log("📝 katturaiDetailDocs IDs:", katturaiDetailDocs.map(d => d.id));
        
            // Ensure ID comparison is correct
            // const updatedDoc = katturaiDetailDocs.find(d => d.id === Number(ref));
            const updatedDoc = katturaiDetailDocs.find(d => String(d.id) === String(ref));
            const imageUrl = updatedDoc ? updatedDoc.base_url || "❌ No Image Found" : "❌ Doc Not Found";
        
            // console.log(`📄 Retrieved Doc for Ref ${ref}:`, updatedDoc || "❌ Not Found");
        
            return {
                ...doc,
                search_score: scores[ref] || 0,
                actual_score: updatedDoc ? Math.round(updatedDoc.updated_score) : Math.round(doc?.score || 0),
                image_url: imageUrl, // Ensure image is handled correctly
            };
        });
        if(results.length > 0){
            res.status(200).json({ results: fullResults });
        }else{
            res.status(400).json({ message: "No Such Articals Found !" });
        }
        // res.json({ results });
    } catch (error) {
        console.error("❌ Search Error:", error);
        res.status(500).json({ message: "❌ Internal Server Error" });
    }
};