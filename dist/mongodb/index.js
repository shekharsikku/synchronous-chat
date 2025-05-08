import { connect } from "mongoose";
const mongodb = async (uri) => {
    try {
        const { connection } = await connect(uri);
        return connection.readyState;
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
};
export default mongodb;
