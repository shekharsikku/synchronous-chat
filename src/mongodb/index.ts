import { ConnectionStates, connect } from "mongoose";

const mongodb = async (uri: string): Promise<ConnectionStates | null> => {
  try {
    const { connection } = await connect(uri);
    return connection.readyState;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

export default mongodb;
