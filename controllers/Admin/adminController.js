import {Katturai , katturaiDetail, Author, Category} from '../../models/katturaiModel.js'


const createKatturai= async (req,res)=>{
    try {
        const {type,title,short_desc,id,category_ids} = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : "";
        
        const katt=new Katturai({
            type,
            title,
            short_desc,
            image_url,
            id,
            category_ids
        })
        if(katt){
            await katt.save()
            res.status(200).json({
            type:    type,
            title :title,
            short_desc:short_desc,
            image_url:image_url,
            id:id,
            category_ids:category_ids
            })
            console.log("Saved To DataBase")
        }
        
    } catch (error) {
        console.log(`Internal Server Error : ${error}`)
        res.status(400).json({"message":"Internal Server Error"})
    }
}

const addKatturaiDetails=async (req,res)=>{
    try {
        const id=req.params.id;
        const katt= await Katturai.findOne({id:id})
        if (!katt) {
            return res.status(404).json({ message: "Katturai not found" });
        }
        console.log(katt)
        const {category_ids,tag_ids,author_id,keywords,score,likes,dislikes,viewed,content,relevance,author_name,tag_names}=req.body;
        const title=katt.title;
        const short_desc=katt.short_desc;
        const author = await Author.findOne({author_id:author_id});
        console.log(author)
        const author_image=author.author_image;
        // const uploadedImages = req.files.map(file => `images/${file.filename}`);
        const thumbnail_url = req.files["thumbnail_url"] ? `images/${req.files["thumbnail_url"][0].filename}` : "";
        const img_url = req.files["images"] ? req.files["images"].map(file => `images/${file.filename}`) : [];
        // const cont_img_url=req.files["cont_img_url"] ? `images/${req.files["cont_img_url"][0].filename}` : "";
        const base_url=req.files["base_url"] ? `uploads/${req.files["base_url"][0].filename}` : "";
        // Handle single image upload for content
const cont_img_url = req.files?.["cont_img_url"]?.[0]?.filename
? `uploads/${req.files["cont_img_url"][0].filename}`
: null;

// Update content with the single image URL
let updatedContent = [];
if (typeof content === "string") {
try {
  updatedContent = JSON.parse(content);
} catch (error) {
  console.error("Error parsing content:", error);
}
} else {
updatedContent = content;
}

if (updatedContent.length > 0) {
updatedContent[0].cont_img_url = cont_img_url; // Assign the single image URL to the first content object
}

    let updatedRelevance = Array.isArray(relevance)
    ? relevance
    : JSON.parse(relevance || "[]");

  // Map images to relevance objects based on index
  updatedRelevance = updatedRelevance.map((item, index) => {
    const image = req.files?.[`relevance[${index}][image]`]?.[0]?.filename
      ? `uploads/${req.files[`relevance[${index}][image]`][0].filename}`
      : null;
    return {
      ...item,
      img_url: image, // Add the single image URL to the relevance object
    };
  });

        const kattdetail=new katturaiDetail({
            id,
            category_ids,
            tag_ids,
            author_id,
            author_name,
            keywords,
            score,
            likes,
            dislikes,
            viewed,
            content:updatedContent,
            relevance:updatedRelevance ,
            tag_names,
            title,
            short_desc,
            thumbnail_url,
            base_url,
            author_image,
            // img_url
        })
        if(kattdetail){
            await kattdetail.save();
            res.status(200).json({
                id:id,
            category_ids:category_ids,
            tag_ids:tag_ids,
            author_id:author_id,
            author_name:author_name,
            keywords:keywords,
            score:score,
            likes:likes,
            dislikes:dislikes,
            viewed:viewed,
            content:updatedContent,
            relevance:updatedRelevance ,
            tag_names:tag_names,
            title:title,
            short_desc:short_desc,
            thumbnail_url:thumbnail_url,
            base_url:base_url,
            author_image:author_image
            // img_url:img_url
            })
        }
        
    } catch (error) {
        console.log(`Internal Server Error : ${error}`)
        res.status(400).json({"message":"Internal Server Error"})
    }
}



const addAuthor=async (req,res)=>{
    try {
        const {author_id,author_name,author_designation} = req.body;
        const author_image=req.file ? `/uploads/${req.file.filename}` : "";
        const createauth=new Author({
            author_id,
            author_name,
            author_image,
            author_designation
        })
        if(createauth){
            await createauth.save();
            console.log("Author Created")
            res.status(200).json({
                author_id:author_id,
                author_name:author_name,
                author_image:author_image,
                author_designation:author_designation
            })
        }
    } catch (error) {
        console.error(`Internal Server Error: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const addCategory=async (req,res)=>{
    try {
        const {cat_id,cat_name} = req.body;
        const cat_img=req.file ? `/uploads/${req.file.filename}` : "";
        const createcat=new Category({
            cat_id,
            cat_name,
            cat_img,
        })
        if(createcat){
            await createcat.save();
            console.log("Category Created")
            res.status(200).json({
                cat_id:cat_id,
                cat_name:cat_name,
                cat_img:cat_img,
            })
        }
    } catch (error) {
        console.error(`Internal Server Error: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export { createKatturai,  addKatturaiDetails , addAuthor ,addCategory};