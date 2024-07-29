import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"


import { dayjs } from '../lib/dayjs'


import nodemailer from 'nodemailer'
import { prisma } from "../lib/prisma";


import { getMailClient } from "../lib/mail"
import { ClientError } from "../errors/client-error";
import { env } from "../env";



export async function createTrip(app: FastifyInstance){


    app.withTypeProvider<ZodTypeProvider>().post('/trips'  ,{
        schema : {
            body : z.object ({
                destination: z.string({required_error: 'destination is required'}).min(4),
                start_at:  z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name : z.string(),
                owner_email:  z.string().email(),

                emails_to_invite: z.array(z.string().email())
            })
        },
    } 
    , async (request) => {

        const { destination , start_at , ends_at , owner_name , owner_email , emails_to_invite} = request.body


       //Validação de datas  


        if(dayjs(start_at).isBefore(new Date())){
            throw new ClientError('Invalid trip start date')
        }
        
        if(dayjs(ends_at).isBefore(start_at)){
            throw new ClientError('Invalid trip end date')
        }

        // armazenando a viagem





        

        const trip = await prisma.trip.create({
            data: {
                destination,
                start_at,
                ends_at,

                participants: {
                        createMany: {
                            data: [
                              {  
                                email: owner_email,
                                name:  owner_name,
                                is_owner: true,
                                is_confirmed: true,
                              },
                              ...emails_to_invite.map(email => {
                                return{email}
                              })

                            
                            ],
                          
  
                        }
                }
            }
        })



        const formatedStartDate = dayjs(start_at).format('LL')
        const formatedEndDate = dayjs(ends_at).format('LL')
        const mail = await getMailClient()

        const confirmationLink =`${env.API_BASE_URL}/trips/${trip.id}/confirm`

        const message = await mail.sendMail({
            from: {
                name: 'Equipe Planos', 
                address: 'oi@outlook.com',
            },
            to: {
                name: owner_name,
                address: owner_email,
            },
        
            subject: `confirme sua viagem para ${destination} `,
            html: 
            ` 
    <div style="font-family: sans-serif; font-size: 16px; line-height:1.6;">   
        <p>Você foi convidadado para uma viagem para <strong>${destination}</strong>, nas datas de  a   <strong>${formatedStartDate}</strong> até <strong>${formatedEndDate}</strong> </p>

        <p> para confirmar a viagem clique no link abaixo</p>
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

        return  {  tripId:  trip.id  }
    })
}