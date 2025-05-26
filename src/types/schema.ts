export interface SchemaProperty {
  type: string;
  example?: any;
}

export interface Schema {
  type: string;
  example?: any;
  properties?: { [key: string]: SchemaProperty };
  items?: SchemaProperty;
}