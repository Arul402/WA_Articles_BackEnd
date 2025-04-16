import { Katturai, katturaiDetail } from "../../models/katturaiModel.js";

// Ensure Indexing for Full-Text Search
const ensureIndexes = async () => {
    try {
        await Katturai.collection.createIndex({ 
            title: "text", 
            short_desc: "text" 
        });

        await katturaiDetail.collection.createIndex({ 
            title: "text", 
            short_desc: "text", 
            "content.para": "text", 
            keywords: "text", 
            tag_names: "text"
        });

        console.log("✅ Full-Text Indexes Created!");
    } catch (error) {
        console.error("❌ Error Creating Indexes:", error);
    }
};

// Load Data & Ensure Indexing
export const loadAndIndexData = async () => {
    try {
        await ensureIndexes();
        console.log("✅ Data is ready for search!");
    } catch (error) {
        console.error("❌ Error Indexing Data:", error);
    }
};

export const searchKatturai = async (req, res) => {
    let { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: "❌ Query parameter 'q' is required" });
    }

    q = q.trim();
    console.log(`🔍 Searching for: "${q}"`);

    try {
        // Step 1: Search in katturaiDetail with field-specific boosts
        const katturaiDetailDocs = await katturaiDetail
            .find({
                $or: [
                    { tag_names: q }, // Exact match in the array
                    { tag_names: { $regex: q, $options: "i" } }, // Partial match (boost 3)
                    { keywords: { $regex: q, $options: "i" } }, // Partial match (boost 3)
                    { title: { $regex: q, $options: "i" } }, // Partial match (boost 2)
                    { short_desc: { $regex: q, $options: "i" } }, // Partial match (boost 1)
                    { "content.para": { $regex: q, $options: "i" } } // Partial match (boost 1)
                ]
            })
            .sort({ score: -1 }) // Sort by score (higher is better)

        // console.log("📌 Matched katturaiDetailDocs:", katturaiDetailDocs);

        // Extract matched katturai_id values
        let matchedKatturaiIds = katturaiDetailDocs.map(doc => doc.id);

        if (matchedKatturaiIds.length === 0) {
            return res.status(400).json({ message: "❌ No Such Articles Found!" });
        }

        // Step 2: Fetch Katturai data using matched ids
        let katturaiResults = await Katturai.find({ id: { $in: matchedKatturaiIds } });

        // Step 3: Assign relevance score using field-specific boosts
        const scores = {};
        katturaiResults = katturaiResults.map(katturai => {
            const matchingDoc = katturaiDetailDocs.find(doc => doc.id === katturai.id);
            // const paragraphs = matchingDoc?.content?.flatMap(c => c.para ? [c.para] : []);
            const paragraphScore = matchingDoc?.content?.reduce((score, contentItem) => {
                if (Array.isArray(contentItem.para)) {
                    return score + contentItem.para.reduce((innerScore, para) => {
                        if (typeof para === "string") {
                            // console.log("🔍 Checking paragraph:", para); 
            
                            const escapedTerm = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
                            const regex = new RegExp(escapedTerm, "gi");
                            const matchCount = (para.match(regex) || []).length;
            
                            // console.log(`✅ Found "${q}" ${matchCount} times.`);
                            
                            return innerScore + (matchCount > 0 ? Math.max(matchCount, 1) : 0); // Ensure at least 1
                        }
                        return innerScore;
                    }, 0);
                }
                return score;
            }, 0) || 0; // Default to 0 if no matches
            
            let relevanceScore = (matchingDoc?.score || 0) +
                (matchingDoc?.tag_names?.some(tag => tag.toLowerCase().includes(q.toLowerCase())) ? 3 : 0) +
                (matchingDoc?.keywords?.toLowerCase().includes(q.toLowerCase()) ? 3 : 0) +
                (matchingDoc?.title?.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
                (matchingDoc?.short_desc?.toLowerCase().includes(q.toLowerCase()) ? 1 : 0) +
                // (matchingDoc?.content?.some(c => typeof c.para === "string" && c.para.toLowerCase().includes(q.toLowerCase())) ? 1 : 0);
                paragraphScore;
                scores[katturai.id] = relevanceScore - matchingDoc.score;
            return { ...katturai.toObject(), Actual_Score: matchingDoc.score,Search_Score:(relevanceScore-matchingDoc.score), Updated_Score:relevanceScore, };
        });
        console.log("Search Scores with ID : ",scores)
        await Promise.all(
            katturaiDetailDocs.map(async (doc) => {
                const searchScore = scores[doc.id] || 0;
                // console.log("searchScore : ",searchScore)
                console.log(`Before Updating score for doc ID ${doc.id}: ${doc.score}`);
                // console.log("Doc Score : ",doc.score)
                const newScore = (doc.score || 0) + searchScore;
        
                try {
                    // Update the score in MongoDB
                    await katturaiDetail.updateMany(
                        { id: doc.id },
                        { $set: { score: newScore } }
                    );
                    console.log(`✅ Updated score for doc ID ${doc.id}: ${newScore}`);
                } catch (error) {
                    console.error(`❌ Error updating score for doc ID ${doc.id}:`, error);
                }
            })
        );
        // Step 4: Sort results by relevanceScore (descending)
        // katturaiResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        katturaiResults.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                console.log(b.relevanceScore - a.relevanceScore)
                return b.relevanceScore - a.relevanceScore; // Primary sort by relevanceScore (descending)
            }
            // Check if matchingDoc exists before accessing score
    const scoreA = a.Actual_Score || 0; 
    const scoreB = b.Actual_Score || 0; 
    
    console.log(`Sorting by score: ${scoreB} - ${scoreA}`);
    return scoreB - scoreA; // Secondary sort by score (descending)
        });
        

        // console.log("📌 Sorted Katturai Results:", katturaiResults);

        return res.status(200).json({ results: katturaiResults });
        
    } catch (error) {
        console.error("❌ Search Error:", error);
        return res.status(500).json({ message: "❌ Internal Server Error" });
    }
};
