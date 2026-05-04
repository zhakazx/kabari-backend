export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentResponse {
  paymentId: string;
  virtualAccount?: string;
  qrString?: string;
  amount: number;
  expiredAt: Date;
}

export interface PaymentCallbackData {
  invoiceId: string;
  status: string;
  paidAt?: string;
  referenceNo?: string;
  signature?: string;
}

export interface IPaymentGateway {
  createPayment(request: CreatePaymentRequest): Promise<PaymentResponse>;
  validateCallback(callbackData: PaymentCallbackData, secret: string): boolean;
}
