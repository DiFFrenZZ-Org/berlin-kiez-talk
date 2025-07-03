import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  title: z.string().min(1, 'Give your party a fun name'),
  eventType: z.string().min(1, 'Pick a type'),
  dateTime: z.string().min(1, 'When does the fun start?'),
  duration: z
    .number({ invalid_type_error: 'Duration required' })
    .min(0.5, 'Too short')
    .max(22, 'Max 22 hours'),
  location: z.string().min(1, 'Where is it?'),
  capacity: z
    .number({ invalid_type_error: 'Capacity required' })
    .min(1, 'At least 1')
    .max(50, 'Max 50'),
  coverPrice: z
    .preprocess(v => (v === '' || v === null ? 0 : Number(v)), z.number().min(0))
    .optional(),
  provideRefreshments: z.boolean().optional(),
  dressCode: z.string().optional(),
  tags: z.string().optional(),
  minAge: z.preprocess(v => (v === '' || v === null ? undefined : Number(v)), z.number().optional()),
  minRating: z.preprocess(v => (v === '' || v === null ? undefined : Number(v)), z.number().optional()),
  districts: z.string().optional(),
  contributions: z.string().optional(),
});

export type PartyFormValues = z.infer<typeof formSchema>;

const stepFields: (keyof PartyFormValues)[][] = [
  ['title', 'eventType'],
  ['dateTime', 'duration', 'location'],
  ['capacity', 'coverPrice', 'provideRefreshments', 'dressCode'],
  ['tags', 'minAge', 'minRating', 'districts', 'contributions'],
  [],
];

export const CreatePartyForm = ({ onSubmit }: { onSubmit: (v: PartyFormValues) => void }) => {
  const form = useForm<PartyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      eventType: '',
      dateTime: '',
      duration: 1,
      location: '',
      capacity: 10,
      coverPrice: 0,
      provideRefreshments: false,
      dressCode: '',
      tags: '',
      minAge: undefined,
      minRating: undefined,
      districts: '',
      contributions: '',
    },
  });
  const [step, setStep] = useState(0);
  const steps = ['Basic Info', 'When & Where', 'Details', 'Extras', 'Publish'];

  const nextStep = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const submit = form.handleSubmit(values => {
    onSubmit(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6">
        <h2 className="text-xl font-bold text-white">{steps[step]}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What's your party called?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a vibe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">House Party</SelectItem>
                      <SelectItem value="concert">Concert</SelectItem>
                      <SelectItem value="games">Game Night</SelectItem>
                      <SelectItem value="chess">Chess Tournament</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When does the fun start?</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" min="0.5" max="22" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Where&apos;s it happening? (Neighborhood or address)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How many people can come? (Max 50)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover charge per person (€) – or leave blank if free</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="provideRefreshments"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">I&apos;ll provide some drinks and snacks</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dressCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dress Code (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Costume party? Casual?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="techno, outdoor, games" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum age</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum user rating</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" max="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="districts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District restrictions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Kreuzberg only" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contributions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contributions needed</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Need 2 folding chairs, €50 for DJ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-white">
            <p>Almost done! Hit publish when you&apos;re ready.</p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit">Publish</Button>
          )}
        </div>
      </form>
    </Form>
  );
};

