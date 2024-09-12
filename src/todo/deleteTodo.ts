import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { createDbInstance } from "../utils/db";
import { secretName } from "./getTodos";
import { query } from "../utils/query";

export const deleteTodo: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("start::deleteTodo");

  if (!_event.pathParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad Request",
      }),
    };
  }

  console.info("start::deleteTodo");

  const { id } = _event.pathParameters;

  console.info("delete::todo:id", id);

  const db = await createDbInstance(secretName);

  let result;

  try {
    await db.connect();
    result = await db.query(query.deleteTodo, [id]);
  } catch (err) {
    console.error("error: ", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      })
    };
  } finally {
    await db.end();
    console.info("end::deleteTodo");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Delete todo successfully",
    }),
  };
};
