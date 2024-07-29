import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";


import { dayjs } from '../lib/dayjs';


import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";





export async function updateTrip(app: FastifyInstance){


    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId'  ,{
        
        schema : {
            params: z.object({
                tripId : z.string().uuid(),
            }),

            body : z.object ({
                destination: z.string().min(4),
                start_at:  z.coerce.date(),
                ends_at: z.coerce.date(),
                
            })
        },
    } 
    , async (request) => {

        const { tripId } = request.params
        const { destination , start_at , ends_at } = request.body
        


        const trip = await prisma.trip.findUnique( {
            where: { id: tripId }
        })
       //Validação de datas  

       if(!trip ){
        throw new ClientError ('trip not found ')

    }

        if(dayjs(start_at).isBefore(new Date())){
            throw new ClientError('Invalid trip start date')
        }
        
        if(dayjs(ends_at).isBefore(start_at)){
            throw new ClientError('Invalid trip end date')
        }

        // armazenando a viagem

     
        await prisma.trip.update({ 
            where: { id: tripId} ,
            data: {
                destination,
                start_at,
                ends_at,
            
            }
        })

        return  {  tripId:  trip.id  }
    })
}