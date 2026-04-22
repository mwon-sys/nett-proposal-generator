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
- [ ] PDF generation endpoint (server-side chromium/puppeteer) [deferred - browser print works]
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
- [ ] Download PDF button (server-side rendering - pending) [deferred - browser print works]

## Phase 6: Testing & Delivery
- [x] Vitest tests: 23 passing (fee calc, password, auth logout)
- [x] End-to-end test with Cali Dumpling data (ecommerce)
- [x] End-to-end test with Pacific Dental data (non-ecommerce)
- [x] Fix Market Opportunity stats rendering (copy.marketStats array)
- [x] Fix Goals section rendering (copy.goalsList array)
- [x] Fix Why Nett Solutions section rendering (copy.whyCredentials array)
- [x] Fix CTA section rendering (copy.ctaHeadline, copy.ctaBody)
- [x] Fix team photos CDN URLs
- [x] Fix Meta/TikTok badge rendering
- [x] Save checkpoint (v97034bc1)
- [x] Deliver to Mike

## Phase 7: Design Restoration (Mike's Feedback)
- [x] Upload Nett Solutions white logo (ppclogo_white.png) to CDN
- [x] Cover: Add Nett logo (white), reduce dark overlay so image is more visible, add Prepared For / Date / Prepared By / Website info block
- [x] Market Opportunity: 2x2 grid on left for 4 stats (one highlighted green), bullet points on right with green bullet icons
- [x] Goals: Image on left (from prospect site), 4 numbered goals on right
- [x] Campaign Strategy: Dark background, full-height image on left, ad channel rows with icons on right
- [x] Our Process: Numbered steps with connecting lines, 3-image ribbon at bottom (no gaps between images)
- [x] Investment: Restore original layout - management fee block + one-time setup block side by side, add sliding scale disclaimer text, remove green box style
- [x] Meet the Team: Remove individual rectangular boxes, show team in open grid layout, quote in its own box at bottom, titles in green
- [x] CTA (Ready to Get Started): Add prospect image on the section

## Phase 8: Additional Fixes (Mike's Feedback Round 2)
- [x] Fix Meta and TikTok badges not showing in credentials section at bottom of CTA
- [x] Campaign Strategy rows: add green circle platform logo icon before each channel name
- [x] Campaign Strategy rows: remove monthly budget pill from each row

## Phase 9: Planet Desert Fixes
- [x] Fix cover overlay darkness (too dark, image barely visible)
- [x] Improve image scraping to avoid text-heavy banner images (added banner/slide/promo/delivered keywords to filter list)
