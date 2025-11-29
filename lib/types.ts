export type FieldDefinition = {
  id: string;
  name: string;
  type: string;
  label: string;
  validations: string[];
  options?: string[];
};

export type Schema = FieldDefinition[];

export type DataRecord = Record<string, any>;
