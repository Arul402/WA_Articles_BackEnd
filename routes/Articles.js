import express from "express";
import { getWelcomeMessage,  getAllKatturai ,  getKatturaiById, getAllKatturaiDetails, deleteKatturai, deleteKatturaiDetail,  getAllAuthors, getLatestKatturai, getTopKatturaiByScore,  getAllCategories, incrementViewCount, incrementLikeCount, decrementLikeCount, incrementDislikeCount, decrementDislikeCount, toggleKatturaiFavorite, getFavoriteStatus, getAllFavorites, deleteAllKatturais, getAllTagNames, getKatturaiByCategory, getKatturaiByAuthor} from "../controllers/Articles/katturaiController.js";

const route=express.Router()


// GET
route.get('/',getWelcomeMessage);
route.get('/getkatturai',getAllKatturai);
route.get('/getallkatturaidetail',getAllKatturaiDetails);
route.get('/getsinglekatturai/:id',getKatturaiById);
route.get('/getallauthor',getAllAuthors);
route.get('/getauthor/:id',getKatturaiByAuthor);
route.get('/getnewkatturai',getLatestKatturai);
route.get('/gettrendingKatturai',getTopKatturaiByScore);
route.get('/getallcategory',getAllCategories);
route.get('/getcategory/:id',getKatturaiByCategory);
route.get("/:id/gettoggle", getFavoriteStatus);
route.get("/getalltoggle", getAllFavorites);
route.get("/getalltagnames", getAllTagNames);
// PUT
route.put('/:id/view',incrementViewCount);
route.put('/:id/likeincrease',incrementLikeCount);
route.put('/:id/likedecrease',decrementLikeCount);
route.put('/:id/dislikeincrease',incrementDislikeCount);
route.put('/:id/dislikedecrease',decrementDislikeCount);
// POST
route.post("/:id/toggle", toggleKatturaiFavorite);
// DELETE
route.delete('/deleteAllKatturai',deleteAllKatturais);
route.delete('/deleteKatturaiById/:id',deleteKatturai);
route.delete('/deleteKatturaiDetailById/:id',deleteKatturaiDetail);
export default route;