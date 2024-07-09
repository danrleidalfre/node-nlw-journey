import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";
import {z} from "zod";
import dayjs from "dayjs";
import {prisma} from "../lib/prisma";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>()
    .post('/trips', {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          owner_email: z.string().email()
        })
      }
    }, async (request, reply) => {
      const {destination, starts_at, ends_at} = request.body

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error('Invalid Trip date')
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error('Invalid Trip date')
      }

      await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at
        }
      })
    })
}