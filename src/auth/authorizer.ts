import * as jwt from "jsonwebtoken"
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
  if(!process.env.JWT_SECRET){
    return generatePolicy('JWT Secret is not provided', 'Deny', _event.methodArn);
  }
  const secretKey = process.env.JWT_SECRET;

    const token = _event.authorizationToken;
  console.log("SECRET KEY: ", secretKey);
    try {
        // Verify the token (check the signature and payload)
        jwt.verify(token.split(" ")[1], secretKey);

        // Return an Allow policy if token is valid
        return generatePolicy("user", 'Allow', _event.methodArn);
      } catch (error) {
        console.error('Token verification failed:', error);
        
        // Return a Deny policy if token is invalid
        return generatePolicy('user', 'Deny', _event.methodArn);
      }
};
