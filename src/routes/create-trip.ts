import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";
import {z} from "zod";
import dayjs from "dayjs";
import {prisma} from "../lib/prisma";
import {getMailClient} from "../lib/mail";
import nodemailer from "nodemailer";

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
      const {destination, starts_at, ends_at, owner_name, owner_email} = request.body

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

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: 'Equipe Plann.er',
          address: 'oi@plann.er'
        },
        to: {
          name: owner_name,
          address: owner_email
        },
        subject: 'Novo planejamento de viagem com a Plann.er',
        html: 'Confirme seu planejamento de viagem!'
      })

      console.log(nodemailer.getTestMessageUrl(message))
    })
}