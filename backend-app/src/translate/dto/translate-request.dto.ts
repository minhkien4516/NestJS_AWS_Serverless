import { IsArray, IsString } from 'class-validator';

export class FieldMetadata {
  @IsString()
  fieldid: string;

  @IsString()
  itemPath: string;

  @IsString()
  name: string;

  translate: boolean;
}

export class FieldInput {
  @IsString()
  texttotranslate: string;

  @IsString()
  metadata: FieldMetadata;
}

export class TranslateRequestDTO {
  @IsArray()
  targetLanguages: string[];

  @IsString()
  language: string;

  @IsArray()
  fields: FieldInput[];

  @IsString()
  UserRequestedTranslation: string;

  @IsString()
  itemId: string;

  @IsString()
  itemPath: string;
}
