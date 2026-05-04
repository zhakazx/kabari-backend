import { createHmac } from 'crypto';
import {
  IPaymentGateway,
  CreatePaymentRequest,
  PaymentResponse,
  PaymentCallbackData,
} from '../interfaces/payment-gateway.interface';

export class MockPaymentGateway implements IPaymentGateway {
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    return {
      paymentId: `mock_${Date.now()}`,
      virtualAccount: `VA${Math.random().toString(36).substring(2, 10)}`,
      amount: request.amount,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  validateCallback(callbackData: PaymentCallbackData, secret: string): boolean {
    const payload = `${callbackData.invoiceId}:${callbackData.status}:${callbackData.referenceNo || ''}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return expectedSignature === callbackData.signature;
  }
}
