-- CreateTable
CREATE TABLE "profile_roles" (
    "profile_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_roles_pkey" PRIMARY KEY ("profile_id","role_id")
);

-- CreateIndex
CREATE INDEX "profile_roles_role_id_idx" ON "profile_roles"("role_id");

INSERT INTO "profile_roles" ("profile_id", "role_id")
SELECT "id", "role_id"
FROM "profiles"
WHERE "role_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- AddForeignKey
ALTER TABLE "profile_roles" ADD CONSTRAINT "profile_roles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_roles" ADD CONSTRAINT "profile_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
