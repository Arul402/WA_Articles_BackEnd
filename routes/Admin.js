import express from "express";
import {  createKatturai , addKatturaiDetails,addAuthor, addCategory} from "../controllers/Admin/adminController.js";
import multer from "multer";
import path from 'path';
// import multer from "multer";

const route=express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");  // Store in the "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname)); // Unique file name
    }
});

const upload = multer({ storage });

// Custom middleware to dynamically generate multer field configurations
const dynamicMulterFields = (req, res, next) => {
    const fields = [];
    for (let i = 0; i < 11; i++) {
      fields.push({ name: `relevance[${i}][image]`, maxCount: 1 });
    }
  
    // Add other fields (e.g., thumbnail_url, base_url, etc.)
    fields.push(
      { name: "thumbnail_url", maxCount: 1 },
      { name: "base_url", maxCount: 1 },
      { name: "cont_img_url", maxCount: 1 }

    );

    // Use multer with the dynamically generated fields
    upload.fields(fields)(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: "File upload failed" });
      }
      next();
    });
  };
  

const uploads = multer({ storage: storage }).fields([
    { name: "thumbnail_url", maxCount: 1 },  // For thumbnail_url (Single Image)
    { name: "images", maxCount: 10 },  // For img_url (Multiple Images)
    { name: "cont_img_url", maxCount:1},
    { name: "base_url", maxCount:1}
]);


// POST
route.post('/create',upload.single("image"),createKatturai)
route.post('/kattdetailcreate/:id',dynamicMulterFields,addKatturaiDetails)
route.post('/createauthor',upload.single("author_image"),addAuthor)
route.post('/createcategory',upload.single("cat_img"),addCategory)

export default route;