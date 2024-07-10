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
          owner_email: z.string().email(),
          emails_to_invite: z.array(z.string().email())
        })
      }
    }, async (request, reply) => {
      const {destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite} = request.body

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error('Invalid Trip date')
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error('Invalid Trip date')
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  name: owner_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true
                },
                ...emails_to_invite.map(email => {
                  return {email}
                })
              ],
            }
          }
        }
      })

      const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`

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
        html: `
          <p>Confirme sua viagem para ${destination}!</p>
          <a href="${confirmationLink}">Confirmar</a>
          `.trim()
      })

      console.log(nodemailer.getTestMessageUrl(message))
    })
}