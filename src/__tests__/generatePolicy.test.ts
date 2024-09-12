import { generatePolicy } from "../utils/generateIAMPolicy";

describe("generatePolicy",() => {

    it("generatePolicy generate permission allow for access s3 resource", async () => {
        const result = generatePolicy("u24-w4rt-3223", "Allow", "S3")
        expect(result).toEqual({
            principalId: "u24-w4rt-3223",
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: "Allow",
                    Resource: "S3"
                }]
            }
        });
    })
    
})