import { authorizer } from "../auth/authorizer"
import { context } from "../utils/testData";
import * as jwt from "jsonwebtoken";

jest.mock("jsonwebtoken", () => ({
    ...jest.requireActual('jsonwebtoken'),
    verify: jest.fn()
}));

describe("authorizer", () => {
    const originalEnv = process.env

    beforeEach(() => {
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it("authorizer denies the request if token is invalid", async () => {
        process.env = {
            ...originalEnv,
            JWT_SECRET: "nothingsecret"
        };
        const event = {
            authorizationToken: "Bearer simplet0k3n",
            methodArn: "arn:aws:execute-api:us-east-1:123456789012:api-id/dev/GET/resource"
        };

        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw Error("Verify failed")
        })
        const result = await authorizer(event, context, () => { })

        expect(result).toEqual({
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17', Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: "Deny",
                        Resource: "arn:aws:execute-api:us-east-1:123456789012:api-id/dev/GET/resource",
                    },
                ],
            }
        });
    })

    it("authorizer allows the request if token is valid", async () => {
        process.env = {
            ...originalEnv,
            JWT_SECRET: "nothingsecret"
        };
        const event = {
            authorizationToken: "Bearer simplet0k3n",
            methodArn: "arn:aws:execute-api:us-east-1:123456789012:api-id/dev/GET/resource"
        };
        (jwt.verify as jest.Mock).mockImplementation(() => {

        })
        const result = await authorizer(event, context, () => { })

        expect(result).toEqual({
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17', Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: "Allow",
                        Resource: "arn:aws:execute-api:us-east-1:123456789012:api-id/dev/GET/resource",
                    },
                ],
            }
        });
    })


    it("secret value is not provided", async () => {
        const event = {
            authorizationToken: "Bearer simplet0k3n",
            methodArn: "arn:aws:execute-api:us-east-1:123456789012:api-id/dev/GET/resource"
        };
        (jwt.verify as jest.Mock).mockImplementation(() => {

        })
        const result = await authorizer(event, context, () => { })

        expect(result).toEqual({
            principalId: 'JWT Secret is not provided',
            policyDocument: {
                Version: '2012-10-17', Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: "Deny",
                        Resource: "arn:aws:execute-api:us-east-1:123456789012:api-id/dev/GET/resource",
                    },
                ],
            }
        });
    })

})