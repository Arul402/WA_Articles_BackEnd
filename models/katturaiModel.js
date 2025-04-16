import mongoose from "mongoose";
import { type } from "os";
// import { type } from "os";

const KatturaiSchema=new mongoose.Schema({
    type:{
        type:Number,
        default:""
    },
    title:{
        type:String,
        default:""
    },
    short_desc:{
        type:String,
        default:""
    },
    image_url:{
        type:String,
        default:""
    },
    id:{
        type:Number,
        default:""
    },
    category_ids:{
        type:[Number],
        default:[]
    },
},{timestamps:true})

const content=new mongoose.Schema({
        title:{
            type:String
        },
        quote:{
            type:String
        },
        para:{
            type:[{type:String}]
        },
        cont_img_url:{
            type:String,
            default:""
        }
})

const relevance=new mongoose.Schema({
    id:{
        type:Number
    },
    title:{
        type:String
    },
    thumbnail_url:{
        type:[String],
        default:[]
    },
    img_url:{
        type:String,
        default:""
    },
    date_of_publish:{
        type:String
    }
})

const KatturaiDetailSchema=new mongoose.Schema({
    id:{
        type:Number
    },
    category_ids:{
        type:[Number]
    },
    tag_ids:{
        type:[Number]
    },
    author_id:{
        type:Number
    },
    title:{
        type:String
    },
    short_desc:{
        type:String
    },
    keywords:{
        type:String
    },
    base_url:{
        type:String,
        default:""
    },
    score:{
        type:Number
    },
    likes:{
        type:Number
    },
    liked:{
        type:Boolean
    },
    dislikes:{
        type:Number
    },
    disliked:{
        type:Boolean
    },
    viewed:{
        type:Number
    },
    content:[content],
    relevance:[relevance],
    author_name:{
        type:String
    },
    author_image:{
        type:String,
        default:""
    },
    tag_names:{
        type:[String]
    }
},{timestamps:true})

const AuthorSchema=new mongoose.Schema({
    author_id:{
        type:Number
    },
    author_name:{
        type:String
    },
    author_image:{
        type:String,
        default:""
    },
    author_designation:{
        type:String,

    }
})

const CategorySchema=new mongoose.Schema({
    cat_id:{
        type:Number
    },
    cat_img:{
        type:String,
        default:""
    },
    cat_name:{
        type:String,
    }
})

const FavoriteSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    isFavorite:{
        type:Boolean,
        default:false
    }
  });

const Katturai=mongoose.model("Katturai",KatturaiSchema)
const katturaiDetail=mongoose.model("katturaiDetail",KatturaiDetailSchema)
const Author=mongoose.model("Author",AuthorSchema)
const Category=mongoose.model("Category",CategorySchema)
const Favorite = mongoose.model("Favorite", FavoriteSchema);
export {Katturai,katturaiDetail,Author,Category,Favorite};
