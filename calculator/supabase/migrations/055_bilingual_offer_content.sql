-- ===========================================
-- BILINGUAL OFFER TEMPLATE CONTENT
-- ===========================================
-- Adds separate content fields for Russian and English versions
-- of offer templates, enabling language-specific offers.

-- 1. Add bilingual content columns
ALTER TABLE public.offer_templates 
  ADD COLUMN IF NOT EXISTS content_ru JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_en JSONB DEFAULT '{}';

-- 2. Migrate existing content to content_ru (current text is in Russian)
UPDATE public.offer_templates
SET content_ru = content
WHERE content IS NOT NULL 
  AND content != '{}'::jsonb 
  AND content ->> 'text' IS NOT NULL;

-- 3. Set English version of the standard offer
UPDATE public.offer_templates
SET content_en = jsonb_build_object(
  'text',
  E'OFFER FOR VISUAL CONTENT CREATION SERVICES

1. SUBJECT OF THE OFFER

The Contractor (ReSkin Lab, hereinafter referred to as the "Studio") hereby offers the Client (hereinafter referred to as the "Client") to enter into an agreement for the provision of visual content creation services in accordance with the attached Specification.

The Specification is an integral part of this offer and contains a detailed description of the scope of work, including:
• List of visual elements to be created
• Selected design style
• Terms of use (license)
• Number of included revision rounds

2. COST AND PAYMENT TERMS

Total cost of services: {{grand_total}}

Payment is made in USDT (Tether) cryptocurrency to the Studio''s wallet.
Supported networks: TRC20 (Tron) or ERC20 (Ethereum).

Payment schedule:
• 50% — advance payment (before work begins)
• 25% — upon completion of the production stage
• 25% — final payment (before delivery of materials)

Note: Specific amounts and payment deadlines are indicated in the issued invoices.

3. DELIVERY TIMELINE

Delivery timelines depend on the project scope and the Studio''s current workload.
Estimated timelines will be agreed upon after receiving the advance payment.

Offer valid until: {{valid_until}}

After the offer expires, the Studio reserves the right to revise the terms and cost of work.

4. ACCEPTANCE OF THE OFFER

Acceptance of this offer is made by the Client by:
1. Reading the full text of the offer and Specification
2. Confirming agreement with the terms (clicking the "Accept Offer" button)
3. Making the advance payment according to the issued invoice

The moment of acceptance is recorded in the system with:
• Date and time of acceptance
• Client''s IP address
• Browser identifier
• Full copy of the offer terms

5. INTELLECTUAL PROPERTY

5.1. All created materials are objects of intellectual property.

5.2. Usage rights are transferred to the Client in accordance with the selected license specified in the Specification, after full payment.

5.3. Until full payment is made, all rights to the materials belong to the Studio.

5.4. The Studio retains the right to use created materials in portfolio and marketing purposes, unless otherwise agreed separately.

6. REVISIONS AND CHANGES

6.1. The number of revision rounds included in the cost is specified in the Specification.

6.2. Additional revisions beyond those included are paid separately at agreed rates.

6.3. Significant changes to the scope or concept of the project after work has begun may require revision of the cost and timeline.

7. DISPUTE RESOLUTION

7.1. The parties undertake to resolve all arising disagreements through negotiations.

7.2. If agreement cannot be reached, disputes shall be resolved in accordance with applicable law.

8. OTHER TERMS

8.1. This offer is public and addressed to an unlimited number of persons.

8.2. The Client confirms that they have read all the terms of the offer, understand them, and accept them in full.

8.3. The Studio reserves the right to make changes to the standard terms of the offer. Accepted offers retain their terms at the time of acceptance.

Terms version: {{terms_version}}
Publication date: {{publish_date}}

© ReSkin Lab — Premium Visual Content Studio'
)
WHERE name = 'Стандартная оферта' OR is_active = true;

-- 4. Comments for new columns
COMMENT ON COLUMN public.offer_templates.content_ru IS 
  'Russian version of offer content (JSONB with text field)';
COMMENT ON COLUMN public.offer_templates.content_en IS 
  'English version of offer content (JSONB with text field)';
