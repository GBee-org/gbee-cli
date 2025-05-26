// parameter type from OpenAPI spec
export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema?: {
    type: string;
    format?: string;
    example?: any;
    enum?: string[];
    items?: {
      type: string;
      format?: string;
      example?: any;
      enum?: string[];
    };
  };
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: 'form' | 'simple' | 'matrix' | 'label' | 'spaceDelimited' | 'pipeDelimited'; // The style of the parameter
  explode?: boolean;
  content?: {
    [mediaType: string]: {
      schema: {
        type: string;
        format?: string;
        example?: any;
        enum?: string[];
        items?: {
          type: string;
          format?: string;
          example?: any;
          enum?: string[];
        };
      };
    };
  };
  schemaRef?: string;
}
