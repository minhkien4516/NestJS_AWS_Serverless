import { ConfigService } from '@nestjs/config';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DynamoService {
  private readonly logger = new Logger(DynamoService.name);
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor(private readonly configService: ConfigService) {
    this.client = new DynamoDBClient({
      region: this.configService.get<string>('COGNITO_REGION'),
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async createItem(
    tableName: string,
    item: Record<string, any>,
    conditionExpression?: string,
  ) {
    const params: any = {
      TableName: tableName,
      Item: item,
    };
    if (conditionExpression) params.ConditionExpression = conditionExpression;
    try {
      return await this.docClient.send(new PutCommand(params));
    } catch (error) {
      this.logger.error('createItem error: ' + error);
      throw error;
    }
  }

  async getItem(tableName: string, key: Record<string, any>) {
    const params = {
      TableName: tableName,
      Key: key,
    };
    try {
      return await this.docClient.send(new GetCommand(params));
    } catch (error) {
      this.logger.error('getItem error: ' + error);
      throw error;
    }
  }

  async queryByPK(
    tableName: string,
    keyName: string,
    keyValue: string,
    options: {
      skCondition?: {
        expr: string;
        names?: Record<string, string>;
        values?: Record<string, string>;
      };
      indexName?: string;
      limit?: number;
      exclusiveStartKey?: any;
      projection?: string;
    } = {},
  ) {
    try {
      let keyCondition = `#pk = :pkval`;
      const names: Record<string, string> = { '#pk': keyName };
      const values: Record<string, any> = { ':pkval': keyValue };

      if (options.skCondition) {
        keyCondition += ` AND ${options.skCondition.expr}`;
        Object.assign(names, options.skCondition.names || {});
        Object.assign(values, options.skCondition.values || {});
      }

      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        IndexName: options.indexName,
        Limit: options.limit,
        ExclusiveStartKey: options.exclusiveStartKey,
        ProjectionExpression: options.projection,
      });

      return await this.docClient.send(command);
    } catch (error) {
      this.logger.error('queryByPK error: ' + error);
      throw error;
    }
  }

  async scanTable(tableName: string, limit: number = 10) {
    try {
      const cmd = new ScanCommand({ TableName: tableName, Limit: limit });
      const res = await this.docClient.send(cmd);
      return res.Items || [];
    } catch (err) {
      this.logger.error('scanTable error', err);
      throw err;
    }
  }

  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updates: Record<string, any>,
  ) {
    try {
      const names: Record<string, string> = {};
      const values: Record<string, any> = {};
      const setParts = Object.keys(updates).map((k) => {
        names[`#${k}`] = k;
        values[`:${k}`] = updates[k];
        return `#${k} = :${k}`;
      });

      const cmd = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${setParts.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      });

      const res = await this.docClient.send(cmd);
      return res.Attributes;
    } catch (err) {
      this.logger.error('updateItem error', err);
      throw err;
    }
  }

  async deleteItem(tableName: string, key: Record<string, any>) {
    try {
      return await this.docClient.send(
        new DeleteCommand({ TableName: tableName, Key: key }),
      );
    } catch (err) {
      this.logger.error('deleteItem error', err);
      throw err;
    }
  }

  async batchWrite(tableName: string, items: Record<string, any>[]) {
    try {
      const requestItems: any = {};
      requestItems[tableName] = items.map((i) => ({ PutRequest: { Item: i } }));
      return await this.docClient.send(
        new BatchWriteCommand({ RequestItems: requestItems }),
      );
    } catch (err) {
      this.logger.error('batchWrite error', err);
      throw err;
    }
  }

  async transactWrite(transactItems: any[]) {
    try {
      return await this.docClient.send(
        new TransactWriteCommand({ TransactItems: transactItems }),
      );
    } catch (err) {
      this.logger.error('transactWrite error', err);
      throw err;
    }
  }

  // Translation
  async saveResult(jobId: string, payload: any) {
    this.logger.log(
      `We have been received ${jobId} from request to saveResult with ${JSON.stringify(payload)}`,
    );
    await this.docClient.send(
      new PutItemCommand({
        TableName: this.configService.get<string>('TRANSLATION_TABLE') || 'Translations',
        Item: {
          jobId: { S: jobId },
          result: { S: JSON.stringify(payload) },
          status: { S: 'COMPLETED' },
          createdAt: { S: new Date().toISOString() },
        },
      }),
    );
  }

  async getResult(jobId: string) {
    const res = await this.docClient.send(
      new GetItemCommand({
        TableName: this.configService.get<string>('TRANSLATION_TABLE'),
        Key: { jobId: { S: jobId } },
      }),
    );
    return res.Item ? JSON.parse(res.Item.result.S!) : null;
  }

  async updateJobResult(jobId: string, status: string, error?: string) {
    const params = {
      TableName: this.configService.get<string>('TRANSLATION_TABLE'),
      Key: { jobId: { S: jobId } },
      UpdateExpression: 'SET #s = :s, #err = :e',
      ExpressionAttributeNames: { '#s': 'status', '#err': 'error' },
      ExpressionAttributeValues: {
        ':s': { S: status },
        ':e': { S: error || '' },
      },
    };
    await this.client.send(new UpdateItemCommand(params));
  }
}
