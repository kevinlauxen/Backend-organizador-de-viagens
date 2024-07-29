import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from '../lib/prisma';
import z from "zod";
import dayjs from "dayjs";
import { ClientError } from "../errors/client-error";

export async function getActivities(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activies',
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
                where : { id : tripId },
                include: { activities: 
                    { 
                    
                        orderBy: {
                            occurs_at: 'asc'
                        }
                    }
                }
            })

            if(!trip ){
                throw new ClientError ('trip not found ')

            }

            const differenceinDaysBetweenTripStartAndEndDate = dayjs(trip.ends_at).diff(trip.start_at,'days')

            const activies = Array.from( {length : differenceinDaysBetweenTripStartAndEndDate + 1}).map((_, index) =>{
                const date = dayjs(trip.start_at).add(index, 'days')
           
           

                return{
                    date: date.toDate(),
                    activies: trip.activities.filter(activity => {
                        return dayjs(activity.occurs_at).isSame(date,'day')
                    })
                }
            })
         
                    

            return { activities: activies   }
        },
    )
}