import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.PELANGGAN)
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: { user_id: string },
  ) {
    return this.ordersService.createOrder(createOrderDto, user.user_id);
  }

  @Get()
  @Roles(UserRole.PELANGGAN)
  findAll(@CurrentUser() user: { user_id: string }) {
    return this.ordersService.findAllByPelanggan(user.user_id);
  }

  @Get('packages')
  @Roles(UserRole.PELANGGAN)
  getPackages() {
    return this.ordersService.getPackages();
  }

  @Get(':id')
  @Roles(UserRole.PELANGGAN)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post('payments')
  @Roles(UserRole.PELANGGAN)
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.ordersService.createPayment(createPaymentDto);
  }

  @Public()
  @Post('payments/callback')
  async handleCallback(@Body() callbackDto: PaymentCallbackDto) {
    return this.ordersService.handlePaymentCallback(callbackDto);
  }

  @Get('royalties/my-royalties')
  @Roles(UserRole.KREATOR)
  getMyRoyalties(@CurrentUser() user: { user_id: string }) {
    return this.ordersService.getRoyaltyForCreator(user.user_id);
  }
}
