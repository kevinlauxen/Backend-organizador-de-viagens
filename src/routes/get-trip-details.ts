import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from '../lib/prisma';
import z from "zod";
import { ClientError } from "../errors/client-error";


export async function getTripsDetails(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId',
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                })


            }
        }, 
        async(request) => {

            const { tripId } = request.params
           
             
            const trip = await prisma.trip.findUnique({
                select: {
                    id:true,
                    destination: true,
                    start_at:true,
                    ends_at: true,
                    is_confirmed: true,
                    participants:true,
                },
                where : { id : tripId }
            })

            if(!trip ){
                throw new ClientError ('trip not found ')

            }

          
                    

            return { trip }
        },
    )
}