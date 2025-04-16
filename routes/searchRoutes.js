import express from "express";
// import { searchKatturai, loadAndIndexData } from "../controllers/ElasticLunar-Search/searchController.js";
// import { searchKatturai, loadAndIndexData } from "../controllers/Lunar Search/lunarsearchController.js";
import { searchKatturai, loadAndIndexData } from "../controllers/MongoDb Search/searchController.js";

const router = express.Router();

// Load & Index Data (Run only once on server start)
loadAndIndexData();

// Search API Route
router.get("/", searchKatturai);

export default router;
