import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from '../lib/prisma';
import z from "zod";
import {dayjs} from '../lib/dayjs'

import nodemailer from 'nodemailer'

import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";
import { env } from "../env";

export async function createInvite(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites',
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                }),

                body: z.object({ 
                    email: z.string().email(),
                })
            }
        }, 
        async(request) => {

            const { tripId } = request.params
            const {  email   } = request.body
             
            const trip = await prisma.trip.findUnique({
                where : { id : tripId }
            })

            if(!trip ){
                throw new ClientError ('trip not found ')

            }

   

            const participant = await prisma.participant.create({
                data: {
                    email,
                    trip_id: tripId
                }
            })



            
        
        const formatedStartDate = dayjs(trip.start_at).format('LL')
        const formatedEndDate = dayjs(trip.ends_at).format('LL')
        
        const mail = await getMailClient()
            

     
            

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
           
        




            return {  participantId:  participant.id }
        },
    )
}