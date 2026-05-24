import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateCategoryDTO } from "./create-category.dto";
import { IsOptional, IsString } from "class-validator";

export class UpdateCategoryDTO extends PartialType(CreateCategoryDTO) {
    
}