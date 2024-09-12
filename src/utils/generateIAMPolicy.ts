import { StatementEffect } from "aws-lambda";

export const generatePolicy = (principalId: string, effect: StatementEffect, resource: string) => {
    const policyDocument = {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
            },
        ],
    };
    return {
        principalId,
        policyDocument,
    };
};