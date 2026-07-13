import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponsePayload<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponsePayload<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponsePayload<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
