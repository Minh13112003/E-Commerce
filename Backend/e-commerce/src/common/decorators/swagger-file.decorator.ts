import {
  applyDecorators,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
} from '@nestjs/swagger';

import { DECORATORS } from '@nestjs/swagger/dist/constants';

export const SwaggerImageUpload = <
  TModel extends Type<any>,
>(
  dto: TModel,

  imageFieldName: string = 'image',

  isImageRequired: boolean = false,
) => {
  
  const properties =
    Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES_ARRAY,
      dto.prototype,
    ) || [];

  const requiredFields: string[] = [];

  
  const swaggerProperties = properties.reduce(
    (
      acc: Record<string, any>,
      propertyKey: string,
    ) => {
      /**
       * remove :
       * ':name' -> 'name'
       */
      const key = propertyKey.replace(
        ':',
        '',
      );

      /**
       * Lấy metadata từng field
       */
      const metadata =
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          dto.prototype,
          key,
        );

      if (!metadata) {
        return acc;
      }

      /**
       * Skip image field nếu DTO có define
       */
      if (key === imageFieldName) {
        return acc;
      }

      /**
       * Detect required
       *
       * @ApiPropertyOptional()
       * => required = false
       */
      if (metadata.required !== false) {
        requiredFields.push(key);
      }

      const propertySchema: Record<
        string,
        any
      > = {
        description:
          metadata.description,

        example: metadata.example,

        default: metadata.default,

        enum: metadata.enum,
      };

      /**
       * ===== ARRAY =====
       */
      if (metadata.isArray) {
        propertySchema.type = 'array';

        /**
         * Array nested DTO
         */
        if (
          isClass(metadata.type)
        ) {
          propertySchema.items = {
            $ref: `#/components/schemas/${metadata.type.name}`,
          };
        }

        /**
         * Primitive array
         */
        else {
          propertySchema.items = {
            type: mapSwaggerType(
              metadata.type,
            ),
          };
        }
      }

      /**
       * ===== NESTED DTO =====
       */
      else if (
        isClass(metadata.type)
      ) {
        propertySchema.$ref = `#/components/schemas/${metadata.type.name}`;
      }

      /**
       * ===== NORMAL FIELD =====
       */
      else {
        propertySchema.type =
          mapSwaggerType(
            metadata.type,
          );
      }

      acc[key] = propertySchema;

      return acc;
    },

    {},
  );

  /**
   * ===== IMAGE FIELD =====
   */
  swaggerProperties[
    imageFieldName
  ] = {
    type: 'string',

    format: 'binary',

    description:
      isImageRequired
        ? 'Image file (required)'
        : 'Image file (optional)',
  };

  return applyDecorators(
    ApiConsumes(
      'multipart/form-data',
    ),

    ApiExtraModels(dto),

    ApiBody({
      description:
        'Multipart/form-data request',

      schema: {
        type: 'object',

        properties:
          swaggerProperties,

        required:
          isImageRequired
            ? [
                ...requiredFields,
                imageFieldName,
              ]
            : requiredFields,
      },
    }),
  );
};

/**
 * =========================
 * Helpers
 * =========================
 */

function mapSwaggerType(
  type: any,
): string {
  switch (type) {
    case String:
      return 'string';

    case Number:
      return 'number';

    case Boolean:
      return 'boolean';

    case Array:
      return 'array';

    case Object:
      return 'object';

    default:
      return 'string';
  }
}

/**
 * Detect class DTO
 */
function isClass(
  value: any,
): boolean {
  return (
    typeof value === 'function' &&
    /^\s*class\s+/.test(
      value.toString(),
    )
  );
}

export function UploadImages(fieldName: string = 'images') {
  return applyDecorators(
    // Interceptor chịu trách nhiệm bóc tách mảng file từ Request
    UseInterceptors(FilesInterceptor(fieldName)),
    // Định nghĩa loại nội dung truyền lên là Multipart Form Data
    ApiConsumes('multipart/form-data'),
    // Định nghĩa cấu trúc cho Swagger UI hiển thị nút Upload nhiều file
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          tours: {
            type: 'string',
            description:
              'Danh sách tour dưới dạng JSON string',

            example: JSON.stringify(
              [
                {
                  name: 'Du lịch Hàn Quốc',
                  price: 15990000,
                  duration: '5 Ngày 4 Đêm',
                },
                {
                  name: 'Du lịch Nhật Bản',
                  price: 18990000,
                  duration: '6 Ngày 5 Đêm',
                },
              ],
              null,
              2,
            ),
          },
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description: 'Danh sách các file ảnh tương ứng theo thứ tự với mảng tours',
          },
        },
        required: ['tours', fieldName],
      },
    }),
  );
}