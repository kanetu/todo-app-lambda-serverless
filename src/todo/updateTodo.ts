import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { createDbInstance } from "../utils/db";
import { secretName } from "./getTodos";
import { query } from "../utils/query";
import { updateTodoSchema } from "../schemas";

export const updateTodo: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!_event.pathParameters || !_event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad Request",
      }),
    };
  }

  console.info("start::updateTodo");

  let result;
  const db = await createDbInstance(secretName);

  try {
    const { id } = _event.pathParameters;
    const validateResult = updateTodoSchema.validate(
      JSON.parse(_event.body)
    );

    if (validateResult.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Bad Request",
          error: `${validateResult.error.name} ${validateResult.error.message}`,
        }),
      };
    }

    const { name, status, priority } = validateResult.value;

    console.info("update::todo:id", id);

    await db.connect();
    result = await db.query(query.updateTodo, [name, status, priority, id]);
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
    console.info("end::updateTodo");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Update todo successfully",
      data: result?.rows,
    }),
  };
};
