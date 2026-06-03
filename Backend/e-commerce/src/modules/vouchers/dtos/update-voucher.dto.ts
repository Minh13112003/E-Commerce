import { PartialType } from '@nestjs/swagger';
import { CreateVoucherDTO } from './create-voucher.dto';

export class UpdateVoucherDTO extends PartialType(CreateVoucherDTO) {}
