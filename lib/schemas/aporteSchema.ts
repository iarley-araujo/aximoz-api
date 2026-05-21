// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { z } from 'zod';

// Schema de validação estrita de payload (Sanitização de Input)
export const aporteSchema = z.object({
  // Validação de formato de ticker B3
  codigo_ativo: z.string().min(4, "O código do ativo é inválido ou muito curto."),
  
  // Restrição de tipo (Integer constraint) e bloqueio numérico absoluto (Positive constraint)
  quantidade: z.number().int("A quantidade deve ser um número inteiro.").positive("A quantidade não pode ser zero ou negativa."),
  
  // Validação de ponto flutuante monetário (Prevenção contra injeção de valores negativos)
  valor_aporte: z.number().positive("O valor do aporte deve ser maior que zero! Tentativa de valor negativo bloqueada."),
  
  // Metadado temporal opcional (ISO 8601 suportado)
  data_compra: z.string().optional(),
});