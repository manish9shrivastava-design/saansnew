'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { FieldDefinition, Schema } from '@/lib/types';

// In-memory store for schema and data
let schema: Schema = [];
let data: Record<string, any>[] = [];

const fieldDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Programmatic name is required.'),
  label: z.string().min(1, 'Label is required.'),
  type: z.enum(['text', 'number', 'email', 'date', 'select']),
  validations: z.array(z.string()),
  options: z.array(z.string()).optional(),
});

const schemaSchema = z.array(fieldDefinitionSchema);

export async function getSchema() {
  return schema;
}

export async function getData() {
  return data;
}

export async function updateSchema(newSchema: unknown) {
  try {
    const validatedSchema = schemaSchema.parse(newSchema);
    schema = validatedSchema;
    revalidatePath('/(main)/schema', 'page');
    revalidatePath('/(main)/data-entry', 'page');
    revalidatePath('/(main)/data-viewer', 'page');
    return { success: true, message: 'Schema updated successfully!' };
  } catch (error) {
    return { success: false, error: 'Invalid schema format.' };
  }
}

export async function addData(newData: Record<string, any>) {
  // In a real app, you'd validate data against the current schema here
  data.push(newData);
  revalidatePath('/(main)/data-viewer', 'page');
  return { success: true, message: 'Data added successfully!' };
}

export async function suggestRules(fieldName: string, dataType: string) {
  if (!fieldName || !dataType) {
    return { success: false, error: 'Field name and data type are required.' };
  }
  // AI functionality is temporarily disabled.
  return { success: true, suggestions: [] };
}

export async function addDataFromActions(data: Record<string,any>) {
    console.log("Adding data:", data)
    // In a real application, you would save the data to a database
    // and return a success or error message.
    try {
        // Simulate a successful database operation
        return { success: true, message: "Data added successfully." };
    } catch (error) {
        // Simulate an error
        return { success: false, message: "Failed to add data." };
    }
}
