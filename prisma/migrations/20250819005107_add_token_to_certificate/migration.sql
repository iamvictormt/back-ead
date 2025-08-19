-- Exemplo para PostgreSQL:
ALTER TABLE "Certificate"
    ADD COLUMN "token" TEXT;

-- Atualiza certificados existentes com token aleatório
UPDATE "Certificate"
SET "token" = encode(gen_random_bytes(16), 'hex');

-- Agora torna a coluna obrigatória e única
ALTER TABLE "Certificate"
    ALTER COLUMN "token" SET NOT NULL;

CREATE UNIQUE INDEX "Certificate_token_unique" ON "Certificate"("token");
