# Inter-Bank Communication Protocol Specifications

## Overview
This document specifies the protocol for secure communication between banks in the network. All banks must implement these specifications to ensure secure and reliable transaction processing.

## Security Requirements

### Authentication
- Each bank must register with the Central Bank and receive a unique bank prefix
- Each bank must generate and maintain an RSA key pair
- The public key must be registered with the Central Bank
- All inter-bank communications must be signed using the bank's private key
- Banks must validate incoming requests using the sender's public key obtained from the Central Bank

### JWKS Endpoint
- Each bank must expose a `/.well-known/jwks.json` endpoint
- The endpoint must return the bank's public key in JWKS format
- The JWKS must include:
  - Key type (kty)
  - Key ID (kid) - must match the bank's prefix
  - Algorithm (alg)
  - Usage (use)
  - Modulus (n)
  - Exponent (e)

## API Endpoints

### External Transaction Endpoint
`POST /api/v1/transactions/external`

Request body:
```json
{
  "transactionId": "string",
  "fromAccount": "string",
  "toAccount": "string",
  "amount": "number",
  "currency": "string",
  "description": "string",
  "signature": "string"
}
```

Headers:
```
Authorization: Bearer <jwt_token>
X-Bank-ID: <sender_bank_prefix>
```

Response:
```json
{
  "status": "string",
  "transactionId": "string",
  "message": "string"
}
```

### Transaction Status Endpoint
`GET /api/v1/transactions/external/{transactionId}`

Headers:
```
Authorization: Bearer <jwt_token>
X-Bank-ID: <sender_bank_prefix>
```

Response:
```json
{
  "transactionId": "string",
  "status": "pending|inProgress|completed|failed",
  "errorMessage": "string"
}
```

## Transaction Flow
1. Source bank validates the transaction request
2. Source bank signs the transaction with its private key
3. Source bank sends the transaction to the destination bank
4. Destination bank validates the signature using source bank's public key
5. Destination bank processes the transaction
6. Destination bank updates the transaction status
7. Source bank can query the transaction status

## Error Handling
- All errors must include appropriate HTTP status codes
- Error responses must include descriptive messages
- Banks must implement retry mechanisms for failed requests
- Maximum of 3 retry attempts with exponential backoff
- Failed transactions must be logged for audit purposes

## Rate Limiting
- Banks must implement rate limiting to prevent abuse
- Recommended: 100 requests per 15-minute window per bank
- Return 429 Too Many Requests when limit is exceeded

## Monitoring
- Banks must log all inter-bank communications
- Logs must include:
  - Transaction IDs
  - Timestamps
  - Request/Response details
  - Error messages
  - Performance metrics
