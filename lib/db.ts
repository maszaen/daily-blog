import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);
  if (!process.env.MONGODB_URL) {
    return;
  }
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: "Qeonaru",
    });

    isConnected = true;
    console.log("Server connected");
  } catch (error) {
    console.log("Error connecting to server:", error);
  }
};
