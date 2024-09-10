import { connect } from "mongoose";

const mongodb = async (uri: string) => {
  try {
    const { connection } = await connect(uri);
    console.log("Database connected successfully!");
    return connection.readyState;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default mongodb;
