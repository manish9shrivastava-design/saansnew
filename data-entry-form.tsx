'use client';

import React, { useMemo, useTransition } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Schema } from '@/lib/types';
import { addData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

function buildZodSchema(schema: Schema) {
  const shape: Record<string, z.ZodType<any, any>> = {};

  schema.forEach(field => {
    let validator: z.ZodType<any, any>;

    // Initialize validator based on type
    switch (field.type) {
      case 'number':
        validator = z.coerce.number({ error: 'Must be a number' });
        break;
      case 'date':
        validator = z.coerce.date({ error: 'Invalid date' });
        break;
      case 'email':
        validator = z.string().email({ message: 'Invalid email address' });
        break;
      case 'select':
        validator = z.string();
        break;
      default:
        validator = z.string();
    }
    
    let isRequired = false;
    // Apply validations
    field.validations.forEach(ruleStr => {
        const [rule, value] = ruleStr.split(':');
        try {
            switch(rule) {
                case 'required':
                    isRequired = true;
                    break;
                case 'minLength':
                    if (validator instanceof z.ZodString) validator = validator.min(parseInt(value, 10));
                    break;
                case 'maxLength':
                    if (validator instanceof z.ZodString) validator = validator.max(parseInt(value, 10));
                    break;
                case 'min':
                    if (validator instanceof z.ZodNumber) validator = validator.min(parseInt(value, 10));
                    break;
                case 'max':
                    if (validator instanceof z.ZodNumber) validator = validator.max(parseInt(value, 10));
                    break;
                case 'email':
                    if (validator instanceof z.ZodString) validator = validator.email();
                    break;
                case 'pattern':
                    if (validator instanceof z.ZodString) validator = validator.regex(new RegExp(value));
                    break;
            }
        } catch (e) {
            console.warn(`Could not apply validation rule: ${ruleStr}`, e);
        }
    });

    if (field.type === 'string' && isRequired) {
        validator = (validator as z.ZodString).min(1, 'This field is required');
    }
     if (field.type === 'select' && isRequired) {
        validator = (validator as z.ZodString).min(1, 'This field is required');
    }
    
    if (!isRequired) {
      validator = validator.optional().or(z.literal(''));
      if (field.type === 'number') {
        validator = validator.or(z.literal(null).optional());
      }
    } else if (field.type !== 'string') {
       validator = validator.refine(val => val !== null && val !== undefined && val !== '', { message: 'This field is required' });
    }

    shape[field.name] = validator;
  });

  return z.object(shape);
}

export function DataEntryForm({ schema }: { schema: Schema }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const validationSchema = useMemo(() => buildZodSchema(schema), [schema]);

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: schema.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
  });

  const onSubmit = (values: z.infer<typeof validationSchema>) => {
    startTransition(async () => {
      const result = await addData(values);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        form.reset();
      } else {
        toast({ title: 'Error', description: 'Failed to add data.', variant: 'destructive' });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {schema.map(field => (
          <FormField
            key={field.id}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {field.type === 'select' ? (
                     <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                       <SelectContent>
                         {field.options?.map(option => (
                           <SelectItem key={option} value={option}>{option}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                  ) : (
                    <Input
                      type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      placeholder={`Enter ${field.label}`}
                      {...formField}
                      value={formField.value || ''}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Add Record
          </Button>
        </div>
      </form>
    </Form>
  );
}
