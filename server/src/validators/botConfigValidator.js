import { z } from 'zod';

export const updateBotConfigSchema = z.object({
  botName: z.string().min(1).max(100).optional(),
  instructions: z.string().max(5000).optional(),
  faqs: z.array(
    z.object({
      question: z.string().min(1).max(500),
      answer: z.string().min(1).max(1000),
    })
  ).max(20).optional(),
});
