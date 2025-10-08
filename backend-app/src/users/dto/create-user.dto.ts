export class CreateUserDTO {
  userId: string; // uuid or generated id
  email: string;
  name?: string;
  phoneNumber?: string; // optional +84...
}
