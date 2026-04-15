# Nett Solutions Proposal Generator - TODO

## Phase 1: Database & Assets
- [x] Upload all brand assets to CDN (team photos, badges)
- [x] Create proposals table in database schema
- [x] Run database migration

## Phase 2: Backend
- [x] Add OPENAI_API_KEY secret
- [x] Website scraping utility (fetch images from prospect URL)
- [x] Fee calculation logic (ecommerce + non-ecommerce tiers)
- [x] AI copy generation router (invokeLLM for all 9 sections)
- [x] Proposal save/retrieve procedures
- [ ] PDF generation endpoint (server-side chromium/puppeteer)
- [x] Shareable proposal URL generation

## Phase 3: Frontend - Auth & Form
- [x] Password gate page (Techspace65)
- [x] Intake form with all fields
- [x] Sales rep dropdown (Joe Mounsey, Ally V., Connor, Mike Won, Brandon, Sean)
- [x] Ecommerce toggle
- [x] Ad channel rows with individual budget inputs
- [x] Setup fee field
- [x] Generate proposal button with loading state

## Phase 4: Frontend - Proposal Renderer (9 sections)
- [x] Cover section (Nett logo + Google Premier Partner badge)
- [x] Market Opportunity section
- [x] Goals section
- [x] Campaign Strategy section (Layout B: side image + card list with brand logos)
- [x] Our Process section
- [x] Investment section (fee table with highlighted tier + You badge)
- [x] Meet the Team section (real team photos)
- [x] Why Nett Solutions section (dark navy two-column design)
- [x] CTA section (all accreditation badges)
- [x] Print/PDF CSS (suppress headers/footers, clean page breaks)

## Phase 5: Frontend - Dashboard & Sharing
- [x] Proposal history dashboard (list with client, date, rep, links)
- [x] Shareable proposal view page (permanent URL)
- [x] Copy link button
- [ ] Download PDF button (server-side rendering - pending)

## Phase 6: Testing & Delivery
- [x] Vitest tests: 23 passing (fee calc, password, auth logout)
- [ ] End-to-end test with Cali Dumpling data
- [ ] End-to-end test with Crema Cafe data
- [ ] Fix any rendering issues
- [ ] Save checkpoint
- [ ] Deliver to Mike
