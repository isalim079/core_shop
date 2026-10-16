import { ApiProperty } from '@nestjs/swagger';

export class LivenessResponseDto {
  @ApiProperty({ enum: ['ok'] }) status!: 'ok';
  @ApiProperty({ enum: ['core-shop-server'] }) service!: 'core-shop-server';
}
export class ReadinessResponseDto {
  @ApiProperty({ enum: ['ready'] }) status!: 'ready';
  @ApiProperty({ enum: ['core-shop-server'] }) service!: 'core-shop-server';
}
