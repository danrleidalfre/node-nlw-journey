import fastify from "fastify";
import {prisma} from "./lib/prisma";

const app = fastify()

app.get('/', async () => {
  return prisma.trip.findMany();
})

app.listen({port: 3333}).then(() => {
  console.log("Server Running...")
})