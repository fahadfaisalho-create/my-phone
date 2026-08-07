import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'موضوع التذكرة مطلوب' })
  subject: string;
}
