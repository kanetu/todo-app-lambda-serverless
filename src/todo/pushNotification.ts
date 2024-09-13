import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { sendSingleNotificationService } from "../utils/firebase";

export const pushNotification: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {

  console.info("start::pushNotification");

  if (!_event.pathParameters || !_event.pathParameters.token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad Request",
      }),
    };
  }

  let result;
  const { token } = _event.pathParameters;

  try {
    result = await sendSingleNotificationService(token, { title: "Test", body: "Hello world"})
  } catch (err) {
    console.error("error: ", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      })
    };
  } finally {
    console.info("end::pushNotification");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: result,
    }),
  };
};
