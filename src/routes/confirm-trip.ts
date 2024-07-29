import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";



import { z } from "zod"
import { prisma } from "../lib/prisma";
import { dayjs }  from "../lib/dayjs";
import { getMailClient } from "../lib/mail";

import nodemailer from 'nodemailer'
import { ClientError } from "../errors/client-error";
import { env } from "../env";

export async function confirmTrip(app: FastifyInstance){


    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm'  ,{
        schema : {
            params : z.object ({
              tripId: z.string().uuid()
            })
        },
    } 
    , async (request, reply ) => {

        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId,
            },
            include: {
               participants: {
                where: {
                    is_confirmed: false,
                }
               }
            }
        })


        if(!trip) {
            throw new ClientError('Trip not found')
        }

        if(trip.is_confirmed) {
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
        }

        await prisma.trip.update({
            where: { id: tripId },
            data: { is_confirmed:  true },
        })

        

        // const participants = await prisma.participant.findMany({
        //     where: {
        //         trip_id: tripId,
        //         is_owner: false, 
        //     }
        // })

       


        await Promise.all(
            trip.participants.map(async(participant) =>{

                 const confirmationLink =`${env.API_BASE_URL}/participants/${participant.id}/confirm`

                const message = await mail.sendMail({
                    from: {
                        name: 'Equipe Planos', 
                        address: 'oi@outlook.com',
                    },
                    to: participant.email,
                
                    subject: `Confirme sua presença na viagem para ${trip.destination} em ${formatedStartDate} `,
                    html: 
                    ` 
            <div style="font-family: sans-serif; font-size: 16px; line-height:1.6;">   
                <p>Você foi convidadado para uma viagem para <strong>${trip.destination}</strong>, nas datas de a <strong>${formatedStartDate}</strong> até <strong>${formatedEndDate}</strong> </p>
        
                <p> para confirmar a sua presença na viagem clique no link abaixo</p>
                <p></p>
        
                <p>
                <a href=${confirmationLink}">Confirmar</a>
                </p>
                
                <p>Caso você não saiba do que se trata apenas ignore o email </p>
             </div>
                                `
                     .trim()
                 })
                    console.log(nodemailer.getTestMessageUrl(message))
            } )
        )

        
        const formatedStartDate = dayjs(trip.start_at).format('LL')
        const formatedEndDate = dayjs(trip.ends_at).format('LL')
        
        const mail = await getMailClient()


       

        return  reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`) 
    })
}