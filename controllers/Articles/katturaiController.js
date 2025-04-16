import {Katturai , katturaiDetail, Author, Category, Favorite} from '../../models/katturaiModel.js'

const getWelcomeMessage=(req,res)=>{
    res.send("Welcome to Katturai")
}

const getAllKatturai= async(req,res)=>{
    // res.send("Welcome to Katturai")
    try {
        const katturai = await Katturai.find(); 
        res.status(200).json(katturai); 
    } catch (error) {
        console.log(`❌ Internal Server Error : ${error}`)
        res.status(400).json({"message":"Internal Server Error"})
    }
}

// Delete all Katturai
const deleteAllKatturais = async (req, res) => {
    try {
        await Katturai.deleteMany({});
        res.status(200).json({ message: "All Katturai deleted successfully" });
    } catch (error) {
        console.error(`❌ Internal Server Error: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Delete Katturai by ID
const deleteKatturai = async (req, res) => {
    try {
        const id  = req.params.id;
        const deletedKatturai = await Katturai.findOneAndDelete({ id: id });
        
        if (!deletedKatturai) {
            return res.status(404).json({ message: "Katturai not found" });
        }

        res.status(200).json({ message: "Katturai deleted successfully", deletedKatturai });
    } catch (error) {
        console.error(`❌ Internal Server Error: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllKatturaiDetails= async(req,res)=>{
    // res.send("Welcome to Katturai")
    try {
        const katturai = await katturaiDetail.find(); 
        res.status(200).json(katturai); 
    } catch (error) {
        console.log(`❌ Internal Server Error : ${error}`)
        res.status(400).json({"message":"Internal Server Error"})
    }
}

const getKatturaiById= async(req,res)=>{
    // res.send("Welcome to Katturai")
    try {
        const id=req.params.id;
        const katturai= await katturaiDetail.findOne({id:id})
        if (!katturai) {
            return res.status(404).json({ message: "Katturai not found" });
        }
        // const katturai = await Katturai.findOne(); 
        res.status(200).json(katturai); 
    } catch (error) {
        console.log(`❌ Internal Server Error : ${error}`)
        res.status(400).json({"message":"Internal Server Error"})
    }
}

// Delete Katturai detail by ID
const deleteKatturaiDetail = async (req, res) => {
    try {
        const id  = req.params.id;
        const deletedKatturaidetail = await katturaiDetail.findOneAndDelete({ id: id });
        
        if (!deletedKatturaidetail) {
            return res.status(404).json({ message: "Katturai not found" });
        }

        res.status(200).json({ message: `Katturai detail id : ${id} deleted successfully`, deletedKatturaidetail });
    } catch (error) {
        console.error(`❌ Internal Server Error: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllCategories = async (req,res)=>{
    try {
        const category = await Category.find(); 
        res.status(200).json(category); 
        
    } catch (error) {
        console.error(`❌ Internal Server Error: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const getAllAuthors = async (req,res)=>{
            try {
                const author = await Author.find(); 
                res.status(200).json(author); 
                
            } catch (error) {
                console.error(`❌ Internal Server Error: ${error}`);
                res.status(500).json({ message: "Internal Server Error" });
            }
}


const getLatestKatturai = async (req, res) => {
    try {
        // Find the latest Katturai based on the createdAt timestamp
        const latestKatturai = await Katturai.find().sort({ createdAt: -1 });

        if (!latestKatturai) {
            return res.status(404).json({ message: "No Katturai found" });
        }
        res.status(200).json({latestKatturai})
    } catch (error) {
        console.error("❌ Error fetching latest Katturai:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Below code has TC of O(N log N)
// const getTopKatturaiByScore = async (req, res) => {
//     try {
        
//         const kattDetails = await katturaiDetail.find().sort({ viewed: -1 }); // MongoDB Sorting TC : O(N log N)
//         const kattScore = kattDetails.map(viewed=>viewed.viewed)

//         const katturaiIds = kattDetails.map(detail => detail.id);
//         const katturaiList = await Katturai.find({ id: { $in: katturaiIds } });

//         const katturaiMap = new Map(katturaiList.map(k => [k.id, k]));
// // const sortedKatturaiList = katturaiIds
// //   .map(id => katturaiMap.get(id))
// //   .filter(Boolean); // Removes null or undefined values
// const katturaiListWithScore = katturaiIds
//   .map((id, index) => {
//     const katturai = katturaiMap.get(id);
//     return katturai ? { ...katturai.toObject(), kattScore: kattScore[index] } : null;
//   })
//   .filter(Boolean);

//         res.status(200).json({katturaiListWithScore });

//     } catch (error) {
//         console.error("❌ Error fetching Katturai sorted by score:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

// below code is with the TC of O(log N) 
const getTopKatturaiByScore = async (req, res) => {
    try {
        // Ensure an index on 'viewed' for efficient sorting
        await katturaiDetail.collection.createIndex({ viewed: -1 }); // to reduce TC 

        // Fetch and sort Katturai details in MongoDB (O(log N) if indexed)
        const kattDetails = await katturaiDetail.find().sort({ viewed: -1 }); // MongoDB Sorting TC : O(log N)

        const kattScore = kattDetails.map(detail => detail.viewed);
        const katturaiIds = kattDetails.map(detail => detail.id);

        // Fetch Katturai data for the extracted IDs
        const katturaiList = await Katturai.find({ id: { $in: katturaiIds } });

        // Map Katturai objects by ID for quick lookup
        const katturaiMap = new Map(katturaiList.map(k => [k.id, k]));

        // Construct the final response list with kattScore
        const katturaiListWithScore = katturaiIds
            .map((id, index) => {
                const katturai = katturaiMap.get(id);
                return katturai ? { ...katturai.toObject(), kattScore: kattScore[index] } : null;
            })
            .filter(Boolean); // Remove null values

        res.status(200).json({ katturaiListWithScore });

    } catch (error) {
        console.error("❌ Error fetching Katturai sorted by score:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Below code is with TC : (N log N)
// const getTopKatturaiByScore = async (req, res) => {
//     try {
//         // Fetch all katturai details (no sorting)
//         const kattDetails = await katturaiDetail.find();
        
//         kattDetails.sort((a, b) => b.viewed - a.viewed); // JS Sorting TC : O(N log N)
//         // Extract viewed count and IDs
//         const kattScore = kattDetails.map(viewed => viewed.viewed);
//         const katturaiIds = kattDetails.map(detail => detail.id);

//         // Fetch Katturai data for the extracted IDs
//         const katturaiList = await Katturai.find({ id: { $in: katturaiIds } });

//         // Map Katturai objects by ID for quick lookup
//         const katturaiMap = new Map(katturaiList.map(k => [k.id, k]));

//         // Construct the final response list with kattScore
//         const katturaiListWithScore = katturaiIds.map((id, index) => {
//             const katturai = katturaiMap.get(id);
//             return katturai ? { ...katturai.toObject(), kattScore: kattScore[index] } : null;
//         }).filter(Boolean); // Remove null values

//         res.status(200).json({ katturaiListWithScore });

//     } catch (error) {
//         console.error("❌ Error fetching Katturai:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

const incrementViewCount = async (req,res)=>{
    try {
        const katturai = await katturaiDetail.findOne({id:req.params.id});
        katturai.viewed += 1;
        katturai.score += 1;
        await katturai.save();
        res.json({ message: 'Viewed!', katturai });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
}
const incrementLikeCount = async (req,res)=>{
    try {
        const katturai = await katturaiDetail.findOne({id:req.params.id});
        if (katturai.disliked) {
            katturai.dislikes -= 1;
            katturai.score += 2;
            katturai.disliked=false;
          }
        katturai.likes += 1;
        katturai.score += 5;
        katturai.liked=true;
        await katturai.save();
    res.json({ message: 'yes', katturai });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
}
const decrementLikeCount = async (req,res)=>{
    try {
        const katturai = await katturaiDetail.findOne({id:req.params.id});
        
      
        katturai.likes -= 1;
        katturai.score -= 5;
        katturai.liked=false;
        await katturai.save();
    res.json({ message: 'no', katturai });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
}


const incrementDislikeCount = async (req,res)=>{
    try {
        const katturai = await katturaiDetail.findOne({id:req.params.id});
        if (katturai.liked) {
            katturai.likes -= 1;
            katturai.score -= 5;
            katturai.liked = false;
          }
        katturai.dislikes += 1;
        katturai.score -= 2;
        katturai.disliked=true;
        await katturai.save();
        res.json({ message: 'yes', katturai });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
}
const decrementDislikeCount = async (req,res)=>{
    try {
        const katturai = await katturaiDetail.findOne({id:req.params.id});
        katturai.dislikes -= 1;
        katturai.score += 2;
        katturai.disliked=false;
        await katturai.save();
        res.json({ message: 'no', katturai });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
}

// const toggleFavorite = async (req, res, next) => {
//     try {
//       const  id  = req.params.id;
  
//       if (!id) {
//         return res.status(400).json({ message: "Article ID is required." });
//       }
  
//       // Check if the article is already in favorites
//       let favorite = await Favorite.findOne({ id:id });
  
//       if (favorite) {
//         // Remove from favorites
//         await Favorite.findOneAndDelete({ id:id });
//         const isFavorite =false;
//         // await favorite.save();
//         res.status(200).json({ message: "Removed from favorites", isFavorite });
//       } else {
//         // Add to favorites
//         favorite = new Favorite({ id });
//         const isFavorite =true;
//         await favorite.save();
//         res.status(201).json({ message: "Added to favorites", isFavorite });
//       }
//     } catch (error) {
//       next(error);
//     }
//   };

// const gettoggleFavorite=async (req,res)=>{
//     try {
//         const { articleId } = req.params.id;
//         let favorites = await Favorite.findOne({ id:articleId });
//         // const favorites = await Favorite.find().populate("articleId");
//         res.status(200).json({ favorites });
//       } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//       }
// }
// const getalltoggleFavorite=async (req,res)=>{
//     try {
//         // const { articleId } = req.params.id;
//         let favorites = await Favorite.find();
//         const fav_id=favorites.id;
//         const katturaiList = await Katturai.find({ id: { $in: fav_id } });
//         // const favorites = await Favorite.find().populate("articleId");
//         res.status(200).json({ katturaiList });
//       } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//       }
// }

const toggleKatturaiFavorite = async (req, res, next) => {
    try {
        const { id } = req.params; // Extract article ID from request params

        if (!id) {
            return res.status(400).json({ message: "Article ID is required." });
        }

        // Check if the article is already in favorites
        let favorite = await Favorite.findOne({ id: id });

        if (favorite) {
            // Remove from favorites
            await Favorite.findOneAndDelete({ id: id });
            return res.status(200).json({ message: "Removed from favorites", isFavorite: false });
        } else {
            // Add to favorites
            favorite = new Favorite({ id: id });
            await favorite.save();
            return res.status(201).json({ message: "Added to favorites", isFavorite: true });
        }
    } catch (error) {
        next(error);
    }
};

const getFavoriteStatus = async (req, res) => {
    try {
        const  id  = req.params.id; // Extract article ID correctly
        const favorite = await Favorite.findOne({ id: id });

        // if (!favorite) {
        //     return res.status(404).json({ message: "Favorite not found" });
        // }
        if(favorite){
            return res.status(200).json({ message: "favorites", isFavorite: true });
        }else{
            return res.status(200).json({ message: "favorites", isFavorite: false });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

const getAllFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find(); // Get all favorites
        const fav_ids = favorites.map(fav => fav.id); // Extract article IDs

        const katturaiList = await Katturai.find({ id: { $in: fav_ids } }); // Fetch related Katturai articles

        res.status(200).json({ katturaiList });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

const getAllTagNames= async (req,res)=>{
    try {
        const katturais = await katturaiDetail.find({tag_names: { $exists: true, $ne: null }}, "tag_names");

        // Flatten the array and get unique tag names
        const tagNames = [...new Set(katturais.flatMap(k => k.tag_names))];

        res.status(200).json(tagNames);
        
    } catch (error) {
        console.error("❌ Error fetching Tag Names:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const getKatturaiByCategory = async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id); // Convert to number
  
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
  
      // Find KatturaiDetail where cat_id contains the given category ID
      const katturaiDetails = await katturaiDetail.find({ category_ids: categoryId });
  
      if (!katturaiDetails.length) {
        return res.status(404).json({ message: "No records found" });
      }
      const katturaiDetailIds = katturaiDetails.map((detail) => detail.id);
      const katturaiList = await Katturai.find({ id: { $in: katturaiDetailIds } });
      res.status(200).json(katturaiList);
    } catch (error) {
      next(error); // Pass error to error-handling middleware
    }
  };

  const getKatturaiByAuthor = async (req, res, next) => {
    try {
        const authorId = parseInt(req.params.id); // Convert to number

        if (isNaN(authorId)) {
            return res.status(400).json({ error: "Invalid author ID" });
        }

        // Find KatturaiDetail where author_id matches the given author ID
        const katturaiDetails = await katturaiDetail.find({ author_id: authorId });

        if (!katturaiDetails.length) {
            return res.status(404).json({ message: "No records found" });
        }

        // Extract the IDs from katturaiDetails
        const katturaiDetailIds = katturaiDetails.map((detail) => detail.id);

        // Find Katturai records where id is in katturaiDetailIds
        const katturaiList = await Katturai.find({ id: { $in: katturaiDetailIds } });

        res.status(200).json(katturaiList);
    } catch (error) {
        next(error); // Pass error to error-handling middleware
    }
};

export {
    getWelcomeMessage , getAllKatturai ,getKatturaiById , 
    getAllKatturaiDetails, deleteAllKatturais,deleteKatturai,
    deleteKatturaiDetail ,getAllAuthors, getLatestKatturai,
    getTopKatturaiByScore,getAllCategories,incrementViewCount,
    incrementLikeCount,decrementLikeCount,
    incrementDislikeCount,decrementDislikeCount,
    toggleKatturaiFavorite,getFavoriteStatus,getAllFavorites,
    getAllTagNames,
    getKatturaiByCategory,getKatturaiByAuthor
};