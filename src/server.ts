import fastify from "fastify"

import { createTrip } from "./routes/create-trip"
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"

import { confirmTrip } from "./routes/confirm-trip"
import cors from "@fastify/cors"



import { confirmParticipants } from "./routes/confirm-participants"
import { createActivity } from "./routes/create-activity"
import { getActivities } from "./routes/get-activities"
import { createLink } from "./routes/create-link"
import { getLinks } from "./routes/get-links"
import { getParticipants } from "./routes/get-participants"
import { createInvite } from "./routes/create-invite"
import { updateTrip } from "./routes/update-trip"
import { getTripsDetails } from "./routes/get-trip-details"
import { getDetailsPaticipant } from "./routes/get-details-participant"
import { errorHandler } from "./error-handler"
import { env } from "./env"

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)


app.register(createTrip)


app.register(confirmTrip)

app.register(cors, {
    origin: '*'
})

app.register(confirmParticipants)

app.register(createActivity)

app.register(getActivities)

app.register(createLink)

app.register(getLinks)

app.register(getParticipants)

app.register(createInvite)

app.register(updateTrip)

app.register(getTripsDetails)

app.register(getDetailsPaticipant)
/*
app.get ('/listar', async () =>  {
    
    const trips = await prisma.trip.findMany()

    return trips
})


app.get ('/cadastrar', async () => {

    await prisma.trip.create( {
        data: {
                destination: 'flori',
                start_at: new Date(),
                ends_at: new Date(),
        }
    })

    return 'Registro feito'
})*/


app.listen({ port: env.PORT }).then(() => {
    console.log("Server running")
})
