import mongoose from "mongoose";

const connectToDb = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI;

    const connectionInstance = await mongoose.connect(mongoURL);
    console.log(connectionInstance);
    console.log(
      `Connected to MongoDB DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Error connecting to MongoDB", error);

    process.exit(1);
  }
};

export default connectToDb;
