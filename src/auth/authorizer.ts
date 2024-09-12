import type {
    Context,
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
    Handler,
} from "aws-lambda";
import { generatePolicy } from "../utils/generateIAMPolicy";

export const authorizer: Handler = async (
    _event: APIGatewayTokenAuthorizerEvent,
    _context: Context
): Promise<APIGatewayAuthorizerResult> => {

    const token = _event.authorizationToken;

    if (token === 'allow') {
        return generatePolicy('user', 'Allow', _event.methodArn);
    } else if (token === 'deny') {
        return generatePolicy('user', 'Deny', _event.methodArn);
    }

    throw new Error('Unauthorized');

};
