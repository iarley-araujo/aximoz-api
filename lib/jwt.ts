import { jwtVerify } from 'jose';

export async function verificarTokenJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload; 
  } catch (error) {
    // Retorna null silenciosamente se a chave for falsa ou tiver vencido
    return null; 
  }
}