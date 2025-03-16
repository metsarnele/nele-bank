export interface IBankRegistrationRequest {
  name: string;
  owners: string;
  jwksUrl: string;
  transactionUrl: string;
}

export interface IBankRegistrationResponse {
  apiKey: string;
  transactionUrl: string;
  bankPrefix: string;
  owners: string;
  jwksUrl: string;
  name: string;
}
