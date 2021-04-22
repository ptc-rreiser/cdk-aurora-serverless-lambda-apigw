import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand, SqlParameter } from "@aws-sdk/client-rds-data";

const rdsData = new RDSDataClient({});

const createTable = async (): Promise<void> => {
  try {
    const sql = `CREATE TABLE IF NOT EXISTS hello (id int NOT NULL auto_increment, path LONGTEXT NOT NULL, PRIMARY KEY (id));`;
    await rdsData.send(new ExecuteStatementCommand({
      resourceArn: process.env.CLUSTER_ARN,
      secretArn: process.env.SECRET_ARN,
      database: 'workshop',
      sql,
    }));
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$metadata;
    console.error('RDS Data Client: ', { requestId, cfId, extendedRequestId });
  }
}


const savePath = async (path: string): Promise<void> => {
  try {
    const sql = `INSERT INTO hello (path) VALUES (:path);`;
    const parameters: SqlParameter[] = [{
      name: 'path',
      value: { stringValue: path }
    }];
    await rdsData.send(new ExecuteStatementCommand({
      resourceArn: process.env.CLUSTER_ARN,
      secretArn: process.env.SECRET_ARN,
      database: 'workshop',
      sql,
      parameters
    }));
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$metadata;
    console.error('RDS Data Client: ', { requestId, cfId, extendedRequestId });
  }
}

const readPaths = async (): Promise<string[]> => {
  try {
    const sql = `SELECT * FROM hello;`;
    const response = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: process.env.CLUSTER_ARN,
      secretArn: process.env.SECRET_ARN,
      database: 'workshop',
      sql
    }));
    return response.records?.map(record => record[1].stringValue) as string[];
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$metadata;
    console.error('RDS Data Client: ', { requestId, cfId, extendedRequestId });
  }
  return [];
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  await createTable();

  const prevPaths = await readPaths();
  await savePath(event.path);

  let history: string = '';
  if (prevPaths.length > 0) {
    history = `History:\n\t* ${prevPaths.join('\n\t* ')}`;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello, CDK! You've hit ${event.path}\n\n${history}`
  };
};