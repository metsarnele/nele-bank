import { OpenAPIV3 } from 'openapi-types';

export const schemas: { [key: string]: OpenAPIV3.SchemaObject } = {
  Error: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['error'],
        description: 'Error status'
      },
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Error code'
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field with error'
                },
                message: {
                  type: 'string',
                  description: 'Error message for the field'
                },
                code: {
                  type: 'string',
                  description: 'Error code for the field'
                }
              }
            },
            description: 'Detailed error information'
          }
        }
      }
    }
  },
  UserRegistration: {
    type: 'object',
    required: ['name', 'username', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        pattern: '^[a-zA-Z\s-]+$',
        description: 'Full name (can contain letters, spaces, and hyphens)'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$',
        description: 'Username can only contain letters, numbers, underscores, and hyphens'
      },
      password: {
        type: 'string',
        minLength: 8,
        pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])',
        description: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
      }
    }
  },
  UserLogin: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string',
        description: 'Username for login'
      },
      password: {
        type: 'string',
        format: 'password',
        description: 'User password'
      }
    }
  },
  Account: {
    type: 'object',
    required: ['id', 'accountNumber', 'userId', 'currency', 'balance'],
    properties: {
      id: {
        type: 'integer',
        description: 'Account ID'
      },
      accountNumber: {
        type: 'string',
        maxLength: 20,
        description: 'Unique account number'
      },
      userId: {
        type: 'integer',
        description: 'Owner user ID'
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Account currency'
      },
      balance: {
        type: 'number',
        minimum: 0,
        description: 'Current balance'
      },
      createdAt: {
        type: 'string',
        format: 'date-time'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time'
      }
    }
  },
  CreateAccount: {
    type: 'object',
    required: ['currency'],
    properties: {
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Currency for the new account'
      }
    }
  },
  AccountCurrencyUpdate: {
    type: 'object',
    required: ['currency'],
    properties: {
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'New currency for the account'
      }
    }
  },
  AccountCurrencyUpdateResponse: {
    type: 'object',
    required: ['message', 'account', 'conversionRate'],
    properties: {
      message: {
        type: 'string',
        example: 'Account currency updated successfully'
      },
      account: {
        type: 'object',
        required: ['name', 'balance', 'currency', 'number'],
        properties: {
          name: {
            type: 'string',
            description: 'Account holder name'
          },
          balance: {
            type: 'number',
            description: 'Updated account balance in new currency'
          },
          currency: {
            type: 'string',
            enum: ['EUR', 'USD', 'GBP'],
            description: 'New account currency'
          },
          number: {
            type: 'string',
            description: 'Account number'
          }
        }
      },
      conversionRate: {
        type: 'string',
        description: 'Exchange rate used for conversion'
      }
    }
  },
  InternalTransfer: {
    type: 'object',
    required: ['fromAccountId', 'toAccount', 'amount', 'currency', 'type'],
    properties: {
      fromAccountId: {
        type: 'integer',
        description: 'Source account ID',
        example: 1
      },
      toAccount: {
        type: 'string',
        maxLength: 20,
        description: 'Destination account number',
        example: '1234567890'
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Transfer amount',
        example: 100.50
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Currency of the transfer (must match both accounts)',
        example: 'EUR'
      },
      description: {
        type: 'string',
        maxLength: 200,
        description: 'Optional transfer description',
        example: 'Rent payment'
      },
      type: {
        type: 'string',
        enum: ['internal'],
        description: 'Transaction type'
      }
    },
    example: {
      fromAccountId: 1,
      toAccount: '1234567890',
      amount: 100.50,
      currency: 'EUR',
      description: 'Rent payment',
      type: 'internal'
    }
  },

  ExternalTransfer: {
    type: 'object',
    required: ['fromAccountId', 'toAccount', 'toBankId', 'amount', 'currency', 'type'],
    properties: {
      fromAccountId: {
        type: 'integer',
        description: 'Source account ID',
        example: 1
      },
      toAccount: {
        type: 'string',
        maxLength: 20,
        description: 'Destination account number',
        example: 'EE123456789'
      },
      toBankId: {
        type: 'string',
        maxLength: 10,
        description: 'Destination bank ID',
        example: 'CITIUS33'
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Transfer amount',
        example: 500.00
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Currency of the transfer',
        example: 'EUR'
      },
      description: {
        type: 'string',
        maxLength: 200,
        description: 'Optional transfer description',
        example: 'International payment'
      },
      type: {
        type: 'string',
        enum: ['external'],
        description: 'Transaction type'
      }
    },
    example: {
      fromAccountId: 1,
      toAccount: 'EE123456789',
      toBankId: 'CITIUS33',
      amount: 500.00,
      currency: 'EUR',
      description: 'International payment',
      type: 'external'
    }
  },

  TransactionStatus: {
    type: 'string',
    enum: ['pending', 'inProgress', 'completed', 'failed'],
    description: 'Transaction status:\n- pending: Initial state, transaction is created but not yet processed\n- inProgress: Transaction is being processed (e.g., external bank transfer)\n- completed: Transaction has been successfully processed\n- failed: Transaction failed due to an error (see errorMessage)',
    example: 'completed'
  },

  TransactionResponse: {
    type: 'object',
    required: ['transactionId', 'status'],
    properties: {
      transactionId: {
        type: 'string',
        format: 'uuid',
        description: 'Unique transaction identifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      status: {
        $ref: '#/components/schemas/TransactionStatus'
      },
      errorMessage: {
        type: 'string',
        description: 'Error message if transaction failed',
        example: 'Insufficient funds'
      },
      amount: {
        type: 'number',
        description: 'Transaction amount',
        example: 100.50
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Transaction currency',
        example: 'EUR'
      },
      fromAccount: {
        type: 'string',
        description: 'Source account number',
        example: '1234567890'
      },
      toAccount: {
        type: 'string',
        description: 'Destination account number',
        example: '9876543210'
      },
      description: {
        type: 'string',
        description: 'Transaction description',
        example: 'Monthly rent payment'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Transaction creation timestamp',
        example: '2025-03-16T11:05:00Z'
      },
      completedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Transaction completion timestamp',
        example: '2025-03-16T11:05:02Z'
      }
    },
    example: {
      transactionId: '123e4567-e89b-12d3-a456-426614174002',
      status: 'completed',
      amount: 1000.00,
      currency: 'EUR',
      fromAccount: '1234567890',
      toAccount: '9876543210',
      description: 'Investment transfer',
      createdAt: '2025-03-16T11:05:00Z',
      completedAt: '2025-03-16T11:05:02Z'
    }
  },

  TransferRequest: {
    type: 'object',
    required: ['fromAccountId', 'toAccount', 'amount', 'currency', 'type'],
    properties: {
      fromAccountId: {
        type: 'integer',
        description: 'Source account ID',
        example: 1
      },
      toAccount: {
        type: 'string',
        maxLength: 20,
        description: 'Destination account number',
        example: '1234567890'
      },
      toBankId: {
        type: 'string',
        maxLength: 10,
        description: 'Destination bank ID (only for external transfers)',
        example: 'CITIUS33'
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Transfer amount',
        example: 100.50
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Currency of the transfer (must match both accounts for internal transfers)',
        example: 'EUR'
      },
      description: {
        type: 'string',
        maxLength: 200,
        description: 'Optional transfer description',
        example: 'Rent payment'
      },
      type: {
        type: 'string',
        enum: ['internal', 'external'],
        description: 'Type of transfer'
      }
    },
    example: {
      fromAccountId: 1,
      toAccount: '1234567890',
      amount: 100.50,
      currency: 'EUR',
      description: 'Rent payment',
      type: 'internal'
    }
  },
  TransferResponse: {
    type: 'object',
    required: ['transactionId', 'status', 'amount', 'currency', 'fromAccount', 'toAccount'],
    properties: {
      transactionId: {
        type: 'string',
        format: 'uuid',
        description: 'Unique transaction identifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'failed'],
        description: 'Transaction status'
      },
      amount: {
        type: 'number',
        description: 'Transfer amount',
        example: 100.50
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Transfer currency',
        example: 'EUR'
      },
      fromAccount: {
        type: 'string',
        description: 'Source account number',
        example: '1234567890'
      },
      toAccount: {
        type: 'string',
        description: 'Destination account number',
        example: '9876543210'
      },
      toBankId: {
        type: 'string',
        description: 'Destination bank ID (only for external transfers)',
        example: 'CITIUS33'
      },
      description: {
        type: 'string',
        description: 'Transfer description',
        example: 'Rent payment'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Transaction creation timestamp'
      },
      completedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Transaction completion timestamp'
      },
      errorMessage: {
        type: 'string',
        description: 'Error message if transaction failed'
      }
    },
    example: {
      transactionId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'completed',
      amount: 100.50,
      currency: 'EUR',
      fromAccount: '1234567890',
      toAccount: '9876543210',
      description: 'Rent payment',
      createdAt: '2025-03-16T11:05:00Z',
      completedAt: '2025-03-16T11:05:02Z'
    }
  },
  B2BTransactionRequest: {
    type: 'object',
    required: ['transactionId', 'fromAccount', 'toAccount', 'amount', 'currency', 'signature'],
    properties: {
      transactionId: {
        type: 'string',
        format: 'uuid',
        description: 'Unique transaction identifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      fromAccount: {
        type: 'string',
        maxLength: 20,
        description: 'Source account number',
        example: 'EE987654321'
      },
      toAccount: {
        type: 'string',
        maxLength: 20,
        description: 'Destination account number',
        example: '1234567890'
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Transfer amount',
        example: 1000.00
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Transaction currency',
        example: 'EUR'
      },
      description: {
        type: 'string',
        maxLength: 200,
        description: 'Optional transfer description',
        example: 'B2B Payment for Services'
      },
      signature: {
        type: 'string',
        description: 'Transaction signature for verification',
        example: 'base64_encoded_signature_here'
      }
    },
    example: {
      transactionId: '123e4567-e89b-12d3-a456-426614174000',
      fromAccount: 'EE987654321',
      toAccount: '1234567890',
      amount: 1000.00,
      currency: 'EUR',
      description: 'B2B Payment for Services',
      signature: 'base64_encoded_signature_here'
    }
  },

};
