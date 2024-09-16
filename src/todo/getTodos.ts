import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { createDbInstance } from "../utils/db";
import { query } from "../utils/query";
import { dbSecret } from "../const";

export const getTodos: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("start::getTodos");

  const db = await createDbInstance(dbSecret);

  let result;

  try {
    await db.connect();
    result = await db.query(query.getAllTodo);
  } catch (err) {
    console.log("error: ", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      })
    };
  } finally {
    await db.end();
    console.log("end::getTodos");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: result?.rows,
    }),
  };
};
