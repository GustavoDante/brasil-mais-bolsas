-- CreateEnum
CREATE TYPE "DurationType" AS ENUM ('DAYS', 'MONTHS', 'YEARS');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('PRESENCIAL', 'SEMI_PRESENCIAL', 'EAD');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BOLETO', 'CREDIT_CARD', 'PIX', 'INTEREST', 'REFUNDED', 'CANCELLED', 'UNDEFINED');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('FISICA', 'JURIDICA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'user',
    "phone" TEXT NOT NULL,
    "secondary_phone" TEXT,
    "whatsapp_phone" TEXT,
    "friend_phone" TEXT,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT,
    "rg" TEXT NOT NULL,
    "rg_emissor" TEXT NOT NULL,
    "family_income" DECIMAL(12,2),
    "ccp" TEXT,
    "observations" TEXT,
    "partner_id" TEXT,
    "register_scholarship" TEXT,
    "institution_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "complement" TEXT,
    "postal_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '123123',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Access" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '123123',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT,
    "email_2" TEXT,
    "phone" TEXT NOT NULL,
    "phone_2" TEXT,
    "phone_3" TEXT,
    "owner_name" TEXT NOT NULL,
    "owner_phone" TEXT,
    "owner_secondary_phone" TEXT,
    "owner_birthdate" TIMESTAMP(3),
    "operator_name" TEXT NOT NULL,
    "operator_phone" TEXT,
    "operator_birthdate" TIMESTAMP(3),
    "operator_2_name" TEXT,
    "operator_2_phone" TEXT,
    "operator_2_birthdate" TIMESTAMP(3),
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "students_count" INTEGER NOT NULL DEFAULT 0,
    "observations" TEXT,
    "old_id" TEXT,
    "fake" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "seller_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "old_id" TEXT,
    "order" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "duration_type" "DurationType" NOT NULL,
    "category_id" TEXT NOT NULL,
    "old_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "type" "ScholarshipType" NOT NULL,
    "full_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL,
    "final_price" DECIMAL(12,2) NOT NULL,
    "is_yearly" BOOLEAN NOT NULL DEFAULT false,
    "registration_fee" DECIMAL(12,2),
    "adhesion_fee" DECIMAL(12,2),
    "registration_fee_discount" DECIMAL(12,2),
    "installments" INTEGER,
    "quantity_offered" INTEGER NOT NULL,
    "renovation_days" INTEGER NOT NULL,
    "register_period_start" TIMESTAMP(3) NOT NULL,
    "register_period_end" TIMESTAMP(3),
    "course_description" TEXT NOT NULL,
    "period" TEXT,
    "liberado_por_qtd_indicacao" INTEGER,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "course_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "old_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "is_renew" BOOLEAN NOT NULL DEFAULT false,
    "defaulter" BOOLEAN NOT NULL DEFAULT false,
    "code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "gateway_order_id" TEXT,
    "gateway_payment_id" TEXT,
    "status" TEXT NOT NULL,
    "payment_type" "PaymentType",
    "code_boleto" TEXT,
    "url_boleto" TEXT,
    "boleto_expire_date" TIMESTAMP(3),
    "full_price" DECIMAL(12,2) NOT NULL,
    "final_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL,
    "installment_count" INTEGER,
    "own_code" TEXT NOT NULL,
    "renew" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "date_paid" TIMESTAMP(3),
    "percent" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignedContract" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "isMobile" BOOLEAN,
    "user_id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "deviceInfo" TEXT NOT NULL,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignedContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indication" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cell" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicationCall" (
    "id" TEXT NOT NULL,
    "indication_id" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "receiver_id" TEXT,
    "description" TEXT NOT NULL,
    "to_return" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicationCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Minor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Minor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PossiblePartner" (
    "id" TEXT NOT NULL,
    "institutionName" TEXT,
    "cnpj" TEXT,
    "modality" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "cell" TEXT NOT NULL,
    "city" TEXT,
    "numStudents" TEXT,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PossiblePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PossiblePartnerCall" (
    "id" TEXT NOT NULL,
    "possible_partner_id" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "receiver_id" TEXT,
    "description" TEXT NOT NULL,
    "to_return" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PossiblePartnerCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "receiver_id" TEXT,
    "description" TEXT NOT NULL,
    "to_return" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "externalReference" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_partner_id_idx" ON "User"("partner_id");

-- CreateIndex
CREATE INDEX "User_register_scholarship_idx" ON "User"("register_scholarship");

-- CreateIndex
CREATE INDEX "User_institution_id_idx" ON "User"("institution_id");

-- CreateIndex
CREATE INDEX "UserIdentity_user_id_idx" ON "UserIdentity"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_provider_provider_account_id_key" ON "UserIdentity"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_user_id_provider_key" ON "UserIdentity"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Address_user_id_key" ON "Address"("user_id");

-- CreateIndex
CREATE INDEX "Address_user_id_idx" ON "Address"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_code_key" ON "Partner"("code");

-- CreateIndex
CREATE INDEX "Access_partner_id_idx" ON "Access"("partner_id");

-- CreateIndex
CREATE INDEX "Institution_seller_id_idx" ON "Institution"("seller_id");

-- CreateIndex
CREATE INDEX "Course_category_id_idx" ON "Course"("category_id");

-- CreateIndex
CREATE INDEX "Scholarship_course_id_idx" ON "Scholarship"("course_id");

-- CreateIndex
CREATE INDEX "Scholarship_institution_id_idx" ON "Scholarship"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE INDEX "Order_user_id_idx" ON "Order"("user_id");

-- CreateIndex
CREATE INDEX "Order_scholarship_id_idx" ON "Order"("scholarship_id");

-- CreateIndex
CREATE INDEX "Payment_user_id_idx" ON "Payment"("user_id");

-- CreateIndex
CREATE INDEX "Payment_scholarship_id_idx" ON "Payment"("scholarship_id");

-- CreateIndex
CREATE INDEX "Payment_order_id_idx" ON "Payment"("order_id");

-- CreateIndex
CREATE INDEX "SignedContract_user_id_idx" ON "SignedContract"("user_id");

-- CreateIndex
CREATE INDEX "SignedContract_scholarship_id_idx" ON "SignedContract"("scholarship_id");

-- CreateIndex
CREATE INDEX "Indication_user_id_idx" ON "Indication"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Indication_email_cell_key" ON "Indication"("email", "cell");

-- CreateIndex
CREATE INDEX "IndicationCall_indication_id_idx" ON "IndicationCall"("indication_id");

-- CreateIndex
CREATE INDEX "IndicationCall_caller_id_idx" ON "IndicationCall"("caller_id");

-- CreateIndex
CREATE INDEX "IndicationCall_receiver_id_idx" ON "IndicationCall"("receiver_id");

-- CreateIndex
CREATE INDEX "Minor_user_id_idx" ON "Minor"("user_id");

-- CreateIndex
CREATE INDEX "PossiblePartnerCall_possible_partner_id_idx" ON "PossiblePartnerCall"("possible_partner_id");

-- CreateIndex
CREATE INDEX "PossiblePartnerCall_caller_id_idx" ON "PossiblePartnerCall"("caller_id");

-- CreateIndex
CREATE INDEX "PossiblePartnerCall_receiver_id_idx" ON "PossiblePartnerCall"("receiver_id");

-- CreateIndex
CREATE INDEX "Call_caller_id_idx" ON "Call"("caller_id");

-- CreateIndex
CREATE INDEX "Call_receiver_id_idx" ON "Call"("receiver_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalClient_externalReference_key" ON "ExternalClient"("externalReference");

-- CreateIndex
CREATE INDEX "ExternalClient_externalReference_idx" ON "ExternalClient"("externalReference");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_register_scholarship_fkey" FOREIGN KEY ("register_scholarship") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Access" ADD CONSTRAINT "Access_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "CourseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignedContract" ADD CONSTRAINT "SignedContract_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignedContract" ADD CONSTRAINT "SignedContract_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indication" ADD CONSTRAINT "Indication_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicationCall" ADD CONSTRAINT "IndicationCall_indication_id_fkey" FOREIGN KEY ("indication_id") REFERENCES "Indication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicationCall" ADD CONSTRAINT "IndicationCall_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicationCall" ADD CONSTRAINT "IndicationCall_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minor" ADD CONSTRAINT "Minor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PossiblePartnerCall" ADD CONSTRAINT "PossiblePartnerCall_possible_partner_id_fkey" FOREIGN KEY ("possible_partner_id") REFERENCES "PossiblePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PossiblePartnerCall" ADD CONSTRAINT "PossiblePartnerCall_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PossiblePartnerCall" ADD CONSTRAINT "PossiblePartnerCall_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalClient" ADD CONSTRAINT "ExternalClient_externalReference_fkey" FOREIGN KEY ("externalReference") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
