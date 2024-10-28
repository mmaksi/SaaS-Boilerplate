'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';

import { handleSubmit } from '@/actions/extract-sitemap';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  urls: z.array(z.string().url().refine((url) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname === '/' && !parsedUrl.search && !parsedUrl.hash;
    } catch {
      return false;
    }
  }, {
    message: 'The URL must only contain the domain (no specific pages or paths).',
  })),
});

export default function Component() {
  const [urlCount, setUrlCount] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urls: [''],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const response = await handleSubmit(values);
    toast({
      title: 'Thank you!',
      description: response,
    });
  };

  const addUrlField = useCallback(() => {
    if (urlCount < 15) {
      form.setValue(`urls.${urlCount}`, '');
      setUrlCount(prev => prev + 1);
    }
  }, [urlCount, form]);

  const removeUrlField = useCallback((index: number) => {
    if (urlCount > 1) {
      const newUrls = [...form.getValues().urls];
      newUrls.splice(index, 1);
      form.setValue('urls', newUrls);
      setUrlCount(prev => prev - 1);
    }
  }, [urlCount, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          {form.getValues().urls.map((_, index) => (
            <FormField
              key={`item${uuidv4()}`}
              control={form.control}
              name={`urls.${index}`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <div className="flex-1">
                    <FormLabel>{`URL ${index + 1}`}</FormLabel>
                    <Input type="url" placeholder="https://example.com" {...field} />
                    <FormMessage />
                  </div>
                  {urlCount > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrlField(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="size-5" />
                    </button>
                  )}
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="flex space-x-2">
          {urlCount < 15 && (
            <Button type="button" variant="outline" onClick={addUrlField}>
              <PlusCircle className="mr-2 size-4" />
              Add URL
            </Button>
          )}
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
