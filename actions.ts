
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addData as dbAddData, updateSchema as dbUpdateSchema } from '@/lib/store';
import type { FieldDefinition, Schema } from '@/lib/types';
import { suggestDataValidationRules } from '@/ai/flows/suggest-data-validation-rules';

const fieldDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Programmatic name is required.'),
  label: z.string().min(1, 'Label is required.'),
  type: z.enum(['text', 'number', 'email', 'date', 'select']),
  validations: z.array(z.string()),
  options: z.array(z.string()).optional(),
});

const schemaSchema = z.array(fieldDefinitionSchema);

export async function updateSchema(newSchema: unknown) {
  try {
    const validatedSchema = schemaSchema.parse(newSchema);
    dbUpdateSchema(validatedSchema);
    revalidatePath('/(main)/schema', 'page');
    revalidatePath('/(main)/data-entry', 'page');
    revalidatePath('/(main)/data-viewer', 'page');
    return { success: true, message: 'Schema updated successfully!' };
  } catch (error) {
    return { success: false, error: 'Invalid schema format.' };
  }
}

export async function addData(data: Record<string, any>) {
  // In a real app, you'd validate data against the current schema here
  dbAddData(data);
  revalidatePath('/(main)/data-viewer', 'page');
  return { success: true, message: 'Data added successfully!' };
}

export async function suggestRules(fieldName: string, dataType: string) {
  if (!fieldName || !dataType) {
    return { success: false, error: 'Field name and data type are required.' };
  }
  try {
    const result = await suggestDataValidationRules({ fieldName, dataType });
    return { success: true, suggestions: result.suggestedRules };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get AI suggestions.' };
  }
}
