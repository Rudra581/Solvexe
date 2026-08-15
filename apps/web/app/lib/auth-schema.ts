import {z} from "zod"
export const CredentialSchema = z.object({
    username : z.string().email(),
    password : z.string().min(6)
})
