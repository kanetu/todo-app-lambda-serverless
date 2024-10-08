import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { createDbInstance } from "../utils/db";
import { dbSecret } from "../const";
import { query } from "../utils/query";

export const getTodo: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!_event.pathParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad Request",
      }),
    };
  }

  console.info("start::getTodo");

  const { id } = _event.pathParameters;

  console.info("get::todo:id", id);

  const db = await createDbInstance(dbSecret);

  let result;

  try {
    await db.connect();
    result = await db.query(query.getTodo, [id]);
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
    console.info("end::getTodo");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: result?.rows,
    }),
  };
};
