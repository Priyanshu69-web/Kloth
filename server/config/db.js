import mongoose from "mongoose";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `Conneted To Mongodb Atlas`.bgMagenta.white
    );
  } catch (error) {
    console.log(`Errro in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;