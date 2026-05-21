import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { FLOCI_ENDPOINT } from '../config'

export function createDynamoClient() {
  return new DynamoDBClient({
    endpoint: FLOCI_ENDPOINT,
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  })
}

export const dynamoClient = createDynamoClient()
