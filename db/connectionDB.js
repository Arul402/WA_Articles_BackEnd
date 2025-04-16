import mongoose from 'mongoose'

const connectDb=async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("✅ MongoDb Connected")
        
    } catch (error) {
        console.log(`❌ Error in Connecting Db ${error}`)
        process.exit(1)
    }
}
export default connectDb;