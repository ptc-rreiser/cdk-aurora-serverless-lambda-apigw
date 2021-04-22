import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { Lambda } from "@aws-sdk/client-lambda";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log('request:', JSON.stringify(event, undefined, 2));

  const lambda = new Lambda({});
  const resp = await lambda.invoke({
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: Buffer.from(JSON.stringify(event))
  });

  console.log('downstream response:', JSON.stringify(resp, undefined, 2));

  if (resp.Payload) {
    return JSON.parse(Buffer.from(resp.Payload).toString());
  }

  return {
    statusCode: 500,
    headers: { "Content-Type": "text/plain" },
    body: `Internal Server Error :(`
  };
};