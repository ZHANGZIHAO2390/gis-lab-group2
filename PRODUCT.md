# GIS Lab — Mapping Air Quality

## Product overview
A university GIS laboratory project website for Group 2 (Netherlands case study) at Politecnico di Milano. The site presents air quality analysis results, land cover change detection, and population exposure assessment through an interactive WebGIS.

## Audience
Course instructors (Prof. Yordanov, Dr. Xu) and GIS lab tutors evaluating the project.

## Register
Brand / Marketing — this is a project presentation site, design IS part of the evaluation.

## Design direction
Academic-but-modern. Clean, professional, data-forward. Dark header/hero with satellite imagery feel, white card-based content areas. Strong typographic hierarchy for data tables. OpenLayers map as the centerpiece of the WebGIS page.

## Key pages
1. **Home** (index.html) — Project overview, team members, workflow, data sources
2. **Results** (results.html) — PM2.5 analysis tables, Crops transition stats, zonal statistics, population exposure pie chart
3. **WebGIS** (webgis.html) — Interactive OpenLayers map with AMAC overlay and basemap switcher

## Brand assets
- Color: Deep navy/charcoal header (#0f172a), brand accent #0052d9 (blue), danger #e34d59 (red for negative values), success #00a870 (green)
- Font: Inter (body), monospace for data values
- Logo: None — text-based "GIS Lab · Group 2"

## Content
- All data tables and statistics are final (QGIS-processed)
- Map uses static PNG overlay (amac_overview.png) with OpenLayers
- Bar chart image for zonal statistics
- Pie chart visualization for population exposure
