'use client';

import React, { useState, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Trash2, Wand2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Schema } from '@/lib/types';
import { updateSchema, suggestRules } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { ScrollArea } from './scroll-area';

const fieldDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(), // This will be derived from label
  label: z.string().min(1, 'Label cannot be empty.'),
  type: z.enum(['text', 'number', 'email', 'date', 'select']),
  validations: z.string(), // Stored as a comma-separated string for easy editing
  options: z.string().optional(), // Stored as a comma-separated string
});

const schemaFormSchema = z.object({
  fields: z.array(fieldDefinitionSchema),
});

type SchemaFormValues = z.infer<typeof schemaFormSchema>;

const toCamelCase = (str: string) => {
  return str.replace(/[^a-zA-Z0-9]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '').replace(/^./, (match) => match.toLowerCase());
};

export function SchemaEditor({ initialSchema }: { initialSchema: Schema }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionTarget, setSuggestionTarget] = useState<{ fieldIndex: number, fieldName: string, dataType: string } | null>(null);
  const newFieldId = React.useId();
  
  const form = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: {
      fields: initialSchema.map(field => ({
        ...field,
        type: field.type as 'text' | 'number' | 'email' | 'date' | 'select',
        validations: field.validations.join(', '),
        options: field.options?.join(', '),
      })),
    },
  });

  const { control, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const watchedFields = watch('fields');

  const onSubmit = (data: SchemaFormValues) => {
    startTransition(async () => {
      const formattedSchema = data.fields.map(field => ({
        ...field,
        name: toCamelCase(field.label),
        validations: field.validations.split(',').map(v => v.trim()).filter(Boolean),
        options: field.options?.split(',').map(v => v.trim()).filter(Boolean),
      }));

      const result = await updateSchema(formattedSchema as Schema);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  };

  const handleAddFeld = () => {
    append({
      id: newFieldId,
      label: '',
      name: '',
      type: 'text',
      validations: '',
      options: '',
    });
  };

  const handleSuggestRules = async (fieldIndex: number) => {
    const field = form.getValues(`fields.${fieldIndex}`);
    if (!field.label) {
        toast({ title: 'Cannot Suggest', description: 'Please provide a field label first.', variant: 'destructive' });
        return;
    }
    setSuggestionTarget({ fieldIndex, fieldName: field.label, dataType: field.type });
    setIsSuggesting(true);
    const result = await suggestRules(field.label, field.type);
    if(result.success && result.suggestions) {
        setAiSuggestions(result.suggestions);
    } else {
        toast({ title: 'AI Suggestion Failed', description: result.error, variant: 'destructive' });
        setAiSuggestions([]);
    }
    setIsSuggesting(false);
  };
  
  const addSuggestionToField = (suggestion: string) => {
    if (suggestionTarget === null) return;
    const currentValidations = form.getValues(`fields.${suggestionTarget.fieldIndex}.validations`);
    const newValidations = currentValidations ? `${currentValidations}, ${suggestion}` : suggestion;
    form.setValue(`fields.${suggestionTarget.fieldIndex}.validations`, newValidations);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 items-start">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`fields.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., First Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fields.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name={`fields.${index}.validations`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validation Rules</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="e.g., required, minLength:2" {...field} />
                              </FormControl>
                              <Button type="button" variant="outline" size="icon" onClick={() => handleSuggestRules(index)} aria-label="Suggest validation rules">
                                  <Wand2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormDescription>Comma-separated rules (e.g. required, email, min:5, max:100, pattern:/^[A-Za-z]+$/).</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    {watchedFields[index].type === 'select' && (
                       <FormField
                        control={form.control}
                        name={`fields.${index}.options`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Options</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Option 1, Option 2" {...field} />
                            </FormControl>
                             <FormDescription>Comma-separated options for the select field.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={handleAddFeld}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Field
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Schema
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={suggestionTarget !== null} onOpenChange={() => setSuggestionTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Validation Suggestions</DialogTitle>
            <DialogDescription>
              Suggestions for "{suggestionTarget?.fieldName}" ({suggestionTarget?.dataType}). Click to add.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72">
            <div className="p-4">
                {isSuggesting ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {aiSuggestions.length > 0 ? aiSuggestions.map((suggestion, i) => (
                            <Button key={i} variant="outline" className="w-full justify-start" onClick={() => addSuggestionToField(suggestion)}>
                                {suggestion}
                            </Button>
                        )) : <p className="text-sm text-muted-foreground text-center">No suggestions available.</p>}
                    </div>
                )}
            </div>
          </ScrollArea>
           <DialogFooter>
            <Button variant="ghost" onClick={() => setSuggestionTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
