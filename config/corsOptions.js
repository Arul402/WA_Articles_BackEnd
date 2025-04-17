const whiteList=['http://localhost:5173','http://localhost:5000','https://www.youtube.com','https://wa-articles-frontend.onrender.com']

const corsOptions={
    origin:(origin,callback)=>{
        if(whiteList.indexOf(origin) !== -1 || !origin){
            callback(null,true)
        }else{
            callback(new Error("❌ Not Allowed By CORS ❌"))
        }
    },
    optionSucessStates:200
}
export default corsOptions;
